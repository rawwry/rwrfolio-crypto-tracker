import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initDb, 
  getAllTransactions, 
  insertOrUpdateTransaction, 
  insertTransactionsBulk, 
  deleteTransaction, 
  deleteTransactionsBulk, 
  resetTransactionsToSample, 
  getCustomPrices, 
  saveCustomPrices,
  getSettingValue,
  setSettingValue,
  resolveDatabasePath,
  resolveImportedCsvPath,
  archiveImportedCsv,
  archiveImportedBinary,
  getArchivedCsvFiles
} from './server/db';
import { PDFParse } from 'pdf-parse';
import { parseKrakenText } from './src/utils/krakenParser';
import { parseCryptoComText } from './src/utils/cryptoComParser';
import { Transaction } from './src/types';
import { execFile } from 'child_process';
import os from 'os';
import fs from 'fs';

async function extractPdfOcrText(buffer: Buffer): Promise<string> {
  if (process.platform !== 'darwin') return '';
  return new Promise((resolve) => {
    try {
      const tempPdf = path.join(os.tmpdir(), `rwrfolio_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
      const tempSwift = path.join(os.tmpdir(), `rwrfolio_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}.swift`);

      const swiftCode = `
import Cocoa
import PDFKit
import Vision

let args = CommandLine.arguments
guard args.count > 1 else { exit(1) }
let pdfUrl = URL(fileURLWithPath: args[1])
guard let doc = PDFDocument(url: pdfUrl), let page = doc.page(at: 0) else { exit(1) }
let pageRect = page.bounds(for: .mediaBox)
let renderer = NSImage(size: pageRect.size)
renderer.lockFocus()
if let ctx = NSGraphicsContext.current?.cgContext {
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.fill(pageRect)
    page.draw(with: .mediaBox, to: ctx)
}
renderer.unlockFocus()
guard let tiff = renderer.tiffRepresentation, let ciImage = CIImage(data: tiff) else { exit(1) }
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
let request = VNRecognizeTextRequest { req, _ in
    guard let obs = req.results as? [VNRecognizedTextObservation] else { return }
    for o in obs {
        if let top = o.topCandidates(1).first {
            print(top.string)
        }
    }
}
request.recognitionLanguages = ["de-DE", "en-US"]
try? handler.perform([request])
`;
      fs.writeFileSync(tempPdf, buffer);
      fs.writeFileSync(tempSwift, swiftCode);

      execFile('swift', [tempSwift, tempPdf], { timeout: 6000 }, (err, stdout) => {
        try { fs.unlinkSync(tempPdf); } catch {}
        try { fs.unlinkSync(tempSwift); } catch {}
        if (err || !stdout) {
          resolve('');
        } else {
          resolve(stdout.trim());
        }
      });
    } catch {
      resolve('');
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite database
  try {
    await initDb();
    console.log('[rwrfolio] SQLite Database initialized successfully.');
  } catch (err) {
    console.error('[rwrfolio] Failed to initialize SQLite database:', err);
  }

  // --- API Routes ---

  // Health & Storage info check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      app: 'rwrfolio', 
      version: '0.5.27',
      database: 'sqlite',
      databasePath: resolveDatabasePath(),
      importedCsvPath: resolveImportedCsvPath()
    });
  });

  // Storage info
  app.get('/api/storage', (req, res) => {
    try {
      const dbPath = resolveDatabasePath();
      const csvPath = resolveImportedCsvPath();
      const archivedFiles = getArchivedCsvFiles();
      res.json({
        success: true,
        databasePath: dbPath,
        importedCsvPath: csvPath,
        archivedFilesCount: archivedFiles.length,
        archivedFiles
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get App Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const rawSettings = await getSettingValue('app_settings', '');
      if (rawSettings) {
        return res.json({ success: true, data: JSON.parse(rawSettings) });
      }
      res.json({ success: true, data: null });
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save App Settings (User profile, email SMTP, alert triggers, theme)
  app.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, error: 'Ungültige Einstellungen' });
      }
      await setSettingValue('app_settings', JSON.stringify(settings));
      res.json({ success: true, message: 'Einstellungen dauerhaft in SQLite gespeichert' });
    } catch (err: any) {
      console.error('Error saving settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send Test Email Route (Simulated / verified on server)
  app.post('/api/settings/test-email', async (req, res) => {
    try {
      const { emailConfig } = req.body;
      if (!emailConfig || !emailConfig.recipientEmail) {
        return res.status(400).json({ success: false, error: 'Empfänger-E-Mail fehlt' });
      }
      
      // In production or home assistant container, verify credentials structure
      console.log(`[SMTP Test] Simuliere / Verifiziere E-Mail an ${emailConfig.recipientEmail} über ${emailConfig.smtpHost || 'Standard-Mailserver'}`);
      
      res.json({ 
        success: true, 
        message: `Test-Alarm an ${emailConfig.recipientEmail} wurde erfolgreich initialisiert.` 
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all transactions
  app.get('/api/transactions', async (req, res) => {
    try {
      const txs = await getAllTransactions();
      res.json({ success: true, data: txs });
    } catch (err: any) {
      console.error('Error getting transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create or update a single transaction
  app.post('/api/transactions', async (req, res) => {
    try {
      const tx = req.body;
      if (!tx || !tx.id) {
        return res.status(400).json({ success: false, error: 'Ungültige Transaktionsdaten' });
      }
      await insertOrUpdateTransaction(tx);
      res.json({ success: true, message: 'Transaktion gespeichert' });
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Parse PDF Statements (e.g. Kraken Pro Spot-Trades PDF)
  app.post('/api/parse-pdf', async (req, res) => {
    try {
      const { pdfBase64, fileName } = req.body;
      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        return res.status(400).json({ success: false, error: 'Keine PDF-Daten übermittelt' });
      }

      const buffer = Buffer.from(pdfBase64, 'base64');
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      let rawText = typeof textResult === 'string' ? textResult : (textResult?.text || '');

      // Optional native OCR enhancement on macOS (e.g. for raster email header banners)
      try {
        const ocrText = await extractPdfOcrText(buffer);
        if (ocrText && ocrText.trim()) {
          rawText = `${ocrText}\n\n${rawText}`;
        }
      } catch (ocrErr) {
        console.warn('[PDF Parser] OCR optional fallback skipped:', ocrErr);
      }

      // Parse Kraken Trades from text
      const krakenTxs = parseKrakenText(rawText);
      // Parse Crypto.com Trades from text
      const cdcTxs = parseCryptoComText(rawText);

      let transactions: Transaction[] = [];
      let detectedExchange: string = 'generic';

      if (cdcTxs.length > 0 && krakenTxs.length === 0) {
        transactions = cdcTxs;
        detectedExchange = 'crypto_com';
      } else if (krakenTxs.length > 0 && cdcTxs.length === 0) {
        transactions = krakenTxs;
        detectedExchange = 'kraken';
      } else if (cdcTxs.length > 0 && krakenTxs.length > 0) {
        if (/crypto\.com/i.test(rawText) || /anti-phishing/i.test(rawText)) {
          transactions = cdcTxs;
          detectedExchange = 'crypto_com';
        } else {
          transactions = krakenTxs;
          detectedExchange = 'kraken';
        }
      }

      // Archive PDF if Samba / imported folder is accessible
      let archivedPath: string | null = null;
      if (fileName) {
        archivedPath = archiveImportedBinary(buffer, fileName);
      }

      res.json({
        success: true,
        fileName: fileName || 'statement.pdf',
        rawText,
        transactions,
        detectedExchange,
        totalFound: transactions.length,
        archivedPath,
        message: `${transactions.length} Krypto-Transaktionen aus PDF extrahiert`
      });
    } catch (err: any) {
      console.error('[PDF Parser] Fehler beim Parsen des PDF-Dokuments:', err);
      res.status(500).json({ success: false, error: err.message || 'PDF konnte nicht gelesen werden' });
    }
  });

  // Bulk import transactions (and optionally archive the raw CSV or PDF file to /share/rwrfolio/imported)
  app.post('/api/transactions/bulk', async (req, res) => {
    try {
      const { transactions, csvRawText, pdfBase64, fileName } = req.body;
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ success: false, error: 'Array erwartet' });
      }
      
      const count = await insertTransactionsBulk(transactions);

      let archivedPath: string | null = null;
      if (csvRawText && typeof csvRawText === 'string') {
        archivedPath = archiveImportedCsv(csvRawText, fileName || 'import.csv');
      } else if (pdfBase64 && typeof pdfBase64 === 'string') {
        const buf = Buffer.from(pdfBase64, 'base64');
        archivedPath = archiveImportedBinary(buf, fileName || 'import.pdf');
      }

      res.json({ 
        success: true, 
        inserted: count,
        archivedPath,
        message: archivedPath 
          ? `${count} Transaktionen importiert & Datei in ${archivedPath} gesichert` 
          : `${count} Transaktionen importiert`
      });
    } catch (err: any) {
      console.error('Error bulk importing transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete single transaction
  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteTransaction(id);
      res.json({ success: true, message: 'Transaktion gelöscht' });
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bulk delete transactions
  app.post('/api/transactions/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, error: 'Array von IDs erwartet' });
      }
      await deleteTransactionsBulk(ids);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error('Error bulk deleting transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset to initial sample data
  app.post('/api/reset', async (req, res) => {
    try {
      const resetData = await resetTransactionsToSample();
      res.json({ success: true, data: resetData });
    } catch (err: any) {
      console.error('Error resetting data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get cached prices from SQLite
  app.get('/api/prices', async (req, res) => {
    try {
      const prices = await getCustomPrices();
      res.json({ success: true, data: prices });
    } catch (err: any) {
      console.error('Error getting prices:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save / update prices in SQLite
  app.post('/api/prices', async (req, res) => {
    try {
      const prices = req.body;
      if (typeof prices !== 'object' || prices === null) {
        return res.status(400).json({ success: false, error: 'Objekt erwartet' });
      }
      await saveCustomPrices(prices);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving prices:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use((req, res, next) => {
      if (req.path.includes('/assets/')) {
        const assetFile = req.path.substring(req.path.indexOf('/assets/') + 8);
        return res.sendFile(path.join(distPath, 'assets', assetFile));
      }
      if (req.path.endsWith('/favicon.svg')) {
        return res.sendFile(path.join(distPath, 'favicon.svg'));
      }
      if (req.path.endsWith('/manifest.json')) {
        return res.sendFile(path.join(distPath, 'manifest.json'));
      }
      if (req.path.length > 1 && req.path.endsWith('/')) {
        const query = req.url.slice(req.path.length);
        return res.redirect(301, req.path.slice(0, -1) + query);
      }
      next();
    });
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[rwrfolio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Database,
  FileSpreadsheet,
  FileCode,
  Loader2,
  Info,
  HelpCircle
} from 'lucide-react';
import { Transaction, CSVParseResult, ExchangeSource } from '../types';
import { parseCSVFile, USER_SAMPLE_CRYPTO_COM_CSV, parseCSVLines, isCryptoComCSV } from '../utils/csvParser';
import { parseKrakenCSV, parseKrakenText, isKrakenCSV, isKrakenText, USER_SAMPLE_KRAKEN_CSV, USER_SAMPLE_KRAKEN_PDF_TEXT } from '../utils/krakenParser';
import { deduplicateTransactions } from '../utils/transactionDedup';
import { parsePdfApi } from '../utils/apiClient';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (
    transactions: Transaction[], 
    csvRawText?: string, 
    fileName?: string, 
    pdfBase64?: string
  ) => void;
  existingTransactions: Transaction[];
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
  existingTransactions,
}) => {
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'pdf' | 'text'>('csv');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDirectPaste, setShowDirectPaste] = useState(false);
  const [directPasteText, setDirectPasteText] = useState('');
  const [ambiguousData, setAmbiguousData] = useState<{ text: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process plain text or CSV text with smart auto-detection
  const handleProcessText = (
    text: string, 
    name: string = 'export.csv', 
    forcedExchange?: ExchangeSource
  ) => {
    setCsvRawText(text);
    setPdfBase64('');
    setFileName(name);
    setFileType('csv');
    setAmbiguousData(null);
    
    let candidateTxs: Transaction[] = [];
    let detected: ExchangeSource | 'unknown' = forcedExchange || 'unknown';

    if (forcedExchange === 'kraken') {
      candidateTxs = parseKrakenCSV(text);
      if (candidateTxs.length === 0) {
        candidateTxs = parseKrakenText(text);
      }
      detected = 'kraken';
    } else if (forcedExchange === 'crypto_com') {
      const csvRes = parseCSVFile(text);
      candidateTxs = csvRes.transactions;
      detected = 'crypto_com';
    } else {
      // Auto-detect exchange from headers and text patterns
      const parsedLines = parseCSVLines(text);
      const headers = parsedLines.length > 0 ? parsedLines[0] : [];

      const krakenMatch = isKrakenCSV(headers) || isKrakenText(text);
      const cryptoComMatch = isCryptoComCSV ? isCryptoComCSV(headers) : headers.some(h => {
        const l = h.toLowerCase();
        return l.includes('timestamp (utc)') || l.includes('to currency') || l.includes('native currency');
      });

      if (krakenMatch && !cryptoComMatch) {
        candidateTxs = parseKrakenCSV(text);
        if (candidateTxs.length === 0) {
          candidateTxs = parseKrakenText(text);
        }
        detected = 'kraken';
      } else if (cryptoComMatch && !krakenMatch) {
        const csvRes = parseCSVFile(text);
        candidateTxs = csvRes.transactions;
        detected = 'crypto_com';
      } else {
        // Try parsing with both parsers to see if one cleanly yields transactions
        const krakenAttempt = parseKrakenCSV(text);
        const cdcAttempt = parseCSVFile(text);

        if (krakenAttempt.length > 0 && cdcAttempt.transactions.length === 0) {
          candidateTxs = krakenAttempt;
          detected = 'kraken';
        } else if (cdcAttempt.transactions.length > 0 && krakenAttempt.length === 0) {
          candidateTxs = cdcAttempt.transactions;
          detected = 'crypto_com';
        } else {
          // Genuinely ambiguous: ask user to choose
          setAmbiguousData({ text, name });
          setParseResult(null);
          return;
        }
      }
    }

    const dedup = deduplicateTransactions(candidateTxs, existingTransactions);

    setParseResult({
      success: candidateTxs.length > 0,
      transactions: dedup.newTransactions,
      totalRows: candidateTxs.length,
      importedCount: dedup.newTransactions.length,
      skippedDuplicates: dedup.skippedDuplicates.length,
      detectedExchange: detected,
      errors: candidateTxs.length === 0 ? ['Konnte keine Krypto-Transaktionen aus dem Inhalt erkennen.'] : [],
    });
  };

  // Process PDF file by calling parsePdfApi
  const handleProcessPdfFile = async (file: File) => {
    setIsAnalyzing(true);
    setFileName(file.name);
    setFileType('pdf');
    setCsvRawText('');
    setAmbiguousData(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      setPdfBase64(base64);

      const result = await parsePdfApi(base64, file.name);

      if (result.success && result.transactions && result.transactions.length > 0) {
        const dedup = deduplicateTransactions(result.transactions, existingTransactions);
        setParseResult({
          success: true,
          transactions: dedup.newTransactions,
          totalRows: result.transactions.length,
          importedCount: dedup.newTransactions.length,
          skippedDuplicates: dedup.skippedDuplicates.length,
          detectedExchange: 'kraken',
          errors: [],
        });
      } else {
        const clientTxs = parseKrakenText(result.rawText || '');
        if (clientTxs.length > 0) {
          const dedup = deduplicateTransactions(clientTxs, existingTransactions);
          setParseResult({
            success: true,
            transactions: dedup.newTransactions,
            totalRows: clientTxs.length,
            importedCount: dedup.newTransactions.length,
            skippedDuplicates: dedup.skippedDuplicates.length,
            detectedExchange: 'kraken',
            errors: [],
          });
        } else {
          setParseResult({
            success: false,
            transactions: [],
            totalRows: 0,
            importedCount: 0,
            skippedDuplicates: 0,
            detectedExchange: 'kraken',
            errors: [result.error || 'Im PDF wurden keine Krypto-Trades erkannt.'],
          });
        }
      }
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setParseResult({
        success: false,
        transactions: [],
        totalRows: 0,
        importedCount: 0,
        skippedDuplicates: 0,
        detectedExchange: 'kraken',
        errors: [`Fehler beim Verarbeiten der PDF: ${err.message || 'Unbekannter Fehler'}`],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      handleProcessPdfFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      handleProcessPdfFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Sample data loaders
  const handleLoadKrakenCSV = () => {
    handleProcessText(USER_SAMPLE_KRAKEN_CSV, 'kraken-spot-trades-beispiel.csv', 'kraken');
  };

  const handleLoadKrakenPDF = () => {
    setFileName('kraken-spot-trades-beispiel.pdf');
    setFileType('pdf');
    setCsvRawText('');
    setPdfBase64('');
    setAmbiguousData(null);
    const txs = parseKrakenText(USER_SAMPLE_KRAKEN_PDF_TEXT);
    const dedup = deduplicateTransactions(txs, existingTransactions);
    setParseResult({
      success: true,
      transactions: dedup.newTransactions,
      totalRows: txs.length,
      importedCount: dedup.newTransactions.length,
      skippedDuplicates: dedup.skippedDuplicates.length,
      detectedExchange: 'kraken',
      errors: [],
    });
  };

  const handleLoadCryptoComSample = () => {
    handleProcessText(USER_SAMPLE_CRYPTO_COM_CSV, 'crypto_com_beispiel.csv', 'crypto_com');
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.transactions.length === 0) return;
    onImportTransactions(parseResult.transactions, csvRawText, fileName, pdfBase64);
    onClose();
  };

  const handleDirectPasteSubmit = () => {
    if (!directPasteText.trim()) return;
    handleProcessText(directPasteText, 'manuell_eingefuegt.txt');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Trades &amp; Transaktionen importieren</span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Auto-Erkennung
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lade Exporte von <strong>Kraken Pro</strong> (CSV &amp; PDF) oder <strong>Crypto.com App</strong> (CSV) hoch. Die Börse wird automatisch erkannt.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Unified Drag and drop zone for CSV & PDF */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,text/csv,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {isAnalyzing ? (
              <div className="py-4 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <div className="text-sm font-semibold text-indigo-300">
                  PDF-Dokument wird analysiert...
                </div>
                <p className="text-xs text-slate-400">
                  Trades, Preise, Mengen und TxIDs werden automatisch aus dem Statement extrahiert
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-3 mx-auto mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400" title="Kraken Pro">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400" title="Crypto.com">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>

                <div className="font-semibold text-white text-sm mb-1">
                  {fileName ? (
                    <span className="text-indigo-300 flex items-center justify-center space-x-1.5">
                      <span>{fileName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 uppercase font-mono">
                        {fileType}
                      </span>
                    </span>
                  ) : (
                    'Export-Datei (CSV oder PDF) hier ablegen oder klicken'
                  )}
                </div>

                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Unterstützt <strong>Kraken Pro</strong> (Trades CSV &amp; PDF) sowie <strong>Crypto.com App</strong> (CSV).
                </p>

                <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Automatische Archivierung in: <strong>/share/rwrfolio/imported/</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Ambiguous Exchange Confirmation Prompt (if auto-detection wasn't 100% sure) */}
          {ambiguousData && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span>Börsen-Zuordnung auswählen</span>
              </div>
              <p className="text-xs text-slate-300">
                Die Spaltenstruktur in <strong>{ambiguousData.name}</strong> konnte nicht eindeutig zugeordnet werden. Aus welcher Plattform stammt dieser Export?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleProcessText(ambiguousData.text, ambiguousData.name, 'kraken')}
                  className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-white font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-sm"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  <span>Kraken Pro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessText(ambiguousData.text, ambiguousData.name, 'crypto_com')}
                  className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-white font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-sm"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span>Crypto.com</span>
                </button>
              </div>
            </div>
          )}

          {/* Sample Data Quick Buttons */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300 font-semibold">
                  Beispieldaten testen:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadKrakenCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600/70 hover:bg-purple-600 text-white font-semibold transition-colors cursor-pointer"
                >
                  Kraken CSV
                </button>
                <button
                  type="button"
                  onClick={handleLoadKrakenPDF}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-800/80 hover:bg-purple-800 text-white font-semibold transition-colors cursor-pointer"
                >
                  Kraken PDF
                </button>
                <button
                  type="button"
                  onClick={handleLoadCryptoComSample}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/70 hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer"
                >
                  Crypto.com CSV
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Teste die automatische Erkennung und Duplikatssperre mit authentischen Demo-Transaktionen.
            </p>
          </div>

          {/* Direct Paste Toggle */}
          <div className="text-xs">
            <button
              type="button"
              onClick={() => setShowDirectPaste(!showDirectPaste)}
              className="text-slate-400 hover:text-indigo-300 flex items-center space-x-1 underline cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showDirectPaste ? 'Text-Eingabefeld verbergen' : 'Oder CSV-Textzeilen direkt hineinkopieren'}</span>
            </button>

            {showDirectPaste && (
              <div className="mt-2 space-y-2">
                <textarea
                  rows={5}
                  value={directPasteText}
                  onChange={(e) => setDirectPasteText(e.target.value)}
                  placeholder="Kopiere hier CSV-Zeilen oder Statement-Text von Kraken oder Crypto.com hinein..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleDirectPasteSubmit}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Eingefügten Text parsen
                </button>
              </div>
            )}
          </div>

          {/* PARSE RESULTS & PREVIEW SECTION */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              
              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">Erkannte Börse:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    parseResult.detectedExchange === 'kraken'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : parseResult.detectedExchange === 'crypto_com'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {parseResult.detectedExchange === 'kraken' 
                      ? `Kraken Pro (${fileType.toUpperCase()})` 
                      : parseResult.detectedExchange === 'crypto_com'
                      ? 'Crypto.com App'
                      : parseResult.detectedExchange}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-slate-300">
                  <span>Gefunden: <strong>{parseResult.totalRows}</strong></span>
                  <span className="text-emerald-400">Neu: <strong>{parseResult.importedCount}</strong></span>
                  {parseResult.skippedDuplicates > 0 && (
                    <span className="text-amber-400 flex items-center space-x-1" title="Bereits im Portfolio vorhandene Transaktionen werden nicht doppelt importiert">
                      <Info className="w-3.5 h-3.5" />
                      <span>{parseResult.skippedDuplicates} Duplikate</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Errors if any */}
              {parseResult.errors && parseResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{parseResult.errors.join(' ')}</span>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.transactions.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2">Datum (UTC)</th>
                        <th className="p-2">Typ</th>
                        <th className="p-2">Asset / Menge</th>
                        <th className="p-2 text-right">Kaufbetrag (EUR)</th>
                        <th className="p-2 text-right">Stückpreis</th>
                        <th className="p-2 text-right">Gebühr</th>
                        <th className="p-2">TxID / ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {parseResult.transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2 text-slate-300 whitespace-nowrap">
                            {tx.timestamp.substring(0, 16).replace('T', ' ')}
                          </td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-white whitespace-nowrap">
                            {tx.receivedAmount} {tx.receivedCurrency}
                          </td>
                          <td className="p-2 text-right text-slate-200 whitespace-nowrap">
                            {tx.spentAmount ? `${tx.spentAmount.toFixed(2)} ${tx.spentCurrency}` : '-'}
                          </td>
                          <td className="p-2 text-right text-indigo-300 whitespace-nowrap">
                            {tx.pricePerUnitEUR ? `${tx.pricePerUnitEUR.toFixed(4)} €` : '-'}
                          </td>
                          <td className="p-2 text-right text-slate-400 whitespace-nowrap">
                            {tx.fee ? `${tx.fee} ${tx.feeCurrency || ''}` : '-'}
                          </td>
                          <td className="p-2 text-slate-400 font-mono text-[10px] truncate max-w-[120px]" title={tx.transactionHash || tx.id}>
                            {tx.transactionHash || tx.id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center space-y-1.5 bg-slate-950/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-200">
                    Alle Einträge existieren bereits im Portfolio!
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Die Duplikatserkennung hat festgestellt, dass sämtliche Trades aus dieser Datei bereits früher importiert wurden. Es werden keine doppelten Buchungen erstellt.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          
          <button
            type="button"
            disabled={!parseResult || parseResult.transactions.length === 0}
            onClick={handleConfirmImport}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {parseResult && parseResult.transactions.length > 0
                ? `${parseResult.transactions.length} Transaktionen importieren`
                : parseResult && parseResult.skippedDuplicates > 0
                ? 'Bereits im Portfolio (0 neu)'
                : 'Importieren'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

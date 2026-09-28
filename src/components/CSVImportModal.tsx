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
  Info
} from 'lucide-react';
import { Transaction, CSVParseResult, ExchangeSource } from '../types';
import { parseCSVFile, USER_SAMPLE_CRYPTO_COM_CSV, parseGenericCSV, parseCSVLines } from '../utils/csvParser';
import { parseKrakenCSV, parseKrakenText, USER_SAMPLE_KRAKEN_CSV, USER_SAMPLE_KRAKEN_PDF_TEXT } from '../utils/krakenParser';
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
  const [activeTab, setActiveTab] = useState<'kraken' | 'crypto_com' | 'generic'>('kraken');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'pdf' | 'text'>('csv');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDirectPaste, setShowDirectPaste] = useState(false);
  const [directPasteText, setDirectPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generic mapping state
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [customSource, setCustomSource] = useState<string>('binance');
  const [colTime, setColTime] = useState<number>(0);
  const [colCoin, setColCoin] = useState<number>(1);
  const [colAmount, setColAmount] = useState<number>(2);
  const [colSpent, setColSpent] = useState<number>(3);

  if (!isOpen) return null;

  // Process plain text or CSV text
  const handleProcessText = (
    text: string, 
    name: string = 'export.csv', 
    forcedExchange?: ExchangeSource
  ) => {
    setCsvRawText(text);
    setPdfBase64('');
    setFileName(name);
    setFileType('csv');
    
    let candidateTxs: Transaction[] = [];
    let detected: ExchangeSource | 'unknown' = forcedExchange || 'generic';

    if (forcedExchange === 'kraken') {
      candidateTxs = parseKrakenCSV(text);
      if (candidateTxs.length === 0) {
        candidateTxs = parseKrakenText(text);
      }
      detected = 'kraken';
    } else {
      const csvRes = parseCSVFile(text);
      candidateTxs = csvRes.transactions;
      detected = csvRes.detectedExchange;
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

    const parsedLines = parseCSVLines(text);
    setRawRows(parsedLines);
  };

  // Process PDF file by extracting base64 and calling parsePdfApi
  const handleProcessPdfFile = async (file: File) => {
    setIsAnalyzing(true);
    setFileName(file.name);
    setFileType('pdf');
    setCsvRawText('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert buffer to base64
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      setPdfBase64(base64);

      // Call server-side PDF extraction endpoint
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
        // Fallback: check if text has been extracted and run client-side text parser
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
        handleProcessText(text, file.name, activeTab === 'kraken' ? 'kraken' : undefined);
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
        handleProcessText(text, file.name, activeTab === 'kraken' ? 'kraken' : undefined);
      };
      reader.readAsText(file);
    }
  };

  // Sample data loaders
  const handleLoadKrakenCSV = () => {
    setActiveTab('kraken');
    handleProcessText(USER_SAMPLE_KRAKEN_CSV, 'kraken-spot-trades-2026-08-29-2026-09-28.csv', 'kraken');
  };

  const handleLoadKrakenPDF = () => {
    setActiveTab('kraken');
    setFileName('kraken-spot-trades-2026-08-29-2026-09-28.pdf');
    setFileType('pdf');
    setCsvRawText('');
    setPdfBase64('');
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
    setActiveTab('crypto_com');
    handleProcessText(USER_SAMPLE_CRYPTO_COM_CSV, 'crypto_com_export.csv', 'crypto_com');
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.transactions.length === 0) return;
    onImportTransactions(parseResult.transactions, csvRawText, fileName, pdfBase64);
    onClose();
  };

  const handleApplyGenericMapping = () => {
    if (rawRows.length < 2) return;
    const txs = parseGenericCSV(rawRows, {
      timestampCol: colTime,
      coinCol: colCoin,
      amountCol: colAmount,
      spentAmountCol: colSpent,
      exchangeSource: customSource,
    });

    const dedup = deduplicateTransactions(txs, existingTransactions);

    setParseResult({
      success: dedup.newTransactions.length > 0 || dedup.skippedDuplicates.length > 0,
      transactions: dedup.newTransactions,
      totalRows: rawRows.length - 1,
      importedCount: dedup.newTransactions.length,
      skippedDuplicates: dedup.skippedDuplicates.length,
      detectedExchange: customSource as ExchangeSource,
      errors: txs.length === 0 ? ['Konnte keine Transaktionen mit diesen Spaltenzuordnungen generieren.'] : [],
    });
  };

  const handleDirectPasteSubmit = () => {
    if (!directPasteText.trim()) return;
    if (activeTab === 'kraken') {
      const candidateTxs = parseKrakenText(directPasteText);
      const dedup = deduplicateTransactions(candidateTxs, existingTransactions);
      setFileName('manuell_eingefuegt_kraken.txt');
      setFileType('text');
      setParseResult({
        success: candidateTxs.length > 0,
        transactions: dedup.newTransactions,
        totalRows: candidateTxs.length,
        importedCount: dedup.newTransactions.length,
        skippedDuplicates: dedup.skippedDuplicates.length,
        detectedExchange: 'kraken',
        errors: candidateTxs.length === 0 ? ['Konnte keine Kraken Trades aus dem Text extrahieren.'] : [],
      });
    } else {
      handleProcessText(directPasteText, 'manuell_eingefuegt.csv');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Trades &amp; Transaktionen importieren</span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CSV &amp; PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Importiere Spot-Trades von Kraken Pro (CSV / PDF) oder Crypto.com App
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

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('kraken')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'kraken'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Kraken Pro (CSV &amp; PDF)</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto_com')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'crypto_com'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Crypto.com App (CSV)</span>
          </button>
          <button
            onClick={() => setActiveTab('generic')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'generic'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Andere Börsen / Manuell
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* TAB 1: Kraken Pro (CSV & PDF) */}
          {activeTab === 'kraken' && (
            <div className="space-y-4">
              
              {/* Drag and drop zone for CSV & PDF */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-950/20'
                    : 'border-slate-700/80 hover:border-purple-500/60 bg-slate-950/50 hover:bg-slate-950/80'
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
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                    <div className="text-sm font-semibold text-purple-300">
                      PDF-Dokument wird analysiert...
                    </div>
                    <p className="text-xs text-slate-400">
                      Trades, Preise, Mengen und TxIDs werden automatisch aus dem Statement extrahiert
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center space-x-2 mx-auto mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="font-semibold text-white text-sm mb-1">
                      {fileName ? (
                        <span className="text-purple-300 flex items-center justify-center space-x-1.5">
                          <span>{fileName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 uppercase font-mono">
                            {fileType}
                          </span>
                        </span>
                      ) : (
                        'Kraken CSV oder PDF hier ablegen oder klicken'
                      )}
                    </div>

                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Unterstützt <strong>Kraken Pro Trades Export (.csv)</strong> sowie <strong>Kraken Pro Trade Statements (.pdf)</strong>.
                    </p>

                    <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-purple-300">
                      <Database className="w-3.5 h-3.5" />
                      <span>Automatische Ablage im Home Assistant Samba-Share: <strong>/share/rwrfolio/imported/</strong></span>
                    </div>
                  </>
                )}
              </div>

              {/* Sample Data Quick Buttons for Kraken */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300 font-semibold">
                      Kraken Pro Beispieldaten testen (Käufe von BTC, POL, HBAR, AKT, DOT):
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleLoadKrakenCSV}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-semibold transition-colors cursor-pointer"
                    >
                      Beispiel CSV laden
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadKrakenPDF}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition-colors cursor-pointer"
                    >
                      Beispiel PDF-Text laden
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Beide Beispieldokumente enthalten identische Werte und demonstrieren die automatische Duplikatserkennung.
                </p>
              </div>

              {/* Direct Paste Toggle */}
              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => setShowDirectPaste(!showDirectPaste)}
                  className="text-slate-400 hover:text-purple-300 flex items-center space-x-1 underline cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showDirectPaste ? 'Text-Eingabefeld ausblenden' : 'Statement-Text oder CSV manuell einfügen'}</span>
                </button>

                {showDirectPaste && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      rows={5}
                      value={directPasteText}
                      onChange={(e) => setDirectPasteText(e.target.value)}
                      placeholder="Füge hier den kopierten Text aus deinem Kraken PDF oder die CSV-Zeilen ein..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleDirectPasteSubmit}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Eingefügten Text parsen
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Crypto.com Flow */}
          {activeTab === 'crypto_com' && (
            <div className="space-y-4">
              
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold text-white text-sm mb-1">
                  {fileName ? (
                    <span className="text-emerald-400">{fileName}</span>
                  ) : (
                    'Crypto.com CSV-Datei hier ablegen oder klicken'
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Unterstützt die Export-Dateien aus der <strong>Crypto.com App</strong> (Transaktionsverlauf &gt; Exportieren als CSV)
                </p>
                <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>Wird automatisch in Samba <strong>/share/rwrfolio/imported/</strong> archiviert</span>
                </div>
              </div>

              {/* Sample Data Quick Button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Möchtest du die bereitgestellte <strong>Crypto.com Beispieldatei</strong> testen?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadCryptoComSample}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold flex-shrink-0 transition-colors cursor-pointer"
                >
                  Beispieldaten laden
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Generic / Custom Mapper */}
          {activeTab === 'generic' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="font-semibold text-white text-sm">
                  Benutzerdefinierte Spaltenzuordnung für beliebige Börsen
                </div>
                <p className="text-slate-400">
                  Lade eine CSV-Datei hoch und wähle aus, welche Spalte das Datum, das Krypto-Asset, die erhaltene Menge und den bezahlten Betrag enthält.
                </p>
                
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />

                {rawRows.length > 1 && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Quelle / Börse</label>
                        <select
                          value={customSource}
                          onChange={(e) => setCustomSource(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          <option value="kraken">Kraken</option>
                          <option value="binance">Binance</option>
                          <option value="coinbase">Coinbase</option>
                          <option value="bitpanda">Bitpanda</option>
                          <option value="other">Sonstige</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Datum / Zeit Spalte</label>
                        <select
                          value={colTime}
                          onChange={(e) => setColTime(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          {rawRows[0].map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h || `Index ${i}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Krypto Asset Spalte</label>
                        <select
                          value={colCoin}
                          onChange={(e) => setColCoin(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          {rawRows[0].map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h || `Index ${i}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Menge Spalte</label>
                        <select
                          value={colAmount}
                          onChange={(e) => setColAmount(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          {rawRows[0].map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h || `Index ${i}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Kaufpreis / EUR Spalte</label>
                        <select
                          value={colSpent}
                          onChange={(e) => setColSpent(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          {rawRows[0].map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h || `Index ${i}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyGenericMapping}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Spaltenzuordnung anwenden
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                          <td className="p-2 text-right text-purple-300 whitespace-nowrap">
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
                    Die Duplikatserkennung hat festgestellt, dass sämtliche Trades aus dieser {fileType.toUpperCase()}-Datei bereits früher importiert wurden. Es werden keine doppelten Buchungen erstellt.
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
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all cursor-pointer ${
              activeTab === 'kraken'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
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

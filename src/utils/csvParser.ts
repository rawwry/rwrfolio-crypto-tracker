import { Transaction, TransactionType, ExchangeSource, CSVParseResult } from '../types';
import { isKrakenCSV, parseKrakenCSVRows } from './krakenParser';
import {
  USER_SAMPLE_CRYPTO_COM_CSV,
  USER_SAMPLE_CRYPTO_COM_EMAIL_TEXT,
  isCryptoComCSV,
  isCryptoComText,
  parseCryptoComCSV,
  parseCryptoComText,
  parseCryptoComEmailReceipts
} from './cryptoComParser';

export {
  USER_SAMPLE_CRYPTO_COM_CSV,
  USER_SAMPLE_CRYPTO_COM_EMAIL_TEXT,
  isCryptoComCSV,
  isCryptoComText,
  parseCryptoComCSV,
  parseCryptoComText,
  parseCryptoComEmailReceipts
};

// Robust CSV Line Splitter taking quotes into account
export function parseCSVLines(text: string): string[][] {
  const lines: string[][] = [];
  const rawLines = text.split(/\r\n|\n|\r/);
  
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';
    
    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        if (insideQuote && rawLine[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    lines.push(row);
  }
  
  return lines;
}

export function detectCSVFormat(headers: string[]): ExchangeSource | 'generic' {
  if (isCryptoComCSV(headers)) {
    return 'crypto_com';
  }
  if (isKrakenCSV(headers)) {
    return 'kraken';
  }
  return 'generic';
}

// Generic CSV parser for manual or other exchanges
export function parseGenericCSV(
  rows: string[][],
  mapping: {
    timestampCol: number;
    typeCol?: number;
    coinCol: number;
    amountCol: number;
    spentAmountCol?: number;
    spentCurrencyCol?: number;
    exchangeSource?: string;
  }
): Transaction[] {
  if (rows.length < 2) return [];
  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawTimestamp = row[mapping.timestampCol] || new Date().toISOString();
    const coin = (row[mapping.coinCol] || 'UNKNOWN').toUpperCase();
    const FIAT_SET = new Set(['EUR', 'USD', 'ZEUR', 'ZUSD', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD']);
    if (coin === 'UNKNOWN' || FIAT_SET.has(coin)) {
      continue;
    }
    const rawAmt = parseFloat((row[mapping.amountCol] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const rawSpent = mapping.spentAmountCol !== undefined ? parseFloat((row[mapping.spentAmountCol] || '0').replace(/[^0-9.-]/g, '')) : 0;
    const spentCurr = mapping.spentCurrencyCol !== undefined ? row[mapping.spentCurrencyCol] || 'EUR' : 'EUR';

    let type: TransactionType = 'BUY';
    if (mapping.typeCol !== undefined && row[mapping.typeCol]) {
      const t = row[mapping.typeCol].toLowerCase();
      if (t.includes('sell') || t.includes('verkauf')) type = 'SELL';
      else if (t.includes('reward') || t.includes('stake') || t.includes('earn')) type = 'REWARD';
      else if (t.includes('transfer') || t.includes('deposit') || t.includes('withdraw')) type = 'TRANSFER';
    }

    const recAmt = Math.abs(rawAmt);
    const spentAmt = Math.abs(rawSpent || 0);

    let pricePerUnitEUR = recAmt > 0 && spentAmt > 0 && spentCurr.toUpperCase() === 'EUR' ? spentAmt / recAmt : undefined;

    const id = `gen_${rawTimestamp}_${coin}_${recAmt}_${i}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    transactions.push({
      id,
      timestamp: rawTimestamp,
      source: (mapping.exchangeSource as ExchangeSource) || 'other',
      type,
      description: `${type === 'BUY' ? 'Gekauft' : type} ${coin}`,
      spentCurrency: spentCurr,
      spentAmount: spentAmt,
      receivedCurrency: coin,
      receivedAmount: recAmt,
      pricePerUnitEUR,
    });
  }

  return transactions;
}

export function parseCSVFile(csvContent: string): CSVParseResult {
  const rows = parseCSVLines(csvContent);
  if (rows.length === 0) {
    return {
      success: false,
      transactions: [],
      totalRows: 0,
      importedCount: 0,
      skippedDuplicates: 0,
      detectedExchange: 'unknown',
      errors: ['Die Datei enthält keine Daten oder ist leer.'],
    };
  }

  const detectedExchange = detectCSVFormat(rows[0]);
  let transactions: Transaction[] = [];

  if (detectedExchange === 'crypto_com') {
    transactions = parseCryptoComCSV(rows);
  } else if (detectedExchange === 'kraken') {
    transactions = parseKrakenCSVRows(rows);
  } else {
    // Attempt kraken parser first if kraken rows match, then crypto.com fallback
    const krakenTxs = parseKrakenCSVRows(rows);
    if (krakenTxs.length > 0) {
      transactions = krakenTxs;
    } else {
      transactions = parseCryptoComCSV(rows);
    }
  }

  return {
    success: transactions.length > 0,
    transactions,
    totalRows: rows.length - 1,
    importedCount: transactions.length,
    skippedDuplicates: 0,
    detectedExchange,
    errors: transactions.length === 0 ? ['Konnte keine Krypto-Transaktionen aus der CSV-Struktur extrahieren.'] : [],
  };
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'Timestamp (UTC)',
    'Exchange Source',
    'Type',
    'Description',
    'Received Currency',
    'Received Amount',
    'Spent Currency',
    'Spent Amount',
    'Price Per Unit (EUR)',
    'Native Amount (USD)',
    'Transaction Kind',
    'Transaction Hash',
    'Notes',
  ];

  const rows = transactions.map(t => [
    `"${t.timestamp}"`,
    `"${t.source}"`,
    `"${t.type}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.receivedCurrency}"`,
    t.receivedAmount.toString(),
    `"${t.spentCurrency}"`,
    t.spentAmount.toString(),
    (t.pricePerUnitEUR || (t.spentAmount > 0 && t.receivedAmount > 0 ? (t.spentAmount / t.receivedAmount) : 0)).toFixed(4),
    (t.nativeAmountUSD || 0).toString(),
    `"${t.transactionKind || ''}"`,
    `"${t.transactionHash || ''}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

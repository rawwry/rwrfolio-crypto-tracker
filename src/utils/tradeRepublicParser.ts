import { Transaction, TransactionType } from '../types';
import { parseCSVLines } from './csvParser';

function cleanNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if CSV headers match Trade Republic account statement / activity export
 */
export function isTradeRepublicCSV(headers: string[]): boolean {
  if (!headers || headers.length === 0) return false;
  const lower = headers.map(h => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));
  return (
    lower.includes('datetime') &&
    lower.includes('asset_class') &&
    lower.includes('shares') &&
    (lower.includes('transaction_id') || lower.includes('account_type') || lower.includes('mcc_code'))
  );
}

/**
 * Check if raw string contains Trade Republic CSV header signature
 */
export function isTradeRepublicText(text: string): boolean {
  if (!text) return false;
  const firstLine = text.split(/\r\n|\n|\r/)[0].toLowerCase();
  return (
    firstLine.includes('datetime') &&
    firstLine.includes('asset_class') &&
    firstLine.includes('shares')
  );
}

/**
 * Parse Trade Republic CSV text and extract ONLY Crypto transactions.
 * Non-crypto assets (STOCK, FUND, CASH interest, dividends, etc.) are strictly filtered out.
 */
export function parseTradeRepublicCSV(csvText: string): Transaction[] {
  const rows = parseCSVLines(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const getIndex = (name: string) => headers.findIndex(h => h === name.toLowerCase());

  const dtIdx = getIndex('datetime');
  const catIdx = getIndex('category');
  const typeIdx = getIndex('type');
  const assetClassIdx = getIndex('asset_class');
  const nameIdx = getIndex('name');
  const symIdx = getIndex('symbol');
  const sharesIdx = getIndex('shares');
  const priceIdx = getIndex('price');
  const amountIdx = getIndex('amount');
  const feeIdx = getIndex('fee');
  const currIdx = getIndex('currency');
  const descIdx = getIndex('description');
  const txIdIdx = getIndex('transaction_id');

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => !c)) continue;

    const assetClass = (assetClassIdx !== -1 ? row[assetClassIdx] : '').trim().toUpperCase();
    
    // STRICT FILTER: We only import cryptocurrency transactions, ignoring stocks, funds, etc.
    if (assetClass !== 'CRYPTO') {
      continue;
    }

    const rawType = (typeIdx !== -1 ? row[typeIdx] : '').trim().toUpperCase();
    const rawCategory = (catIdx !== -1 ? row[catIdx] : '').trim().toUpperCase();
    let rawSymbol = (symIdx !== -1 ? row[symIdx] : '').trim().toUpperCase();
    const rawName = (nameIdx !== -1 ? row[nameIdx] : '').trim();
    const rawShares = sharesIdx !== -1 ? row[sharesIdx] : '0';
    const rawPrice = priceIdx !== -1 ? row[priceIdx] : '0';
    const rawAmount = amountIdx !== -1 ? row[amountIdx] : '0';
    const rawFee = feeIdx !== -1 ? row[feeIdx] : '0';
    const currency = (currIdx !== -1 ? row[currIdx] : 'EUR').trim().toUpperCase() || 'EUR';
    const rawDesc = descIdx !== -1 ? row[descIdx] : '';
    const rawTxId = txIdIdx !== -1 ? row[txIdIdx] : '';
    const rawDatetime = dtIdx !== -1 ? row[dtIdx] : '';

    if (!rawSymbol) continue;

    // Normalization (e.g. MATIC -> POL)
    if (rawSymbol === 'MATIC' || rawSymbol === 'POLYGON') {
      rawSymbol = 'POL';
    }

    const shares = cleanNumber(rawShares);
    const price = cleanNumber(rawPrice);
    const amount = cleanNumber(rawAmount);
    const fee = cleanNumber(rawFee);

    let timestamp = rawDatetime;
    try {
      const d = new Date(rawDatetime);
      if (!isNaN(d.getTime())) {
        timestamp = d.toISOString();
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    let txType: TransactionType = 'BUY';
    let spentCurrency = currency;
    let spentAmount = 0;
    let receivedCurrency = rawSymbol;
    let receivedAmount = 0;
    let pricePerUnitEUR = price > 0 ? price : 0;

    if (rawType === 'BUY') {
      txType = 'BUY';
      receivedCurrency = rawSymbol;
      receivedAmount = Math.abs(shares);
      spentCurrency = currency;
      spentAmount = Math.abs(amount) > 0 ? Math.abs(amount) : Math.abs(shares * price);
      spentAmount = Math.round(spentAmount * 100) / 100;
      if (pricePerUnitEUR <= 0 && receivedAmount > 0) {
        pricePerUnitEUR = spentAmount / receivedAmount;
      }
    } else if (rawType === 'SELL') {
      txType = 'SELL';
      spentCurrency = rawSymbol;
      spentAmount = Math.abs(shares);
      receivedCurrency = currency;
      receivedAmount = Math.abs(amount) > 0 ? Math.abs(amount) : Math.abs(shares * price);
      receivedAmount = Math.round(receivedAmount * 100) / 100;
      if (pricePerUnitEUR <= 0 && spentAmount > 0) {
        pricePerUnitEUR = receivedAmount / spentAmount;
      }
    } else if (rawType === 'FREE_RECEIPT' || rawCategory === 'DELIVERY') {
      txType = 'TRANSFER';
      if (shares >= 0) {
        receivedCurrency = rawSymbol;
        receivedAmount = Math.abs(shares);
        spentCurrency = currency;
        spentAmount = Math.abs(amount); // 0 in Trade Republic
      } else {
        spentCurrency = rawSymbol;
        spentAmount = Math.abs(shares);
        receivedCurrency = currency;
        receivedAmount = Math.abs(amount);
      }
    } else {
      // Fallback
      if (shares < 0) {
        txType = 'SELL';
        spentCurrency = rawSymbol;
        spentAmount = Math.abs(shares);
        receivedCurrency = currency;
        receivedAmount = Math.abs(amount) > 0 ? Math.round(Math.abs(amount) * 100) / 100 : 0;
      } else {
        txType = 'BUY';
        receivedCurrency = rawSymbol;
        receivedAmount = Math.abs(shares);
        spentCurrency = currency;
        spentAmount = Math.abs(amount) > 0 ? Math.round(Math.abs(amount) * 100) / 100 : 0;
      }
    }

    const uniqueId = rawTxId || `${timestamp}_${rawSymbol}_${Math.abs(shares)}`;
    const id = `tr_${uniqueId}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    transactions.push({
      id,
      timestamp,
      source: 'trade_republic',
      type: txType,
      description: rawDesc || `Trade Republic ${txType === 'BUY' ? 'Kauf' : txType === 'SELL' ? 'Verkauf' : 'Übertrag'} ${rawSymbol}`,
      spentCurrency,
      spentAmount,
      receivedCurrency,
      receivedAmount,
      pricePerUnitEUR: pricePerUnitEUR > 0 ? pricePerUnitEUR : undefined,
      fee: Math.abs(fee) > 0 ? Math.abs(fee) : undefined,
      feeCurrency: currency,
      notes: rawName ? `${rawName} (${rawCategory} / ${rawType})` : undefined,
      importedAt: new Date().toISOString(),
    });
  }

  return transactions;
}

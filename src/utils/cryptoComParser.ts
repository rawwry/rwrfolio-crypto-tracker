import { Transaction, TransactionType, ExchangeSource } from '../types';
import { parseCSVLines } from './csvParser';

export const USER_SAMPLE_CRYPTO_COM_CSV = `Timestamp (UTC),Transaction Description,Currency,Amount,To Currency,To Amount,Native Currency,Native Amount,Native Amount (in USD),Transaction Kind,Transaction Hash
2026-09-01 21:46:44,Bought POL,EUR,-300.00,POL,3537.49,USD,343.713311999867340190124011521,343.713311999867340190124011521,viban_purchase,
2026-09-01 14:41:18,Bought HBAR,EUR,-300.00,HBAR,4416.65,USD,344.006896499925429975932745594,344.006896499925429975932745594,viban_purchase,
2026-09-01 14:40:48,Bought AKT,EUR,-300.00,AKT,629.608,USD,343.997999999829363232080084643,343.997999999829363232080084643,viban_purchase,
2026-09-01 14:40:16,Bought DOT,EUR,-300.00,DOT,379.291,USD,344.039516999927701461339347683,344.039516999927701461339347683,viban_purchase,
2026-07-25 06:49:14,Bought BTC,EUR,-340.00,BTC,0.0058933,USD,384.419996999884879146631433525,384.419996999884879146631433525,viban_purchase,
2026-07-01 21:08:00,Bought BTC,EUR,-666.00,BTC,0.0122107,USD,753.481194569641410357812516889,753.481194569641410357812516889,viban_purchase,
2026-06-07 08:09:51,Bought BTC,EUR,-770.00,BTC,0.0138279,USD,882.314433000155290957697202632,882.314433000155290957697202632,viban_purchase,
2026-06-01 06:29:05,Bought BTC,EUR,-888.00,BTC,0.0137917,USD,1028.900789279676264165721132603,1028.900789279676264165721132603,trading.limit_order.cash_account.purchase_commit,`;

export const USER_SAMPLE_CRYPTO_COM_EMAIL_TEXT = `Von: Crypto.com hello@crypto.com
Betreff: POL Kaufanfrage bestätigt
Datum: 01.09.2026, 23:46:47
An: timo.vorwald@gmail.com
Anti-Phishing-Code: RawwryAntiphishCode

Lieber TIMO VORWALD,
Sie haben 3537.49 POL gekauft. Sie können sich bei Crypto.com anmelden
und die Details überprüfen.
Betrag: 	3537.49 POL
Handelsgebühren: 	€2.39 EUR
Methode: 	Banküberweisung
Gesamt: 	€300.0 EUR
ÜBERPRÜFEN IHREN SALDO
Wenn Sie diese Anfrage nicht gestellt haben, sind wir hier, um zu helfen! Sie
erreichen uns über chat.crypto.com.
Mit freundlichen Grüßen,
Das Crypto.com Team`;

/**
 * Clean numeric string handling both European (58.420,50) and US (58,420.50) number formats
 */
function cleanNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim().replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // German format: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 8) {
      // Decimal comma: 300,00
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const result = parseFloat(str);
  return isNaN(result) ? 0 : result;
}

/**
 * Helper to parse currency and numerical amount from a string like "€300.0 EUR", "$50.00", "2.39 EUR"
 */
function parseCurrencyAndAmount(raw: string): { amount: number; currency: string } {
  if (!raw) return { amount: 0, currency: 'EUR' };
  const str = raw.trim();
  let currency = 'EUR';
  if (str.includes('€') || /EUR/i.test(str)) currency = 'EUR';
  else if (str.includes('$') || /USD/i.test(str)) currency = 'USD';
  else if (str.includes('£') || /GBP/i.test(str)) currency = 'GBP';
  else if (str.includes('CHF') || /CHF/i.test(str)) currency = 'CHF';

  const num = cleanNumber(str);
  return { amount: num, currency };
}

/**
 * Checks whether CSV headers match Crypto.com App export
 */
export function isCryptoComCSV(headers: string[]): boolean {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const headerStr = lowerHeaders.join(',');

  if (headerStr.includes('timestamp (utc)') && headerStr.includes('transaction description') && headerStr.includes('to currency')) {
    return true;
  }
  if (lowerHeaders.includes('timestamp (utc)') || (lowerHeaders.includes('to amount') && lowerHeaders.includes('transaction description'))) {
    return true;
  }
  return false;
}

/**
 * Checks whether text matches Crypto.com email confirmation receipt or statement
 */
export function isCryptoComText(text: string): boolean {
  if (!text || !text.trim()) return false;
  const l = text.toLowerCase();
  
  if (l.includes('crypto.com') || l.includes('chat.crypto.com') || l.includes('viban_purchase')) {
    return true;
  }
  if (l.includes('anti-phishing-code') || l.includes('anti-phishing code')) {
    return true;
  }
  if ((l.includes('kaufanfrage bestätigt') || l.includes('purchase request confirmed')) &&
      (l.includes('betrag') || l.includes('amount') || l.includes('gesamt') || l.includes('total'))) {
    return true;
  }
  if ((l.includes('sie haben') || l.includes('you bought') || l.includes('you sold')) &&
      (l.includes('gekauft') || l.includes('verkauft') || l.includes('bought') || l.includes('sold')) &&
      (l.includes('handelsgebühren') || l.includes('trading fee') || l.includes('gesamt') || l.includes('total'))) {
    return true;
  }
  return false;
}

/**
 * Parses a single Crypto.com email receipt text block into a Transaction
 */
export function parseCryptoComEmailReceipt(text: string): Transaction | null {
  if (!text || !text.trim()) return null;

  const isCdc = 
    /crypto\.com/i.test(text) || 
    /anti-phishing/i.test(text) ||
    /kaufanfrage bestätigt|purchase request confirmed/i.test(text) ||
    /sie haben.*gekauft|sie haben.*verkauft|you bought|you sold/i.test(text);

  if (!isCdc) return null;

  // 1. Transaction Type (BUY or SELL)
  let isBuy = true;
  if (/verkauft|you sold|verkauf von|sale of/i.test(text)) {
    isBuy = false;
  } else if (/gekauft|you bought|kaufanfrage|purchase request|kauf von/i.test(text)) {
    isBuy = true;
  }
  const type: TransactionType = isBuy ? 'BUY' : 'SELL';

  // 2. Symbol & Volume
  let symbol = '';
  let volume = 0;

  // Pattern A: "Sie haben 3537.49 POL gekauft" / "You bought 3537.49 POL"
  const phraseMatch = text.match(/(?:Sie haben|You bought|You sold)\s+([\d.,]+)\s+([A-Za-z0-9]{2,12})\s+(?:gekauft|verkauft)?/i);
  if (phraseMatch) {
    volume = cleanNumber(phraseMatch[1]);
    symbol = phraseMatch[2].toUpperCase();
  }

  // Pattern B: "Betrag: 3537.49 POL" / "Amount: 3537.49 POL"
  const betragMatch = text.match(/(?:Betrag|Amount):[ \t]*([\d.,]+)[ \t]*([A-Za-z0-9]{2,12})/i);
  if (betragMatch) {
    if (!volume) volume = cleanNumber(betragMatch[1]);
    if (!symbol) symbol = betragMatch[2].toUpperCase();
  }

  // Pattern C: Subject line "POL Kaufanfrage bestätigt" / "POL Purchase Request Confirmed"
  if (!symbol) {
    const subjMatch = text.match(/(?:Betreff|Subject):[ \t]*([A-Za-z0-9]{2,12})\s*(?:Kaufanfrage|Purchase)/i);
    if (subjMatch) {
      symbol = subjMatch[1].toUpperCase();
    }
  }

  // Fallback: search title header
  if (!symbol) {
    const titleMatch = text.match(/\b([A-Za-z0-9]{2,12})\s+(?:Kaufanfrage|Purchase Request)\b/i);
    if (titleMatch) {
      symbol = titleMatch[1].toUpperCase();
    }
  }

  if (!symbol || symbol === 'UNKNOWN') return null;

  // 3. Gesamt / Total & Quote Currency
  let cost = 0;
  let quoteCurrency = 'EUR';
  const gesamtMatch = text.match(/(?:Gesamt|Total):[ \t]*([€$£A-Za-z0-9., \t]+?)(?:\r?\n|$)/i);
  if (gesamtMatch) {
    const parsed = parseCurrencyAndAmount(gesamtMatch[1]);
    cost = parsed.amount;
    quoteCurrency = parsed.currency;
  }

  // 4. Fees
  let fee = 0;
  let feeCurrency = quoteCurrency;
  const feeMatch = text.match(/(?:Handelsgebühren|Trading Fee[s]?):[ \t]*([€$£A-Za-z0-9., \t]+?)(?:\r?\n|$)/i);
  if (feeMatch) {
    const parsed = parseCurrencyAndAmount(feeMatch[1]);
    fee = parsed.amount;
    feeCurrency = parsed.currency;
  }

  // 5. Payment Method
  let method = '';
  const methodMatch = text.match(/(?:Methode|Method):[ \t]*([^\r\n]+)/i);
  if (methodMatch) {
    method = methodMatch[1].trim();
  }

  // 6. Date & Time
  let timestamp = new Date().toISOString();
  // Format: "Datum: 01.09.2026, 23:46:47" or "Date: 01.09.2026, 23:46:47" or "Datum: 01.09.2026 um 23:46:47"
  const dateMatch = text.match(/(?:Datum|Date):\s*(\d{1,2})[./](\d{1,2})[./](\d{4}),?\s*(?:um\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);
    const hour = parseInt(dateMatch[4], 10);
    const min = parseInt(dateMatch[5], 10);
    const sec = dateMatch[6] ? parseInt(dateMatch[6], 10) : 0;
    
    // Evaluate as local timestamp (which accurately offsets CEST UTC+2 to UTC)
    const localDate = new Date(year, month - 1, day, hour, min, sec);
    if (!isNaN(localDate.getTime())) {
      timestamp = localDate.toISOString();
    }
  } else {
    // English/ISO Date fallback: "Date: 2026-09-01 21:46:47" or "Date: Sep 01, 2026 at 21:46"
    const isoMatch = text.match(/(?:Datum|Date):\s*(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)/i);
    if (isoMatch) {
      try {
        const d = new Date(isoMatch[1].replace(' ', 'T') + 'Z');
        if (!isNaN(d.getTime())) {
          timestamp = d.toISOString();
        }
      } catch {}
    }
  }

  // Calculation & Validation
  if (volume <= 0 || cost <= 0) return null;

  const spentCurr = isBuy ? quoteCurrency : symbol;
  const spentAmt = isBuy ? cost : volume;
  const recCurr = isBuy ? symbol : quoteCurrency;
  const recAmt = isBuy ? volume : cost;

  let pricePerUnitEUR: number | undefined = undefined;
  let pricePerUnitUSD: number | undefined = undefined;

  if (quoteCurrency.toUpperCase() === 'EUR' && volume > 0) {
    pricePerUnitEUR = Number((cost / volume).toFixed(6));
  } else if (quoteCurrency.toUpperCase() === 'USD' && volume > 0) {
    pricePerUnitUSD = Number((cost / volume).toFixed(6));
  }

  const id = `cdc_receipt_${timestamp}_${symbol}_${volume}_${cost}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id,
    timestamp,
    source: 'crypto_com',
    type,
    description: `Crypto.com Kaufbeleg ${symbol}`,
    spentCurrency: spentCurr,
    spentAmount: spentAmt,
    receivedCurrency: recCurr,
    receivedAmount: recAmt,
    pricePerUnitEUR,
    pricePerUnitUSD,
    fee: fee > 0 ? fee : undefined,
    feeCurrency: fee > 0 ? feeCurrency : undefined,
    transactionKind: 'email_receipt',
    notes: `Crypto.com E-Mail Kaufbeleg | Methode: ${method || 'App'}${fee > 0 ? ` | Gebühr: €${fee}` : ''}`,
  };
}

/**
 * Extracts multiple email receipts if present, or single receipt from raw text
 */
export function parseCryptoComEmailReceipts(rawText: string): Transaction[] {
  if (!rawText || !rawText.trim()) return [];

  // First try parsing as a single unified email receipt
  const single = parseCryptoComEmailReceipt(rawText);
  if (single) {
    return [single];
  }

  // If not a single receipt, test splitting on multiple email header boundaries
  const blocks = rawText.split(/(?=(?:Von|From):\s*Crypto\.com)/gi);
  const transactions: Transaction[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;
    const tx = parseCryptoComEmailReceipt(block);
    if (tx) {
      transactions.push(tx);
    }
  }

  // Deduplicate within extracted results by id
  const seenIds = new Set<string>();
  const uniqueTxs: Transaction[] = [];
  for (const tx of transactions) {
    if (!seenIds.has(tx.id)) {
      seenIds.add(tx.id);
      uniqueTxs.push(tx);
    }
  }

  return uniqueTxs;
}

/**
 * Parses Crypto.com CSV rows
 */
export function parseCryptoComCSV(rows: string[][]): Transaction[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const getIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const tsIdx = getIndex('Timestamp (UTC)');
  const descIdx = getIndex('Transaction Description');
  const currIdx = getIndex('Currency');
  const amountIdx = getIndex('Amount');
  const toCurrIdx = getIndex('To Currency');
  const toAmountIdx = getIndex('To Amount');
  const nativeCurrIdx = getIndex('Native Currency');
  const nativeAmountIdx = getIndex('Native Amount');
  const nativeUSDIdx = getIndex('Native Amount (in USD)');
  const kindIdx = getIndex('Transaction Kind');
  const hashIdx = getIndex('Transaction Hash');

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => !c)) continue;

    const rawTimestamp = tsIdx !== -1 ? row[tsIdx] : '';
    const desc = descIdx !== -1 ? row[descIdx] : '';
    const currency = currIdx !== -1 ? row[currIdx] : '';
    const rawAmount = amountIdx !== -1 ? row[amountIdx] : '0';
    const toCurrency = toCurrIdx !== -1 ? row[toCurrIdx] : '';
    const rawToAmount = toAmountIdx !== -1 ? row[toAmountIdx] : '0';
    const nativeCurr = nativeCurrIdx !== -1 ? row[nativeCurrIdx] : '';
    const nativeAmount = nativeAmountIdx !== -1 ? parseFloat(row[nativeAmountIdx]) || undefined : undefined;
    const nativeUSD = nativeUSDIdx !== -1 ? parseFloat(row[nativeUSDIdx]) || undefined : undefined;
    const kind = kindIdx !== -1 ? row[kindIdx] : '';
    const hash = hashIdx !== -1 ? row[hashIdx] : '';

    if (!rawTimestamp && !desc && !currency && !toCurrency) continue;

    const amountVal = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0;
    const toAmountVal = parseFloat(rawToAmount.replace(/[^0-9.-]/g, '')) || 0;

    let type: TransactionType = 'BUY';
    let spentCurr = currency;
    let spentAmt = Math.abs(amountVal);
    let recCurr = toCurrency;
    let recAmt = Math.abs(toAmountVal);

    const descLower = desc.toLowerCase();
    const kindLower = kind.toLowerCase();

    // Ignore pure fiat deposits/withdrawals
    const FIAT_SET = new Set(['EUR', 'USD', 'ZEUR', 'ZUSD', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD']);
    const isPureFiat =
      FIAT_SET.has((currency || '').toUpperCase()) &&
      (!toCurrency || FIAT_SET.has(toCurrency.toUpperCase())) &&
      (descLower.includes('deposit') || descLower.includes('withdraw') || descLower.includes('top-up') || descLower.includes('top up') || descLower.includes('recharge') || descLower.includes('fiat') || descLower.includes('transfer') || kindLower.includes('fiat_deposit') || kindLower.includes('viban_deposit') || kindLower.includes('fiat_withdrawal'));

    if (isPureFiat) {
      continue;
    }

    if (descLower.startsWith('bought') || kindLower.includes('purchase') || kindLower.includes('buy')) {
      type = 'BUY';
      spentCurr = currency || 'EUR';
      spentAmt = Math.abs(amountVal);
      recCurr = toCurrency || desc.replace(/^bought\s+/i, '').trim();
      recAmt = Math.abs(toAmountVal);
    } else if (descLower.startsWith('sold') || kindLower.includes('sell')) {
      type = 'SELL';
      spentCurr = currency;
      spentAmt = Math.abs(amountVal);
      recCurr = toCurrency || 'EUR';
      recAmt = Math.abs(toAmountVal);
    } else if (descLower.includes('cashback') || descLower.includes('reward') || descLower.includes('earn') || descLower.includes('interest')) {
      type = 'REWARD';
      spentCurr = 'EUR';
      spentAmt = 0;
      recCurr = currency || toCurrency;
      recAmt = Math.abs(amountVal > 0 ? amountVal : toAmountVal);
    } else if (descLower.includes('deposit') || descLower.includes('withdraw') || descLower.includes('transfer')) {
      type = 'TRANSFER';
      spentCurr = currency;
      spentAmt = Math.abs(amountVal);
      recCurr = currency;
      recAmt = Math.abs(amountVal);
    } else {
      if (amountVal < 0 && toAmountVal > 0) {
        type = 'BUY';
      } else if (amountVal > 0 && toAmountVal < 0) {
        type = 'SELL';
      }
    }

    const recUpper = (recCurr || currency || '').toUpperCase();
    const spentUpper = (spentCurr || '').toUpperCase();
    if ((FIAT_SET.has(recUpper) || recUpper === 'UNKNOWN' || !recUpper) && (FIAT_SET.has(spentUpper) || spentUpper === 'UNKNOWN' || !spentUpper)) {
      continue;
    }

    let timestamp = rawTimestamp;
    try {
      if (rawTimestamp) {
        const dateObj = new Date(rawTimestamp.replace(' ', 'T') + (rawTimestamp.includes('Z') ? '' : 'Z'));
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.toISOString();
        }
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    let pricePerUnitEUR: number | undefined = undefined;
    let pricePerUnitUSD: number | undefined = undefined;

    if (type === 'BUY' && recAmt > 0) {
      if (spentCurr.toUpperCase() === 'EUR') {
        pricePerUnitEUR = spentAmt / recAmt;
      } else if (nativeCurr.toUpperCase() === 'EUR' && nativeAmount) {
        pricePerUnitEUR = nativeAmount / recAmt;
      }

      if (nativeUSD && nativeUSD > 0) {
        pricePerUnitUSD = nativeUSD / recAmt;
      } else if (spentCurr.toUpperCase() === 'USD') {
        pricePerUnitUSD = spentAmt / recAmt;
      } else if (nativeCurr.toUpperCase() === 'USD' && nativeAmount) {
        pricePerUnitUSD = nativeAmount / recAmt;
      }

      if (!pricePerUnitEUR && pricePerUnitUSD && nativeUSD && spentAmt > 0 && spentCurr.toUpperCase() === 'EUR') {
        pricePerUnitEUR = spentAmt / recAmt;
      }
    }

    const id = `cdc_${timestamp}_${recCurr}_${recAmt}_${spentAmt}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    transactions.push({
      id,
      timestamp,
      source: 'crypto_com',
      type,
      description: desc || `${type === 'BUY' ? 'Bought' : 'Transaction'} ${recCurr}`,
      spentCurrency: spentCurr || 'EUR',
      spentAmount: spentAmt,
      receivedCurrency: recCurr || currency,
      receivedAmount: recAmt,
      pricePerUnitEUR,
      pricePerUnitUSD,
      nativeCurrency: nativeCurr,
      nativeAmount,
      nativeAmountUSD: nativeUSD,
      transactionKind: kind,
      transactionHash: hash,
    });
  }

  return transactions;
}

/**
 * Universal Crypto.com text parser: parses email confirmations or CSV text
 */
export function parseCryptoComText(rawText: string): Transaction[] {
  if (!rawText || !rawText.trim()) return [];

  // 1. First attempt to parse as email confirmation receipt(s)
  const emailTxs = parseCryptoComEmailReceipts(rawText);
  if (emailTxs.length > 0) {
    return emailTxs;
  }

  // 2. If no email receipts found, attempt to parse as CSV lines
  const rows = parseCSVLines(rawText);
  if (rows.length >= 2) {
    return parseCryptoComCSV(rows);
  }

  return [];
}

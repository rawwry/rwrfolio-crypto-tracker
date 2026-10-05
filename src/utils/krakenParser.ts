import { Transaction, TransactionType } from '../types';
import { parseCSVLines } from './csvParser';

export const USER_SAMPLE_KRAKEN_CSV = `"txid","ordertxid","pair","time","type","ordertype","price","cost","fee","vol","margin","misc","ledgers"
"TK65D4-7XYAA-3K6Z9A","OX6R2D-YYZA2-81729A","XXBTZEUR","2026-09-01 14:40:16.0000","buy","limit","58420.50000","300.00000","0.75000","0.00513518","0.00000","","L12345"
"TKB791-4PLM2-99881A","OX9812-ZZKL1-12093B","POL/EUR","2026-09-01 21:46:44.0000","buy","market","0.08480","300.00000","0.75000","3537.49000","0.00000","","L12346"
"TK8821-MMNP3-55122C","OX4412-BBVC4-77112C","HBAR/EUR","2026-09-01 14:41:18.0000","buy","market","0.06792","300.00000","0.75000","4416.65000","0.00000","","L12347"
"TK3391-KKLL4-11883D","OX1199-AABB5-99221D","AKT/EUR","2026-09-01 14:40:48.0000","buy","market","0.47648","300.00000","0.75000","629.60800","0.00000","","L12348"
"TK7712-JJHH5-44332E","OX5522-CCDD6-33445E","DOT/EUR","2026-09-01 14:40:16.0000","buy","market","0.79095","300.00000","0.75000","379.29100","0.00000","","L12349"`;

export const USER_SAMPLE_KRAKEN_PDF_TEXT = `Kraken Pro - Spot Trades Statement
Statement Period: 2026-08-29 to 2026-09-28 (UTC)
Account: Pro Spot Trading

Date/Time (UTC) Pair Type Subtype Price Amount Cost Fee TxID
2026-09-01 14:40:16 BTC/EUR Buy Spot 58,420.50 EUR 0.00513518 BTC 300.00 EUR 0.75 EUR TK65D4-7XYAA-3K6Z9A
2026-09-01 21:46:44 POL/EUR Buy Spot 0.08480 EUR 3,537.49 POL 300.00 EUR 0.75 EUR TKB791-4PLM2-99881A
2026-09-01 14:41:18 HBAR/EUR Buy Spot 0.06792 EUR 4,416.65 HBAR 300.00 EUR 0.75 EUR TK8821-MMNP3-55122C
2026-09-01 14:40:48 AKT/EUR Buy Spot 0.47648 EUR 629.608 AKT 300.00 EUR 0.75 EUR TK3391-KKLL4-11883D
2026-09-01 14:40:16 DOT/EUR Buy Spot 0.79095 EUR 379.291 DOT 300.00 EUR 0.75 EUR TK7712-JJHH5-44332E`;

export const USER_SAMPLE_KRAKEN_EMAIL_TEXT = `Von: Kraken noreply@kraken.com
Betreff: You bought ONDO
Datum: 4. Oktober 2026 um 23:52
An: timo.vorwald@gmail.com
You bought ONDO
A total of 177.467 ONDO was added to your account balance.
Here are the details:
Paid €80 with account balance
Transaction ID: BQZ4TQZ
Date: Oct 04, 2026
ONDO price: €0.4463
Fees: €0.79
Check balance
Transactions may not be cancelled once initiated. All purchases are final and non-refundable.`;


/**
 * Normalizes Kraken specific asset symbols (e.g. XXBT -> BTC, ZEUR -> EUR)
 */
export function normalizeKrakenAsset(asset: string): string {
  if (!asset) return 'UNKNOWN';
  const a = asset.trim().toUpperCase();
  const map: Record<string, string> = {
    'XXBT': 'BTC',
    'XBT': 'BTC',
    'XETH': 'ETH',
    'XLTC': 'LTC',
    'XXRP': 'XRP',
    'XXLM': 'XLM',
    'XXDG': 'DOGE',
    'XDG': 'DOGE',
    'XETC': 'ETC',
    'XMLN': 'MLN',
    'XREP': 'REP',
    'ZEUR': 'EUR',
    'ZUSD': 'USD',
    'ZGBP': 'GBP',
    'ZCAD': 'CAD',
    'ZJPY': 'JPY',
    'USDT': 'USDT',
    'USDC': 'USDC',
  };
  return map[a] || a;
}

/**
 * Parses trading pair into base asset and quote currency.
 * Handles BTC/EUR, XXBTZEUR, POL/EUR, SOL-USD, etc.
 */
export function parseKrakenPair(rawPair: string): { base: string; quote: string } {
  if (!rawPair) return { base: 'UNKNOWN', quote: 'EUR' };
  let pair = rawPair.trim().toUpperCase();

  // Slash or dash delimiter: BTC/EUR or BTC-EUR
  if (pair.includes('/') || pair.includes('-')) {
    const parts = pair.split(/[\/\-]/);
    return {
      base: normalizeKrakenAsset(parts[0]),
      quote: normalizeKrakenAsset(parts[1] || 'EUR'),
    };
  }

  // Common Kraken fiat/quote endings
  const quoteSuffixes = ['ZEUR', 'EUR', 'ZUSD', 'USD', 'ZGBP', 'GBP', 'ZCAD', 'CAD', 'ZJPY', 'JPY', 'USDT', 'USDC'];
  for (const suffix of quoteSuffixes) {
    if (pair.endsWith(suffix) && pair.length > suffix.length) {
      const basePart = pair.substring(0, pair.length - suffix.length);
      return {
        base: normalizeKrakenAsset(basePart),
        quote: normalizeKrakenAsset(suffix),
      };
    }
  }

  // 6 char pair fallback (e.g. BTCEUR -> BTC / EUR)
  if (pair.length === 6) {
    return {
      base: normalizeKrakenAsset(pair.substring(0, 3)),
      quote: normalizeKrakenAsset(pair.substring(3)),
    };
  }

  return { base: normalizeKrakenAsset(pair), quote: 'EUR' };
}

/**
 * Clean numeric string handling both European (58.420,50) and US (58,420.50) number formats
 */
export function cleanNumber(val: string | number | undefined | null): number {
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
 * Helper to parse month names in German and English
 */
export function parseMonthName(mStr: string): number {
  if (!mStr) return -1;
  const m = mStr.toLowerCase().trim();
  if (m.startsWith('jan')) return 0;
  if (m.startsWith('feb')) return 1;
  if (m.startsWith('mär') || m.startsWith('mar')) return 2;
  if (m.startsWith('apr')) return 3;
  if (m.startsWith('mai') || m.startsWith('may')) return 4;
  if (m.startsWith('jun')) return 5;
  if (m.startsWith('jul')) return 6;
  if (m.startsWith('aug')) return 7;
  if (m.startsWith('sep')) return 8;
  if (m.startsWith('okt') || m.startsWith('oct')) return 9;
  if (m.startsWith('nov')) return 10;
  if (m.startsWith('dez') || m.startsWith('dec')) return 11;
  return -1;
}

/**
 * Helper to parse currency symbol/code and numeric value
 */
export function parseCurrencyAndAmount(str: string): { currency: string; amount: number } {
  if (!str) return { currency: 'EUR', amount: 0 };
  let currency = 'EUR';
  if (str.includes('$')) currency = 'USD';
  else if (str.includes('£')) currency = 'GBP';
  else if (str.includes('CHF')) currency = 'CHF';
  else if (/EUR\b/i.test(str) || str.includes('€')) currency = 'EUR';
  else if (/USD\b/i.test(str)) currency = 'USD';
  else if (/GBP\b/i.test(str)) currency = 'GBP';

  const amount = cleanNumber(str);
  return { currency, amount };
}

/**
 * Check if CSV headers match Kraken export
 */
export function isKrakenCSV(headers: string[]): boolean {
  const lower = headers.map(h => h.toLowerCase().trim());
  const headerStr = lower.join(',');

  const hasPair = lower.includes('pair') || headerStr.includes('pair');
  const hasTime = lower.includes('time') || lower.includes('date') || headerStr.includes('time');
  const hasTxid = lower.includes('txid') || lower.includes('ordertxid') || headerStr.includes('txid');
  const hasVolOrCost = lower.includes('vol') || lower.includes('cost') || lower.includes('price');

  return (hasPair && hasTime && (hasTxid || hasVolOrCost)) ||
         (lower.includes('txid') && lower.includes('ordertxid')) ||
         (headerStr.includes('kraken'));
}

/**
 * Check if plain text appears to be Kraken export/statement or email receipt
 */
export function isKrakenText(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes('kraken')) return true;
  if (lower.includes('spot trades') || lower.includes('trades statement')) return true;
  if (lower.includes('txid') && lower.includes('pair') && lower.includes('price')) return true;
  if (lower.includes('you bought') || lower.includes('you sold') || lower.includes('du hast') || lower.includes('account balance')) return true;
  if (lower.includes('payward') && lower.includes('transaction id')) return true;
  return false;
}

/**
 * Parse Kraken CSV rows into standard Transactions
 */
export function parseKrakenCSVRows(rows: string[][]): Transaction[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));
  const getIndex = (...candidates: string[]) => {
    for (const cand of candidates) {
      const idx = headers.findIndex(h => h === cand || h.includes(cand));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const txidIdx = getIndex('txid', 'trade id', 'id');
  const orderTxidIdx = getIndex('ordertxid', 'order id');
  const postTxidIdx = getIndex('posttxid');
  const ledgersIdx = getIndex('ledgers', 'ledger id', 'ledger', 'refid');
  const pairIdx = getIndex('pair', 'market', 'symbol');
  const timeIdx = getIndex('time', 'date', 'timestamp');
  const typeIdx = getIndex('type', 'side');
  const subtypeIdx = getIndex('subtype');
  const ordertypeIdx = getIndex('ordertype', 'order type');
  const priceIdx = getIndex('price', 'rate');
  const costIdx = getIndex('cost', 'total', 'value');
  const feeIdx = getIndex('fee');
  const volIdx = getIndex('vol', 'volume', 'amount');

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => !c.trim())) continue;

    const rawTxid = txidIdx !== -1 ? row[txidIdx]?.trim() : '';
    const rawOrderTxid = orderTxidIdx !== -1 ? row[orderTxidIdx]?.trim() : '';
    const rawPostTxid = postTxidIdx !== -1 ? row[postTxidIdx]?.trim() : '';
    const finalOrderOrPostId = rawOrderTxid || rawPostTxid;
    const rawLedgers = ledgersIdx !== -1 ? row[ledgersIdx]?.trim() : '';
    const rawPair = pairIdx !== -1 ? row[pairIdx]?.trim() : '';
    const rawTime = timeIdx !== -1 ? row[timeIdx]?.trim() : '';
    const rawType = typeIdx !== -1 ? row[typeIdx]?.trim() : '';
    const rawSubtype = subtypeIdx !== -1 ? row[subtypeIdx]?.trim() : '';
    const rawOrdertype = ordertypeIdx !== -1 ? row[ordertypeIdx]?.trim() : '';
    const rawPrice = priceIdx !== -1 ? row[priceIdx]?.trim() : '0';
    const rawCost = costIdx !== -1 ? row[costIdx]?.trim() : '0';
    const rawFee = feeIdx !== -1 ? row[feeIdx]?.trim() : '0';
    const rawVol = volIdx !== -1 ? row[volIdx]?.trim() : '0';

    if (!rawPair && !rawVol && !rawCost) continue;

    const { base, quote } = parseKrakenPair(rawPair);
    const FIAT_SET = new Set(['EUR', 'USD', 'ZEUR', 'ZUSD', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD']);
    if (!base || base === 'UNKNOWN' || FIAT_SET.has(base.toUpperCase())) {
      continue;
    }

    const side = rawType.toLowerCase();
    const isBuy = side === 'buy' || side.includes('kauf');

    const volume = Math.abs(cleanNumber(rawVol));
    if (volume <= 0) continue;
    let cost = Math.abs(cleanNumber(rawCost));
    const price = cleanNumber(rawPrice);
    const fee = cleanNumber(rawFee);

    // If cost is 0 but price and volume are known, calculate cost
    if (cost === 0 && price > 0 && volume > 0) {
      cost = price * volume;
    }

    // Format ISO Timestamp
    let timestamp = rawTime;
    try {
      if (rawTime) {
        const cleanTs = rawTime.replace(' ', 'T');
        const dateObj = new Date(cleanTs.includes('Z') ? cleanTs : cleanTs + 'Z');
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.toISOString();
        }
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    const type: TransactionType = isBuy ? 'BUY' : 'SELL';
    const spentCurr = isBuy ? quote : base;
    const spentAmt = isBuy ? cost : volume;
    const recCurr = isBuy ? base : quote;
    const recAmt = isBuy ? volume : cost;

    let pricePerUnitEUR: number | undefined = undefined;
    let pricePerUnitUSD: number | undefined = undefined;

    if (quote.toUpperCase() === 'EUR') {
      pricePerUnitEUR = price > 0 ? price : (volume > 0 ? cost / volume : undefined);
    } else if (quote.toUpperCase() === 'USD' || quote.toUpperCase() === 'USDT' || quote.toUpperCase() === 'USDC') {
      pricePerUnitUSD = price > 0 ? price : (volume > 0 ? cost / volume : undefined);
    }

    const txIdUnique = rawTxid || `kraken_${timestamp}_${base}_${volume}_${cost}`;
    const id = `kraken_${txIdUnique}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    const notesParts = [`Kraken Pro | Pair: ${rawPair}`];
    if (finalOrderOrPostId) notesParts.push(`Order ID: ${finalOrderOrPostId}`);
    if (rawPostTxid && rawPostTxid !== finalOrderOrPostId) notesParts.push(`PostTxID: ${rawPostTxid}`);
    if (rawLedgers) notesParts.push(`Ledgers: ${rawLedgers}`);

    transactions.push({
      id,
      timestamp,
      source: 'kraken',
      type,
      description: `Kraken ${isBuy ? 'Kauf' : 'Verkauf'} ${base}`,
      spentCurrency: spentCurr,
      spentAmount: spentAmt,
      receivedCurrency: recCurr,
      receivedAmount: recAmt,
      pricePerUnitEUR,
      pricePerUnitUSD,
      fee: fee > 0 ? fee : undefined,
      feeCurrency: quote,
      transactionHash: rawTxid || undefined,
      orderId: finalOrderOrPostId || undefined,
      ledgerId: rawLedgers || undefined,
      tradingPair: rawPair || undefined,
      transactionKind: rawSubtype || rawOrdertype || 'spot',
      notes: notesParts.join(' | '),
    });
  }

  return transactions;
}

/**
 * Parse Kraken CSV content string
 */
export function parseKrakenCSV(csvContent: string): Transaction[] {
  const rows = parseCSVLines(csvContent);
  return parseKrakenCSVRows(rows);
}

/**
 * Parse Kraken single or multiple trade confirmation emails (saved as PDF or plain text)
 */
export function parseKrakenEmailReceipts(rawText: string): Transaction[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const sections: string[] = [];
  let currentSection: string[] = [];
  let hasTxIdInCurrent = false;

  for (const line of lines) {
    const l = line.trim();
    const isNewEmail = /^(?:von|from):\s*kraken/i.test(l);
    const isNewTrade = /^(?:you bought|you sold|du hast\s+\w+\s+(?:gekauft|verkauft))\b/i.test(l);

    if ((isNewEmail || (isNewTrade && hasTxIdInCurrent)) && currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
      currentSection = [line];
      hasTxIdInCurrent = false;
    } else {
      currentSection.push(line);
      if (/transaction id|transaktions-?id/i.test(l)) {
        hasTxIdInCurrent = true;
      }
    }
  }
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }

  const candidateSections = sections.length > 0 ? sections : [rawText];
  const transactions: Transaction[] = [];

  for (const sec of candidateSections) {
    const tx = parseSingleKrakenEmailReceipt(sec);
    if (tx) {
      transactions.push(tx);
    }
  }

  return transactions;
}

/**
 * Parses a single Kraken trade confirmation email / receipt text block
 */
export function parseSingleKrakenEmailReceipt(text: string): Transaction | null {
  const isKrakenReceipt = /kraken/i.test(text) ||
    /transaction id|transaktions-?id/i.test(text) ||
    /account balance|kontoguthaben|check balance/i.test(text) ||
    /you bought|you sold|du hast.*gekauft|du hast.*verkauft/i.test(text);

  if (!isKrakenReceipt) return null;

  // 1. Transaction Type (BUY or SELL)
  let isBuy = true;
  if (/you sold|du hast.*verkauft|sie haben.*verkauft|verkauf von/i.test(text)) {
    isBuy = false;
  } else if (/you bought|du hast.*gekauft|sie haben.*gekauft|kauf von/i.test(text)) {
    isBuy = true;
  } else if (/added to your account balance|wurde deinem konto gutgeschrieben/i.test(text)) {
    isBuy = true;
  } else if (/deducted from your account balance|wurde von deinem konto abgebucht/i.test(text)) {
    isBuy = false;
  }
  const type: TransactionType = isBuy ? 'BUY' : 'SELL';

  // 2. Coin Symbol
  let symbol = '';
  const buySellMatch = text.match(/(?:you bought|you sold|kauf von|verkauf von)\s+([A-Za-z0-9]{2,12})\b/i) ||
                        text.match(/(?:du hast|sie haben)\s+([A-Za-z0-9]{2,12})\s+(?:gekauft|verkauft)/i);
  if (buySellMatch) {
    symbol = buySellMatch[1].toUpperCase();
  }

  const volMatch = text.match(/(?:a total of|insgesamt)\s+([\d.,]+)\s+([A-Za-z0-9]{2,12})/i);
  let volume = 0;
  if (volMatch) {
    volume = cleanNumber(volMatch[1]);
    if (!symbol) symbol = volMatch[2].toUpperCase();
  }

  if (!symbol) {
    const priceSymMatch = text.match(/([A-Za-z0-9]{2,12})\s+(?:price|preis):/i);
    if (priceSymMatch) {
      symbol = priceSymMatch[1].toUpperCase();
    }
  }

  symbol = normalizeKrakenAsset(symbol);
  if (!symbol || symbol === 'UNKNOWN' || symbol === 'DETAILS') return null;

  // 3. Paid Amount & Quote Currency
  let cost = 0;
  let quoteCurrency = 'EUR';

  const paidMatch = text.match(/(?:paid|bezahlt|received|erhalten|spent)\s+([€$£A-Za-z0-9.,\s]+?)(?:\s+(?:with|mit|into|in)\b|\r?\n|$)/i);
  if (paidMatch) {
    const parsed = parseCurrencyAndAmount(paidMatch[1]);
    cost = parsed.amount;
    quoteCurrency = parsed.currency;
  }

  // 4. Unit Price
  let unitPrice = 0;
  const priceMatch = text.match(/(?:price|preis):\s*([€$£A-Za-z0-9.,\s]+?)(?:\r?\n|$)/i);
  if (priceMatch) {
    const parsed = parseCurrencyAndAmount(priceMatch[1]);
    unitPrice = parsed.amount;
    if (!quoteCurrency || quoteCurrency === 'EUR') {
      quoteCurrency = parsed.currency;
    }
  }

  // 5. Fees
  let fee = 0;
  let feeCurrency = quoteCurrency;
  const feeMatch = text.match(/(?:fees?|gebühr(?:en)?):\s*([€$£A-Za-z0-9.,\s]+?)(?:\r?\n|$)/i);
  if (feeMatch) {
    const parsed = parseCurrencyAndAmount(feeMatch[1]);
    fee = parsed.amount;
    feeCurrency = parsed.currency;
  }

  // Validation & mathematical derivation
  if (volume <= 0 && unitPrice > 0 && cost > 0) {
    const netCost = isBuy ? Math.max(0, cost - fee) : cost;
    volume = Number((netCost / unitPrice).toFixed(8));
  } else if (cost <= 0 && unitPrice > 0 && volume > 0) {
    cost = Number((volume * unitPrice + (isBuy ? fee : -fee)).toFixed(2));
  } else if (unitPrice <= 0 && volume > 0 && cost > 0) {
    const netCost = isBuy ? Math.max(0, cost - fee) : cost;
    unitPrice = Number((netCost / volume).toFixed(6));
  }

  if (volume <= 0 || cost <= 0) return null;

  // 6. Transaction ID
  let txid = '';
  const txidMatch = text.match(/(?:Transaction ID|Transaktions-?ID):\s*([A-Za-z0-9_-]+)/i);
  if (txidMatch) {
    txid = txidMatch[1].trim();
  }

  // 7. Date & Time
  let timestamp = new Date().toISOString();
  // Header: "Datum: 4. Oktober 2026 um 23:52" or "Date: 4. October 2026 at 23:52"
  const headerDateMatch = text.match(/(?:Datum|Date):\s*(\d{1,2})\.\s*([A-Za-zäöü]+)\s*(\d{4})(?:\s+(?:um|at)\s*(\d{1,2}):(\d{2}))?/i);
  if (headerDateMatch) {
    const day = parseInt(headerDateMatch[1], 10);
    const month = parseMonthName(headerDateMatch[2]);
    const year = parseInt(headerDateMatch[3], 10);
    const hour = headerDateMatch[4] ? parseInt(headerDateMatch[4], 10) : 12;
    const min = headerDateMatch[5] ? parseInt(headerDateMatch[5], 10) : 0;
    if (month !== -1) {
      timestamp = new Date(Date.UTC(year, month, day, hour, min, 0)).toISOString();
    }
  } else {
    // Detail: "Date: Oct 04, 2026" or "Date: 04 Oct 2026"
    const detailDateMatch = text.match(/Date:\s*([A-Za-z]+)\s*(\d{1,2}),?\s*(\d{4})/i) ||
                             text.match(/Date:\s*(\d{1,2})\s*([A-Za-z]+),?\s*(\d{4})/i);
    if (detailDateMatch) {
      let month = parseMonthName(detailDateMatch[1]);
      let day = parseInt(detailDateMatch[2], 10);
      let year = parseInt(detailDateMatch[3], 10);
      if (month === -1) {
        month = parseMonthName(detailDateMatch[2]);
        day = parseInt(detailDateMatch[1], 10);
      }
      if (month !== -1) {
        timestamp = new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
      }
    }
  }

  const spentCurr = isBuy ? quoteCurrency : symbol;
  const spentAmt = isBuy ? cost : volume;
  const recCurr = isBuy ? symbol : quoteCurrency;
  const recAmt = isBuy ? volume : cost;

  let pricePerUnitEUR: number | undefined = undefined;
  let pricePerUnitUSD: number | undefined = undefined;

  if (quoteCurrency.toUpperCase() === 'EUR') {
    pricePerUnitEUR = unitPrice > 0 ? unitPrice : (volume > 0 ? (cost - fee) / volume : undefined);
  } else if (quoteCurrency.toUpperCase() === 'USD') {
    pricePerUnitUSD = unitPrice > 0 ? unitPrice : (volume > 0 ? (cost - fee) / volume : undefined);
  }

  const id = `kraken_receipt_${txid || `${timestamp}_${symbol}_${volume}_${cost}`}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pair = `${symbol}/${quoteCurrency}`;

  return {
    id,
    timestamp,
    source: 'kraken',
    type,
    description: `Kraken Kaufbeleg ${symbol}`,
    spentCurrency: spentCurr,
    spentAmount: spentAmt,
    receivedCurrency: recCurr,
    receivedAmount: recAmt,
    pricePerUnitEUR,
    pricePerUnitUSD,
    fee: fee > 0 ? fee : undefined,
    feeCurrency: fee > 0 ? feeCurrency : undefined,
    transactionHash: txid || undefined,
    orderId: txid || undefined,
    tradingPair: pair,
    transactionKind: 'email_receipt',
    notes: `Kraken E-Mail Kaufbeleg | Pair: ${pair}${txid ? ` | TxID: ${txid}` : ''}`,
  };
}

/**
 * Parse Kraken statement text (extracted from PDF or copied from statement)
 */
export function parseKrakenText(rawText: string): Transaction[] {
  if (!rawText || !rawText.trim()) return [];

  // Check for Kraken email confirmation receipts
  const emailTransactions = parseKrakenEmailReceipts(rawText);

  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions: Transaction[] = [];

  // Group lines into records based on timestamp detection
  const dateRegex = /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)/;

  const recordBlocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of rawLines) {
    // Skip general headers
    const lLower = line.toLowerCase();
    if (lLower.startsWith('date') && (lLower.includes('pair') || lLower.includes('price'))) continue;
    if (lLower.includes('statement period') || lLower.includes('kraken pro') || lLower.includes('-- page')) continue;

    if (dateRegex.test(line)) {
      if (currentBlock.length > 0) {
        recordBlocks.push(currentBlock);
      }
      currentBlock = [line];
    } else if (currentBlock.length > 0) {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    recordBlocks.push(currentBlock);
  }

  for (const block of recordBlocks) {
    const combinedLine = block.join(' ');
    const tx = parseKrakenCombinedRecord(combinedLine);
    if (tx) {
      transactions.push(tx);
    }
  }

  // Fallback: If no records found with block grouping and no email receipts, test individual line matches
  if (transactions.length === 0 && emailTransactions.length === 0) {
    for (const line of rawLines) {
      const tx = parseKrakenCombinedRecord(line);
      if (tx) transactions.push(tx);
    }
  }

  const combined = [...transactions, ...emailTransactions];
  const seenIds = new Set<string>();
  const uniqueTransactions: Transaction[] = [];
  for (const tx of combined) {
    if (!seenIds.has(tx.id)) {
      seenIds.add(tx.id);
      uniqueTransactions.push(tx);
    }
  }

  return uniqueTransactions;
}

/**
 * Parses a combined string representing a single Kraken trade line or block
 */
function parseKrakenCombinedRecord(line: string): Transaction | null {
  // Regex to extract Date & Time
  const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)/);
  if (!dateMatch) return null;

  const rawTimestamp = dateMatch[1];

  // Side: Buy or Sell
  const sideMatch = line.match(/\b(buy|sell|kauf|verkauf)\b/i);
  if (!sideMatch) return null;

  const isBuy = sideMatch[1].toLowerCase().includes('buy') || sideMatch[1].toLowerCase().includes('kauf');
  const type: TransactionType = isBuy ? 'BUY' : 'SELL';

  // Search tokens in the text portion strictly after the date/time string
  const textAfterDate = line.substring(line.indexOf(rawTimestamp) + rawTimestamp.length).trim();

  // Find pair strictly in textAfterDate
  const pairMatch = textAfterDate.match(/\b([A-Z0-9]{2,10}(?:[\/\-][A-Z0-9]{2,10})?)\b/);
  const rawPair = pairMatch ? pairMatch[1] : '';
  const { base, quote } = parseKrakenPair(rawPair);
  const FIAT_SET = new Set(['EUR', 'USD', 'ZEUR', 'ZUSD', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD']);
  if (!base || base === 'UNKNOWN' || FIAT_SET.has(base.toUpperCase())) return null;

  // Extract TxID if present
  const txidMatch = textAfterDate.match(/\b([T][A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}|[0-9a-fA-F-]{16,})\b/);
  const txid = txidMatch ? txidMatch[1] : undefined;

  // Extract all number tokens
  // E.g. "58,420.50 EUR 0.00513518 BTC 300.00 EUR 0.75 EUR"
  const tokens = textAfterDate.split(/\s+/);
  const nums: number[] = [];

  for (const token of tokens) {
    if (token === rawPair || token.toLowerCase() === sideMatch[1].toLowerCase()) continue;
    if (txid && token === txid) continue;
    // Check if token has digits
    if (/\d/.test(token)) {
      const clean = cleanNumber(token);
      if (clean > 0) {
        nums.push(clean);
      }
    }
  }

  if (nums.length < 2) return null;

  // Resolve price, volume, cost, fee using mathematical relationship Cost ≈ Price * Volume
  let price = 0;
  let volume = 0;
  let cost = 0;
  let fee = 0;

  if (nums.length >= 3 && nums[2] > 0 && Math.abs(nums[0] * nums[1] - nums[2]) / nums[2] < 0.05) {
    // Layout: [price, volume, cost, fee]
    price = nums[0];
    volume = nums[1];
    cost = nums[2];
    fee = nums[3] || 0;
  } else if (nums.length >= 4 && nums[1] > 0 && Math.abs(nums[0] * nums[3] - nums[1]) / nums[1] < 0.05) {
    // Layout: [price, cost, fee, volume]
    price = nums[0];
    cost = nums[1];
    fee = nums[2] || 0;
    volume = nums[3];
  } else if (nums.length >= 3 && nums[2] > 0 && Math.abs(nums[1] * nums[0] - nums[2]) / nums[2] < 0.05) {
    // Layout: [volume, price, cost, fee]
    volume = nums[0];
    price = nums[1];
    cost = nums[2];
    fee = nums[3] || 0;
  } else {
    // Fallback: nums[0] is price, nums[1] is vol, nums[2] is cost
    price = nums[0] || 0;
    volume = nums[1] || 0;
    cost = nums[2] || (price && volume ? price * volume : 0);
    fee = nums[3] || 0;
  }

  let timestamp = rawTimestamp;
  try {
    const cleanTs = rawTimestamp.replace(' ', 'T');
    const d = new Date(cleanTs.includes('Z') ? cleanTs : cleanTs + 'Z');
    if (!isNaN(d.getTime())) {
      timestamp = d.toISOString();
    }
  } catch {
    timestamp = new Date().toISOString();
  }

  const spentCurr = isBuy ? quote : base;
  const spentAmt = isBuy ? cost : volume;
  const recCurr = isBuy ? base : quote;
  const recAmt = isBuy ? volume : cost;

  let pricePerUnitEUR: number | undefined = undefined;
  let pricePerUnitUSD: number | undefined = undefined;

  if (quote.toUpperCase() === 'EUR') {
    pricePerUnitEUR = price > 0 ? price : (volume > 0 ? cost / volume : undefined);
  } else if (quote.toUpperCase() === 'USD' || quote.toUpperCase() === 'USDT' || quote.toUpperCase() === 'USDC') {
    pricePerUnitUSD = price > 0 ? price : (volume > 0 ? cost / volume : undefined);
  }

  const id = `kraken_pdf_${txid || `${timestamp}_${base}_${volume}_${cost}`}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id,
    timestamp,
    source: 'kraken',
    type,
    description: `Kraken ${isBuy ? 'Kauf' : 'Verkauf'} ${base}`,
    spentCurrency: spentCurr,
    spentAmount: spentAmt,
    receivedCurrency: recCurr,
    receivedAmount: recAmt,
    pricePerUnitEUR,
    pricePerUnitUSD,
    fee: fee > 0 ? fee : undefined,
    feeCurrency: quote,
    transactionHash: txid,
    transactionKind: 'spot',
    notes: `Kraken Pro PDF Import | Pair: ${rawPair}${txid ? ` | TxID: ${txid}` : ''}`,
  };
}

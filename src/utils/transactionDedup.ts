import { Transaction } from '../types';

/**
 * Creates a normalized comparison fingerprint for a transaction.
 * Two transactions representing the exact same event produce identical fingerprints.
 */
export function getTransactionFingerprint(tx: Transaction): string {
  // Normalize timestamp to UTC second (handles date format variations e.g. "2026-09-01 14:41:18" vs ISO)
  let normalizedTime = (tx.timestamp || '').trim();
  try {
    const d = new Date(tx.timestamp);
    if (!isNaN(d.getTime())) {
      normalizedTime = Math.floor(d.getTime() / 1000).toString();
    }
  } catch {
    // Keep original string fallback
  }

  const type = (tx.type || 'BUY').toUpperCase();
  const recCurr = (tx.receivedCurrency || '').toUpperCase().trim();
  // Format numbers to fixed 6 decimal places to prevent float rounding differences
  const recAmt = Number(tx.receivedAmount || 0).toFixed(6);
  const spentCurr = (tx.spentCurrency || '').toUpperCase().trim();
  const spentAmt = Number(tx.spentAmount || 0).toFixed(6);

  // If hash is present, include it for blockchain uniqueness
  const hashPart = tx.transactionHash ? `_hash:${tx.transactionHash.toLowerCase().trim()}` : '';

  return `${normalizedTime}_${type}_${recCurr}:${recAmt}_${spentCurr}:${spentAmt}${hashPart}`;
}

/**
 * Checks whether two transactions represent the exact same trade event.
 * Handles slight timestamp drifts (e.g. email dispatch latency vs exchange trade engine,
 * local timezone offsets, or slight float rounding differences).
 */
export function areTransactionsEquivalent(t1: Transaction, t2: Transaction): boolean {
  // 1. Direct ID match
  if (t1.id && t2.id && t1.id === t2.id) {
    return true;
  }

  // 2. Direct blockchain transaction hash or order ID match
  if (t1.transactionHash && t2.transactionHash && t1.transactionHash.toLowerCase().trim() === t2.transactionHash.toLowerCase().trim()) {
    return true;
  }
  if (t1.orderId && t2.orderId && t1.orderId.toLowerCase().trim() === t2.orderId.toLowerCase().trim()) {
    return true;
  }

  // 3. Exact fingerprint match
  if (getTransactionFingerprint(t1) === getTransactionFingerprint(t2)) {
    return true;
  }

  // 4. Trade type match (BUY vs BUY, SELL vs SELL)
  const type1 = (t1.type || 'BUY').toUpperCase();
  const type2 = (t2.type || 'BUY').toUpperCase();
  if (type1 !== type2) {
    return false;
  }

  // 5. Currency matching
  const t1RecCurr = (t1.receivedCurrency || '').toUpperCase().trim();
  const t2RecCurr = (t2.receivedCurrency || '').toUpperCase().trim();
  const t1SpentCurr = (t1.spentCurrency || '').toUpperCase().trim();
  const t2SpentCurr = (t2.spentCurrency || '').toUpperCase().trim();

  if (t1RecCurr && t2RecCurr && t1RecCurr !== t2RecCurr) {
    return false;
  }
  if (t1SpentCurr && t2SpentCurr && t1SpentCurr !== t2SpentCurr) {
    return false;
  }

  // 6. Crypto volume matching (tolerating floating point precision)
  const t1RecAmt = Number(t1.receivedAmount || 0);
  const t2RecAmt = Number(t2.receivedAmount || 0);
  const diffRec = Math.abs(t1RecAmt - t2RecAmt);
  if (diffRec > 0.0001 && (t1RecAmt === 0 || diffRec / t1RecAmt > 0.0001)) {
    return false;
  }

  // 7. Spent / Fiat cost matching (tolerating cents or float precision)
  const t1SpentAmt = Number(t1.spentAmount || 0);
  const t2SpentAmt = Number(t2.spentAmount || 0);
  const diffSpent = Math.abs(t1SpentAmt - t2SpentAmt);
  if (diffSpent > 0.05 && (t1SpentAmt === 0 || diffSpent / t1SpentAmt > 0.001)) {
    return false;
  }

  // 8. Exchange source compatibility
  const s1 = t1.source || 'other';
  const s2 = t2.source || 'other';
  const compatibleSource =
    s1 === s2 ||
    s1 === 'generic' || s2 === 'generic' ||
    s1 === 'other' || s2 === 'other';

  if (!compatibleSource) {
    return false;
  }

  // 9. Timestamp tolerance comparison
  const d1 = new Date(t1.timestamp).getTime();
  const d2 = new Date(t2.timestamp).getTime();

  const isEmail =
    t1.transactionKind === 'email_receipt' ||
    t2.transactionKind === 'email_receipt' ||
    (t1.notes && t1.notes.toLowerCase().includes('beleg')) ||
    (t2.notes && t2.notes.toLowerCase().includes('beleg')) ||
    (t1.description && t1.description.toLowerCase().includes('beleg')) ||
    (t2.description && t2.description.toLowerCase().includes('beleg'));

  if (!isNaN(d1) && !isNaN(d2)) {
    const diffSec = Math.abs(d1 - d2) / 1000;
    // Email receipts have email dispatch latency or date-only resolution -> tolerate 24 hours (86,400s)
    if (isEmail && diffSec <= 86400) {
      return true;
    }
    // General ledger records (matching engine vs settlement drift) -> tolerate 120s
    if (diffSec <= 120) {
      return true;
    }
    // If one is an email receipt and amounts match identically on the same exchange,
    // it is guaranteed to be the same trade (email receipt date may have defaulted to upload date if PDF had no date header)
    if (isEmail && (s1 === s2 || s1 === 'generic' || s2 === 'generic')) {
      return true;
    }
    return false;
  }

  // Fallback if one or both lacks valid timestamp, but coin, volume and cost match
  if (isEmail) {
    return true;
  }

  return false;
}

/**
 * Checks whether candidateTx is identical or equivalent to any transaction in existingList.
 */
export function isDuplicateTransaction(candidateTx: Transaction, existingList: Transaction[]): boolean {
  return existingList.some(existing => areTransactionsEquivalent(candidateTx, existing));
}

export interface DeduplicationResult {
  newTransactions: Transaction[];
  skippedDuplicates: Transaction[];
  totalCandidates: number;
}

/**
 * Filters out duplicates both against already existing transactions AND within the newly uploaded batch itself.
 */
export function deduplicateTransactions(
  incomingTransactions: Transaction[],
  existingTransactions: Transaction[]
): DeduplicationResult {
  const newTransactions: Transaction[] = [];
  const skippedDuplicates: Transaction[] = [];

  for (const tx of incomingTransactions) {
    // 1. Check if it already exists in the persistent database
    const isExistingDup = existingTransactions.some(existing => areTransactionsEquivalent(tx, existing));

    // 2. Check if it is a duplicate within the currently evaluated batch
    const isBatchDup = newTransactions.some(added => areTransactionsEquivalent(tx, added));

    if (isExistingDup || isBatchDup) {
      skippedDuplicates.push(tx);
    } else {
      newTransactions.push(tx);
    }
  }

  return {
    newTransactions,
    skippedDuplicates,
    totalCandidates: incomingTransactions.length,
  };
}

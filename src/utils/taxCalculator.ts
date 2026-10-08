import { Transaction, UserProfile } from '../types';
import { getCoinPriceEUR, getCoinDetails } from './priceService';
import { NON_CRYPTO_SYMBOLS } from './portfolioCalculations';

export interface HoldingLot {
  id: string;
  source: string;
  symbol: string;
  buyDate: string;
  buyTimestamp: number;
  amount: number;
  costPerUnitEUR: number;
  totalCostEUR: number;
  daysHeld: number;
  isTaxFree: boolean;
  taxFreeDate: string;
  daysRemainingToTaxFree: number;
  currentPriceEUR: number;
  currentValueEUR: number;
  unrealizedPnlEUR: number;
}

export interface RealizedSaleLot {
  id: string;
  displayNr: string; // e.g. "1", "2a", "2b"
  saleId: string;
  source: string; // 'kraken' | 'crypto_com' | 'manual'
  exchangeDisplayName: string;
  symbol: string;
  sellDate: string;
  buyDate: string;
  amount: number;
  costBasisEUR: number;
  proceedsEUR: number;
  feeEUR: number;
  realizedPnlEUR: number;
  daysHeld: number;
  isTaxFree: boolean;
  taxYear: number;
}

export interface ExchangeTaxSummary {
  source: string;
  displayName: string;
  salesCount: number;
  taxablePnlEUR: number;
  taxFreePnlEUR: number;
  rewardsEUR: number;
  openTranchesCount: number;
  currentValueEUR: number;
}

export interface TaxRewardItem {
  id: string;
  date: string;
  source: string;
  exchangeDisplayName: string;
  symbol: string;
  kind: string; // 'Staking-Reward', 'Card-Cashback / Rewards', 'Earn-Zinsen', etc.
  amount: number;
  valueEUR: number;
}

export interface OpenTrancheItem {
  trancheId: string; // e.g. 'K-01', 'K-02', 'C-01'...
  source: string;
  exchangeDisplayName: string;
  symbol: string;
  buyDate: string;
  amount: number;
  costBasisEUR: number;
  daysHeld: number;
  taxFreeDate: string;
}

export interface AssetTaxSummary {
  symbol: string;
  name: string;
  totalBalance: number;
  balanceBySource: Record<string, number>; // e.g. { kraken: 0.035, crypto_com: 0.021419 }
  taxFreeBalance: number;
  taxableBalance: number;
  taxFreePercentage: number;
  taxFreeValueEUR: number;
  taxableValueEUR: number;
  taxFreeUnrealizedPnlEUR: number;
  taxableUnrealizedPnlEUR: number;
  totalCurrentValueEUR: number;
  earliestTaxFreeDate?: string;
  lots: HoldingLot[];
}

export interface TaxChecklistFlags {
  hasCryptoToCrypto: boolean;
  onlyFiatTrades: boolean;
  hasTransfers: boolean;
  exchanges: string[];
}

export interface PortfolioTaxReport {
  taxYear: number;
  reportDate: string;
  isInterim: boolean;
  exchangesList: string;

  // Section 1: Overview Anlage SO (§ 23 EStG)
  taxableProceedsEUR: number;
  taxableCostBasisEUR: number;
  taxableFeesEUR: number;
  realizedTaxableGainEUR: number;
  realizedTaxableLossEUR: number;
  realizedTaxableNetEUR: number; // = taxableProceedsEUR - taxableCostBasisEUR - taxableFeesEUR
  
  taxFreeProceedsEUR: number;
  taxFreeCostBasisEUR: number;
  taxFreeFeesEUR: number;
  realizedTaxFreeProfitEUR: number; // = taxFreeProceedsEUR - taxFreeCostBasisEUR - taxFreeFeesEUR
  
  realizedSalesCount: number;
  germanExemptionLimitEUR: number; // 1000 EUR (ab VZ 2024, 600 EUR bis 2023)
  exemptionExceeded: boolean;
  
  // Section 1: § 22 Nr. 3 EStG (Staking & Rewards)
  totalStakingRewardsEUR: number;
  stakingFeesEUR: number;
  stakingNetEUR: number;
  
  // Section 1: Aufteilung nach Börse
  exchanges: ExchangeTaxSummary[];
  
  // Section 2: Einzelnachweis Veräußerungen (FIFO)
  realizedSales: RealizedSaleLot[];
  
  // Section 3: Sonstige Einkünfte (Staking & Rewards)
  rewards: TaxRewardItem[];
  
  // Section 4: Bestand zum Stichtag
  totalPortfolioValueEUR: number;
  totalTaxFreeValueEUR: number;
  totalTaxableValueEUR: number;
  taxFreePercentage: number;
  totalTaxFreeUnrealizedPnlEUR: number;
  totalTaxableUnrealizedPnlEUR: number;
  totalOpenTranchesCostEUR: number;
  assets: AssetTaxSummary[];
  
  // Section 5: Offene Anschaffungstranchen
  openTranches: OpenTrancheItem[];
  upcomingTaxFreeLots: HoldingLot[]; // backwards compatibility
  
  // Section 6: Angaben, Belege und Methodik
  checklist: TaxChecklistFlags;

  // Raw transactions for the tax year (Anhang B & C Belege)
  yearTransactions: Transaction[];
}

export function getExchangeDisplayName(source?: string): string {
  const s = (source || '').toLowerCase().trim();
  if (s === 'kraken') return 'Kraken';
  if (s === 'crypto_com') return 'Crypto.com';
  if (s === 'manual') return 'Manuell';
  if (s === 'coinbase') return 'Coinbase';
  if (s === 'bitpanda') return 'Bitpanda';
  if (s === 'binance') return 'Binance';
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Sonstige';
}

function formatDateDE(isoDate: string): string {
  if (!isoDate) return '-';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate.substring(0, 10);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoDate.substring(0, 10);
  }
}

function computeTaxFreeDateStr(buyDateIso: string): string {
  if (!buyDateIso) return '-';
  try {
    const d = new Date(buyDateIso);
    if (isNaN(d.getTime())) return '-';
    // Steuerfrei am Tag nach Ablauf eines Jahres (365 Tage Frist)
    d.setDate(d.getDate() + 366);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
}

export function calculateFIFOTaxReport(
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  taxYear: number = new Date().getFullYear()
): PortfolioTaxReport {
  // 1. Sort all transactions chronologically (oldest to newest)
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const now = Date.now();
  const currentYear = new Date().getFullYear();
  const isInterim = taxYear >= currentYear;
  const reportDateStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Depotgetrenntes FIFO: inventoryBySource[source][symbol] = Array of open lots
  const inventoryBySource: Record<string, Record<string, {
    id: string;
    source: string;
    symbol: string;
    buyDate: string;
    timestamp: number;
    amount: number;
    costPerUnitEUR: number;
  }[]>> = {};

  const realizedSales: RealizedSaleLot[] = [];
  const rewardsList: TaxRewardItem[] = [];

  // Track exchange sources & flags for Section 6
  const exchangeSet = new Set<string>();
  let hasCryptoToCrypto = false;
  let onlyFiatTrades = true;
  let hasTransfers = false;

  let globalSaleCounter = 1;

  for (const tx of sorted) {
    const txSource = (tx.source || 'kraken').toLowerCase();
    exchangeSet.add(txSource);

    const txDate = new Date(tx.timestamp);
    const txYear = isNaN(txDate.getTime()) ? taxYear : txDate.getFullYear();
    const txTimestamp = isNaN(txDate.getTime()) ? now : txDate.getTime();

    if (tx.type === 'TRANSFER') {
      hasTransfers = true;
    }

    // Check if crypto-to-crypto
    const spentUpper = (tx.spentCurrency || '').toUpperCase();
    const recUpper = (tx.receivedCurrency || '').toUpperCase();
    const isSpentCrypto = spentUpper && !['EUR', 'USD', 'UNKNOWN', ''].includes(spentUpper) && !NON_CRYPTO_SYMBOLS.has(spentUpper);
    const isRecCrypto = recUpper && !['EUR', 'USD', 'UNKNOWN', ''].includes(recUpper) && !NON_CRYPTO_SYMBOLS.has(recUpper);

    if (isSpentCrypto && isRecCrypto) {
      hasCryptoToCrypto = true;
    }
    if ((isSpentCrypto && tx.spentCurrency !== 'EUR') || (isRecCrypto && tx.spentCurrency && tx.spentCurrency !== 'EUR')) {
      if (tx.spentCurrency !== 'EUR' && tx.spentCurrency !== 'USD') {
        onlyFiatTrades = false;
      }
    }

    // A. BUYS, TRANSFERS IN, AND STAKING/REWARDS
    if (tx.type === 'BUY' || tx.type === 'TRANSFER' || tx.type === 'REWARD' || tx.type === 'STAKE') {
      const symbol = recUpper || spentUpper;
      if (!symbol || NON_CRYPTO_SYMBOLS.has(symbol) || ['EUR', 'USD', 'UNKNOWN'].includes(symbol)) continue;

      const amount = tx.receivedAmount || 0;
      if (amount <= 0) continue;

      let costPerUnitEUR = 0;
      if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0) {
        costPerUnitEUR = tx.pricePerUnitEUR;
      } else if (tx.spentAmount > 0 && tx.spentCurrency.toUpperCase() === 'EUR') {
        costPerUnitEUR = tx.spentAmount / amount;
      } else if (tx.nativeCurrency === 'EUR' && tx.nativeAmount) {
        costPerUnitEUR = tx.nativeAmount / amount;
      } else {
        costPerUnitEUR = getCoinPriceEUR(symbol, customPrices);
      }

      // If buying fee exists in EUR, add to cost per unit (Anschaffungsnebenkosten)
      if (tx.fee && tx.fee > 0 && (tx.feeCurrency === 'EUR' || !tx.feeCurrency)) {
        costPerUnitEUR += (tx.fee / amount);
      }

      // Record Staking / Reward for § 22 Nr. 3 EStG
      if (tx.type === 'REWARD' || tx.type === 'STAKE') {
        if (txYear === taxYear) {
          const rewardValEUR = amount * costPerUnitEUR;
          let kind = 'Staking-Reward';
          const descLower = (tx.description || '').toLowerCase();
          const kindLower = (tx.transactionKind || '').toLowerCase();

          if (descLower.includes('cashback') || kindLower.includes('cashback')) {
            kind = 'Card-Cashback / Rewards';
          } else if (descLower.includes('earn') || descLower.includes('interest') || kindLower.includes('earn')) {
            kind = 'Earn-Zinsen';
          } else if (descLower.includes('airdrop') || kindLower.includes('airdrop')) {
            kind = 'Airdrop';
          }

          rewardsList.push({
            id: tx.id,
            date: tx.timestamp,
            source: txSource,
            exchangeDisplayName: getExchangeDisplayName(txSource),
            symbol,
            kind,
            amount,
            valueEUR: rewardValEUR,
          });
        }
      }

      // Add to exchange inventory
      if (!inventoryBySource[txSource]) {
        inventoryBySource[txSource] = {};
      }
      if (!inventoryBySource[txSource][symbol]) {
        inventoryBySource[txSource][symbol] = [];
      }

      inventoryBySource[txSource][symbol].push({
        id: tx.id,
        source: txSource,
        symbol,
        buyDate: tx.timestamp,
        timestamp: txTimestamp,
        amount,
        costPerUnitEUR,
      });
    } 
    // B. SELLS
    else if (tx.type === 'SELL') {
      const symbol = spentUpper || recUpper;
      if (!symbol || NON_CRYPTO_SYMBOLS.has(symbol) || ['EUR', 'USD', 'UNKNOWN'].includes(symbol)) continue;

      let sellTotalAmount = tx.spentAmount > 0 ? tx.spentAmount : tx.receivedAmount;
      if (sellTotalAmount <= 0) continue;

      let sellPricePerUnitEUR = 0;
      if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0) {
        sellPricePerUnitEUR = tx.pricePerUnitEUR;
      } else if (tx.receivedAmount > 0 && tx.receivedCurrency.toUpperCase() === 'EUR') {
        sellPricePerUnitEUR = tx.receivedAmount / sellTotalAmount;
      } else if (tx.nativeCurrency === 'EUR' && tx.nativeAmount) {
        sellPricePerUnitEUR = tx.nativeAmount / sellTotalAmount;
      } else {
        sellPricePerUnitEUR = getCoinPriceEUR(symbol, customPrices);
      }

      // Total sales fee (Werbungskosten)
      let totalSaleFeeEUR = 0;
      if (tx.fee && tx.fee > 0 && (tx.feeCurrency === 'EUR' || !tx.feeCurrency)) {
        totalSaleFeeEUR = tx.fee;
      }

      const totalSaleProceedsEUR = sellTotalAmount * sellPricePerUnitEUR;

      // Primary FIFO queue: same exchange
      let queue = inventoryBySource[txSource]?.[symbol] || [];
      const matchedLotsForThisSale: {
        oldestLot: { id: string; source: string; symbol: string; buyDate: string; timestamp: number; amount: number; costPerUnitEUR: number };
        matchAmount: number;
      }[] = [];

      let remainingToSell = sellTotalAmount;

      // 1. Consume from same exchange
      while (remainingToSell > 0.00000001 && queue.length > 0) {
        const oldestLot = queue[0];
        const matchAmount = Math.min(remainingToSell, oldestLot.amount);
        matchedLotsForThisSale.push({ oldestLot, matchAmount });
        oldestLot.amount -= matchAmount;
        remainingToSell -= matchAmount;
        if (oldestLot.amount <= 0.00000001) {
          queue.shift();
        }
      }

      // 2. Fallback to other exchanges if not enough on same exchange (e.g. unrecorded transfer)
      if (remainingToSell > 0.00000001) {
        for (const [otherSrc, symbolMap] of Object.entries(inventoryBySource)) {
          if (otherSrc === txSource) continue;
          const otherQueue = symbolMap[symbol] || [];
          while (remainingToSell > 0.00000001 && otherQueue.length > 0) {
            const oldestLot = otherQueue[0];
            const matchAmount = Math.min(remainingToSell, oldestLot.amount);
            matchedLotsForThisSale.push({ oldestLot, matchAmount });
            oldestLot.amount -= matchAmount;
            remainingToSell -= matchAmount;
            if (oldestLot.amount <= 0.00000001) {
              otherQueue.shift();
            }
          }
          if (remainingToSell <= 0.00000001) break;
        }
      }

      // If still remaining (unrecorded historical acquisition), synthesize lot with 0 cost basis
      if (remainingToSell > 0.00000001) {
        matchedLotsForThisSale.push({
          oldestLot: {
            id: `synth_${tx.id}`,
            source: txSource,
            symbol,
            buyDate: tx.timestamp,
            timestamp: txTimestamp,
            amount: remainingToSell,
            costPerUnitEUR: 0,
          },
          matchAmount: remainingToSell,
        });
      }

      // Determine display numbering (e.g., "1" if 1 tranche, or "2a", "2b" if multiple)
      const currentSaleNr = globalSaleCounter++;
      const hasMultipleTranches = matchedLotsForThisSale.length > 1;

      matchedLotsForThisSale.forEach((item, idx) => {
        const { oldestLot, matchAmount } = item;
        const subLetter = String.fromCharCode(97 + idx); // 'a', 'b', 'c'...
        const displayNr = hasMultipleTranches ? `${currentSaleNr}${subLetter}` : `${currentSaleNr}`;

        // Pro-rate proceeds and sales fee
        const ratio = matchAmount / sellTotalAmount;
        const subProceedsEUR = ratio * totalSaleProceedsEUR;
        const subFeeEUR = ratio * totalSaleFeeEUR;
        const subCostBasisEUR = matchAmount * oldestLot.costPerUnitEUR;
        const subRealizedPnlEUR = subProceedsEUR - subCostBasisEUR - subFeeEUR;

        const holdingDurationMs = Math.max(0, txTimestamp - oldestLot.timestamp);
        const daysHeld = Math.floor(holdingDurationMs / (1000 * 60 * 60 * 24));
        const isTaxFree = daysHeld > 365;

        realizedSales.push({
          id: `${tx.id}-${oldestLot.id}-${idx}`,
          displayNr,
          saleId: tx.id,
          source: oldestLot.source || txSource,
          exchangeDisplayName: getExchangeDisplayName(oldestLot.source || txSource),
          symbol,
          sellDate: tx.timestamp,
          buyDate: oldestLot.buyDate,
          amount: matchAmount,
          costBasisEUR: subCostBasisEUR,
          proceedsEUR: subProceedsEUR,
          feeEUR: subFeeEUR,
          realizedPnlEUR: subRealizedPnlEUR,
          daysHeld,
          isTaxFree,
          taxYear: txYear,
        });
      });
    }
  }

  // 2. Build Open Tranches (Anhang A) & Asset Summaries per Exchange (Section 4 & 5)
  const openTranches: OpenTrancheItem[] = [];
  const upcomingTaxFreeLots: HoldingLot[] = [];
  const assetSummariesMap: Record<string, AssetTaxSummary> = {};

  // Group open tranches by exchange for numbered IDs (K-01, C-01, etc.)
  const tranchesBySource: Record<string, {
    id?: string;
    source: string;
    symbol: string;
    buyDate: string;
    timestamp: number;
    amount: number;
    costPerUnitEUR: number;
  }[]> = {};

  for (const [src, symbolMap] of Object.entries(inventoryBySource)) {
    for (const [symbol, queue] of Object.entries(symbolMap)) {
      for (const lot of queue) {
        if (lot.amount <= 0.00000001) continue;
        if (lot.amount < 0.001 && (lot.amount * lot.costPerUnitEUR) < 0.005) continue;
        if (!tranchesBySource[src]) tranchesBySource[src] = [];
        tranchesBySource[src].push(lot);
      }
    }
  }

  let totalOpenTranchesCostEUR = 0;

  // Process tranches with prefix (K-01 for Kraken, C-01 for Crypto.com, etc.)
  for (const [src, list] of Object.entries(tranchesBySource)) {
    // Sort by symbol, then buy timestamp
    list.sort((a, b) => a.symbol.localeCompare(b.symbol) || a.timestamp - b.timestamp);

    let prefix = 'T';
    if (src === 'kraken') prefix = 'K';
    else if (src === 'crypto_com') prefix = 'C';
    else if (src === 'manual') prefix = 'M';

    list.forEach((lot, idx) => {
      const trancheNumber = String(idx + 1).padStart(2, '0');
      const trancheId = `${prefix}-${trancheNumber}`;
      const durationMs = Math.max(0, now - lot.timestamp);
      const daysHeld = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      const costBasis = lot.amount * lot.costPerUnitEUR;
      totalOpenTranchesCostEUR += costBasis;

      openTranches.push({
        trancheId,
        source: src,
        exchangeDisplayName: getExchangeDisplayName(src),
        symbol: lot.symbol,
        buyDate: lot.buyDate,
        amount: lot.amount,
        costBasisEUR: costBasis,
        daysHeld,
        taxFreeDate: computeTaxFreeDateStr(lot.buyDate),
      });

      // Also construct HoldingLot for upcoming tax free tracking
      const isTaxFree = daysHeld > 365;
      const currentPrice = getCoinPriceEUR(lot.symbol, customPrices);
      const currentVal = lot.amount * currentPrice;

      const holdingLot: HoldingLot = {
        id: lot.id,
        source: src,
        symbol: lot.symbol,
        buyDate: lot.buyDate,
        buyTimestamp: lot.timestamp,
        amount: lot.amount,
        costPerUnitEUR: lot.costPerUnitEUR,
        totalCostEUR: costBasis,
        daysHeld,
        isTaxFree,
        taxFreeDate: computeTaxFreeDateStr(lot.buyDate),
        daysRemainingToTaxFree: Math.max(0, 365 - daysHeld),
        currentPriceEUR: currentPrice,
        currentValueEUR: currentVal,
        unrealizedPnlEUR: currentVal - costBasis,
      };

      if (!isTaxFree) {
        upcomingTaxFreeLots.push(holdingLot);
      }

      // Aggregate into assetSummariesMap
      if (!assetSummariesMap[lot.symbol]) {
        const details = getCoinDetails(lot.symbol);
        assetSummariesMap[lot.symbol] = {
          symbol: lot.symbol,
          name: details.name,
          totalBalance: 0,
          balanceBySource: {},
          taxFreeBalance: 0,
          taxableBalance: 0,
          taxFreePercentage: 0,
          taxFreeValueEUR: 0,
          taxableValueEUR: 0,
          taxFreeUnrealizedPnlEUR: 0,
          taxableUnrealizedPnlEUR: 0,
          totalCurrentValueEUR: 0,
          lots: [],
        };
      }

      const aSummary = assetSummariesMap[lot.symbol];
      aSummary.totalBalance += lot.amount;
      aSummary.balanceBySource[src] = (aSummary.balanceBySource[src] || 0) + lot.amount;
      aSummary.totalCurrentValueEUR += currentVal;
      aSummary.lots.push(holdingLot);

      if (isTaxFree) {
        aSummary.taxFreeBalance += lot.amount;
        aSummary.taxFreeValueEUR += currentVal;
        aSummary.taxFreeUnrealizedPnlEUR += (currentVal - costBasis);
      } else {
        aSummary.taxableBalance += lot.amount;
        aSummary.taxableValueEUR += currentVal;
        aSummary.taxableUnrealizedPnlEUR += (currentVal - costBasis);
      }
    });
  }

  // Finalize asset summaries
  const assetSummaries: AssetTaxSummary[] = [];
  let totalPortfolioValueEUR = 0;
  let totalTaxFreeValueEUR = 0;
  let totalTaxableValueEUR = 0;
  let totalTaxFreeUnrealizedPnlEUR = 0;
  let totalTaxableUnrealizedPnlEUR = 0;

  for (const summary of Object.values(assetSummariesMap)) {
    if (summary.totalBalance <= 0.00000001) continue;

    summary.taxFreePercentage = summary.totalBalance > 0 ? (summary.taxFreeBalance / summary.totalBalance) * 100 : 0;
    
    // Determine earliest tax free date for taxable lots
    const taxableLots = summary.lots.filter(l => !l.isTaxFree);
    if (taxableLots.length > 0) {
      taxableLots.sort((a, b) => a.buyTimestamp - b.buyTimestamp);
      summary.earliestTaxFreeDate = taxableLots[0].taxFreeDate;
    } else {
      summary.earliestTaxFreeDate = 'steuerfrei';
    }

    totalPortfolioValueEUR += summary.totalCurrentValueEUR;
    totalTaxFreeValueEUR += summary.taxFreeValueEUR;
    totalTaxableValueEUR += summary.taxableValueEUR;
    totalTaxFreeUnrealizedPnlEUR += summary.taxFreeUnrealizedPnlEUR;
    totalTaxableUnrealizedPnlEUR += summary.taxableUnrealizedPnlEUR;

    assetSummaries.push(summary);
  }

  assetSummaries.sort((a, b) => b.totalCurrentValueEUR - a.totalCurrentValueEUR);
  upcomingTaxFreeLots.sort((a, b) => a.daysRemainingToTaxFree - b.daysRemainingToTaxFree);

  // 3. Filter Realized Sales for the Chosen Tax Year
  const salesInTaxYear = realizedSales.filter(s => s.taxYear === taxYear);

  let taxableProceedsEUR = 0;
  let taxableCostBasisEUR = 0;
  let taxableFeesEUR = 0;
  let realizedTaxableGainEUR = 0;
  let realizedTaxableLossEUR = 0;

  let taxFreeProceedsEUR = 0;
  let taxFreeCostBasisEUR = 0;
  let taxFreeFeesEUR = 0;
  let realizedTaxFreeProfitEUR = 0;

  for (const s of salesInTaxYear) {
    if (s.isTaxFree) {
      taxFreeProceedsEUR += s.proceedsEUR;
      taxFreeCostBasisEUR += s.costBasisEUR;
      taxFreeFeesEUR += s.feeEUR;
      realizedTaxFreeProfitEUR += s.realizedPnlEUR;
    } else {
      taxableProceedsEUR += s.proceedsEUR;
      taxableCostBasisEUR += s.costBasisEUR;
      taxableFeesEUR += s.feeEUR;

      if (s.realizedPnlEUR >= 0) {
        realizedTaxableGainEUR += s.realizedPnlEUR;
      } else {
        realizedTaxableLossEUR += Math.abs(s.realizedPnlEUR);
      }
    }
  }

  const realizedTaxableNetEUR = taxableProceedsEUR - taxableCostBasisEUR - taxableFeesEUR;
  const germanExemptionLimitEUR = taxYear >= 2024 ? 1000 : 600; // § 23 Abs. 3 EStG (ab 2024: 1.000 €, vorher 600 €)

  // Staking & Rewards § 22 Nr. 3 EStG
  let totalStakingRewardsEUR = 0;
  for (const r of rewardsList) {
    totalStakingRewardsEUR += r.valueEUR;
  }

  // 4. Section 1 Subtable: Aufteilung nach Börse
  const exchangeSummaries: ExchangeTaxSummary[] = [];
  const distinctSources = Array.from(exchangeSet);

  for (const src of distinctSources) {
    const srcSales = salesInTaxYear.filter(s => s.source === src);
    // Distinct sales count
    const distinctSaleIds = new Set(srcSales.map(s => s.saleId));
    const salesCount = distinctSaleIds.size;

    let srcTaxablePnl = 0;
    let srcTaxFreePnl = 0;

    for (const s of srcSales) {
      if (s.isTaxFree) {
        srcTaxFreePnl += s.realizedPnlEUR;
      } else {
        srcTaxablePnl += s.realizedPnlEUR;
      }
    }

    const srcRewards = rewardsList.filter(r => r.source === src).reduce((acc, r) => acc + r.valueEUR, 0);
    const srcOpenTranches = openTranches.filter(t => t.source === src);
    const openTranchesCount = srcOpenTranches.length;

    let currentValueEUR = 0;
    for (const asset of assetSummaries) {
      const balOnSrc = asset.balanceBySource[src] || 0;
      if (balOnSrc > 0) {
        const p = getCoinPriceEUR(asset.symbol, customPrices);
        currentValueEUR += balOnSrc * p;
      }
    }

    exchangeSummaries.push({
      source: src,
      displayName: getExchangeDisplayName(src),
      salesCount,
      taxablePnlEUR: srcTaxablePnl,
      taxFreePnlEUR: srcTaxFreePnl,
      rewardsEUR: srcRewards,
      openTranchesCount,
      currentValueEUR,
    });
  }

  exchangeSummaries.sort((a, b) => b.currentValueEUR - a.currentValueEUR);

  const exchangesList = exchangeSummaries.map(e => e.displayName).join(', ') || 'Kraken, Crypto.com';

  const checklist: TaxChecklistFlags = {
    hasCryptoToCrypto,
    onlyFiatTrades,
    hasTransfers,
    exchanges: exchangeSummaries.map(e => e.displayName),
  };

  return {
    taxYear,
    reportDate: reportDateStr,
    isInterim,
    exchangesList,

    // Section 1
    taxableProceedsEUR,
    taxableCostBasisEUR,
    taxableFeesEUR,
    realizedTaxableGainEUR,
    realizedTaxableLossEUR,
    realizedTaxableNetEUR,

    taxFreeProceedsEUR,
    taxFreeCostBasisEUR,
    taxFreeFeesEUR,
    realizedTaxFreeProfitEUR,

    realizedSalesCount: salesInTaxYear.length,
    germanExemptionLimitEUR,
    exemptionExceeded: realizedTaxableNetEUR > germanExemptionLimitEUR,

    totalStakingRewardsEUR,
    stakingFeesEUR: 0,
    stakingNetEUR: totalStakingRewardsEUR,

    exchanges: exchangeSummaries,
    realizedSales: salesInTaxYear,
    rewards: rewardsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),

    // Section 4
    totalPortfolioValueEUR,
    totalTaxFreeValueEUR,
    totalTaxableValueEUR,
    taxFreePercentage: totalPortfolioValueEUR > 0 ? (totalTaxFreeValueEUR / totalPortfolioValueEUR) * 100 : 0,
    totalTaxFreeUnrealizedPnlEUR,
    totalTaxableUnrealizedPnlEUR,
    totalOpenTranchesCostEUR,
    assets: assetSummaries,

    // Section 5
    openTranches,
    upcomingTaxFreeLots,

    // Section 6
    checklist,

    // Raw transactions for the tax year (Anhang B & C Belege)
    yearTransactions: sorted.filter(t => {
      const d = new Date(t.timestamp);
      return !isNaN(d.getTime()) && d.getFullYear() === taxYear;
    }),
  };
}

export function exportTaxReportToCSV(report: PortfolioTaxReport, userProfile?: UserProfile): string {
  const lines: string[] = [];
  lines.push(`STEUERBERICHT KRYPTOWERTE - VERANLAGUNGSZEITRAUM ${report.taxYear}`);
  lines.push(`Private Veräußerungsgeschäfte (§ 23 EStG) & sonstige Einkünfte (§ 22 Nr. 3 EStG)`);
  lines.push(`Erstellt am;${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`);
  lines.push(`Steuerpflichtige/r;${userProfile?.fullName || userProfile?.username || 'Vor- und Nachname'}`);
  lines.push(`Steuer-ID;${userProfile?.taxId || '-'}`);
  lines.push(`Börsen;${report.exchangesList}`);
  lines.push(`Methode;FIFO, je Börse getrennt`);
  lines.push(`Status;${report.isInterim ? `Zwischenstand (${report.reportDate})` : `Endstand (31.12.${report.taxYear})`}`);
  lines.push('');

  lines.push('--- 1. ÜBERSICHT ANLAGE SO ---');
  lines.push(`Veräußerungserlöse (§ 23);${report.taxableProceedsEUR.toFixed(2)} EUR`);
  lines.push(`Anschaffungskosten (§ 23);${report.taxableCostBasisEUR.toFixed(2)} EUR`);
  lines.push(`Werbungskosten / Verkaufsgebühren (§ 23);${report.taxableFeesEUR.toFixed(2)} EUR`);
  lines.push(`Gewinn / Verlust (§ 23);${report.realizedTaxableNetEUR.toFixed(2)} EUR`);
  lines.push(`Freigrenze § 23 EStG;${report.germanExemptionLimitEUR.toFixed(2)} EUR`);
  lines.push(`Status Freigrenze;${report.exemptionExceeded ? 'Steuerpflichtig (über Freigrenze)' : 'Nicht steuerpflichtig (unter Freigrenze)'}`);
  lines.push(`Nachrichtlich steuerfrei (> 1 Jahr) Erlöse;${report.taxFreeProceedsEUR.toFixed(2)} EUR`);
  lines.push(`Nachrichtlich steuerfrei (> 1 Jahr) Gewinn;${report.realizedTaxFreeProfitEUR.toFixed(2)} EUR`);
  lines.push(`Sonstige Einkünfte § 22 Nr. 3 (Staking & Rewards);${report.totalStakingRewardsEUR.toFixed(2)} EUR`);
  lines.push(`Freigrenze § 22 Nr. 3 EStG;256,00 EUR`);
  lines.push('');

  lines.push('--- AUFTEILUNG NACH BÖRSE ---');
  lines.push('Börse;Verkäufe;Ergebnis stpfl. (EUR);Ergebnis steuerfrei (EUR);Rewards § 22 (EUR);Offene Tranchen;Bestandswert (EUR)');
  for (const ex of report.exchanges) {
    lines.push(
      `${ex.displayName};${ex.salesCount};${ex.taxablePnlEUR.toFixed(2)};${ex.taxFreePnlEUR.toFixed(2)};${ex.rewardsEUR.toFixed(2)};${ex.openTranchesCount};${ex.currentValueEUR.toFixed(2)}`
    );
  }
  lines.push(
    `Gesamt;${report.realizedSalesCount};${report.realizedTaxableNetEUR.toFixed(2)};${report.realizedTaxFreeProfitEUR.toFixed(2)};${report.totalStakingRewardsEUR.toFixed(2)};${report.openTranches.length};${report.totalPortfolioValueEUR.toFixed(2)}`
  );
  lines.push('');

  lines.push('--- 2. EINZELNACHWEIS VERÄUSSERUNGEN (FIFO) ---');
  lines.push('Nr.;Börse;Verkauf;Anschaffung;Tage;Asset;Menge;Anschaffungskosten (EUR);Erlös (EUR);Gebühr (EUR);Gewinn/Verlust (EUR);Status (§ 23)');
  for (const s of report.realizedSales) {
    lines.push(
      `${s.displayNr};${s.exchangeDisplayName};${formatDateDE(s.sellDate)};${formatDateDE(s.buyDate)};${s.daysHeld};${s.symbol};${s.amount.toFixed(6)};${s.costBasisEUR.toFixed(2)};${s.proceedsEUR.toFixed(2)};${s.feeEUR.toFixed(2)};${s.realizedPnlEUR.toFixed(2)};${s.isTaxFree ? 'frei' : 'stpfl.'}`
    );
  }
  lines.push('');

  lines.push('--- 3. SONSTIGE EINKÜNFTE (STAKING & REWARDS § 22 NR. 3) ---');
  lines.push('Zufluss;Börse;Asset;Art;Menge;Wert bei Zufluss (EUR)');
  for (const r of report.rewards) {
    lines.push(
      `${formatDateDE(r.date)};${r.exchangeDisplayName};${r.symbol};${r.kind};${r.amount.toFixed(6)};${r.valueEUR.toFixed(2)}`
    );
  }
  lines.push(`Summe Leistungen § 22 Nr. 3;;;;;${report.totalStakingRewardsEUR.toFixed(2)}`);
  lines.push('');

  lines.push('--- 4. COIN-BESTAND ZUM STICHTAG ---');
  lines.push('Asset;Bezeichnung;Gesamtbestand;Davon Kraken;Davon Crypto.com;Steuerfrei;Steuerfrei ab;Wert (EUR)');
  for (const a of report.assets) {
    const krakenBal = a.balanceBySource['kraken'] ? a.balanceBySource['kraken'].toFixed(6) : '-';
    const cdcBal = a.balanceBySource['crypto_com'] ? a.balanceBySource['crypto_com'].toFixed(6) : '-';
    lines.push(
      `${a.symbol};${a.name};${a.totalBalance.toFixed(6)};${krakenBal};${cdcBal};${a.taxFreeBalance.toFixed(6)};${a.earliestTaxFreeDate || '-'};${a.totalCurrentValueEUR.toFixed(2)}`
    );
  }
  lines.push(`Gesamt;;;;;;;${report.totalPortfolioValueEUR.toFixed(2)}`);
  lines.push('');

  lines.push('--- 5. ANHANG A: OFFENE ANSCHAFFUNGSTRANCHEN (FIFO) ---');
  lines.push('Tranche;Börse;Asset;Anschaffung;Menge;Anschaffungskosten (EUR);Tage gehalten;Steuerfrei ab');
  for (const t of report.openTranches) {
    lines.push(
      `${t.trancheId};${t.exchangeDisplayName};${t.symbol};${formatDateDE(t.buyDate)};${t.amount.toFixed(6)};${t.costBasisEUR.toFixed(2)};${t.daysHeld};${t.taxFreeDate}`
    );
  }

  return lines.join('\n');
}

/**
 * Exports raw transactions of a single exchange for a specific tax year as a clean, standardized CSV file
 * to provide as an official audit-proof attachment for tax advisors and tax offices.
 */
export function exportExchangeTransactionsCSV(
  transactions: Transaction[],
  exchange: 'kraken' | 'crypto_com',
  taxYear: number
): string {
  const filtered = transactions.filter(t => {
    const s = (t.source || '').toLowerCase();
    const d = new Date(t.timestamp);
    return s === exchange && !isNaN(d.getTime()) && d.getFullYear() === taxYear;
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const exchangeName = exchange === 'kraken' ? 'Kraken' : 'Crypto.com';
  const lines: string[] = [];
  lines.push(`BELEG-EXPORT ${exchangeName.toUpperCase()} - VERANLAGUNGSZEITRAUM ${taxYear}`);
  lines.push(`Erstellt am;${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`);
  lines.push(`Anzahl Vorgänge;${filtered.length}`);
  lines.push('');
  lines.push('Nr.;Datum;Uhrzeit;Typ;Art;Erhalten Menge;Erhalten Währung;Ausgegeben Menge;Ausgegeben Währung;Kurs (EUR);Gebühr (EUR);Transaktions-ID;Beschreibung');

  filtered.forEach((tx, idx) => {
    const dt = new Date(tx.timestamp);
    const dateStr = !isNaN(dt.getTime()) ? dt.toLocaleDateString('de-DE') : tx.timestamp;
    const timeStr = !isNaN(dt.getTime()) ? dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
    
    let typName = tx.type;
    if (tx.type === 'BUY') typName = 'Kauf' as any;
    else if (tx.type === 'SELL') typName = 'Verkauf' as any;
    else if (tx.type === 'REWARD') typName = 'Reward' as any;
    else if (tx.type === 'STAKE') typName = 'Staking' as any;
    else if (tx.type === 'TRANSFER') typName = 'Transfer' as any;

    lines.push([
      idx + 1,
      dateStr,
      timeStr,
      typName,
      tx.transactionKind || '',
      tx.receivedAmount ? tx.receivedAmount.toString().replace('.', ',') : '0',
      tx.receivedCurrency || '',
      tx.spentAmount ? tx.spentAmount.toString().replace('.', ',') : '0',
      tx.spentCurrency || '',
      tx.pricePerUnitEUR ? tx.pricePerUnitEUR.toFixed(4).replace('.', ',') : '',
      tx.fee ? tx.fee.toFixed(2).replace('.', ',') : '0,00',
      tx.transactionHash || tx.id,
      `"${(tx.description || '').replace(/"/g, '""')}"`
    ].join(';'));
  });

  return '\uFEFF' + lines.join('\r\n');
}

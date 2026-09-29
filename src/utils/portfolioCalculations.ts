import { Transaction, AssetSummary, PortfolioTotals, PortfolioCurrency } from '../types';
import { getCoinPriceEUR, getCoinPriceUSD, getCoinPrice, getCoinDetails, getLiveEurUsdRate } from './priceService';

export const NON_CRYPTO_SYMBOLS = new Set([
  'EUR', 'USD', 'ZEUR', 'ZUSD', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD', 'UNKNOWN', '', 'N/A', 'UNDEFINED', 'NULL'
]);

export function calculateAssetSummaries(
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  currency: PortfolioCurrency = 'EUR'
): { assets: AssetSummary[]; totals: PortfolioTotals } {
  const eurUsdRate = getLiveEurUsdRate();
  const currencySymbol = currency === 'USD' ? '$' : '€';

  const assetMap: Record<string, {
    symbol: string;
    totalBought: number;
    totalSold: number;
    totalInvestedEUR: number;
    totalInvestedUSD: number;
    firstBuyDate: string;
    lastBuyDate: string;
    transactionCount: number;
  }> = {};

  // Sort chronological
  const sorted = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const tx of sorted) {
    let symbol = (tx.receivedCurrency || tx.spentCurrency || 'UNKNOWN').toUpperCase();
    if (symbol === 'MATIC' || symbol === 'POLYGON') {
      symbol = 'POL';
    }

    if (NON_CRYPTO_SYMBOLS.has(symbol)) {
      // If selling crypto to fiat/UNKNOWN, handle the sold crypto asset
      if (tx.type === 'SELL' && tx.spentCurrency && !NON_CRYPTO_SYMBOLS.has(tx.spentCurrency.toUpperCase())) {
        let soldSym = tx.spentCurrency.toUpperCase();
        if (soldSym === 'MATIC' || soldSym === 'POLYGON') {
          soldSym = 'POL';
        }
        if (!assetMap[soldSym]) {
          assetMap[soldSym] = {
            symbol: soldSym,
            totalBought: 0,
            totalSold: 0,
            totalInvestedEUR: 0,
            totalInvestedUSD: 0,
            firstBuyDate: tx.timestamp,
            lastBuyDate: tx.timestamp,
            transactionCount: 0,
          };
        }
        assetMap[soldSym].totalSold += tx.spentAmount;
        assetMap[soldSym].transactionCount += 1;
        assetMap[soldSym].lastBuyDate = tx.timestamp;
      }
      continue;
    }

    if (!assetMap[symbol]) {
      assetMap[symbol] = {
        symbol,
        totalBought: 0,
        totalSold: 0,
        totalInvestedEUR: 0,
        totalInvestedUSD: 0,
        firstBuyDate: tx.timestamp,
        lastBuyDate: tx.timestamp,
        transactionCount: 0,
      };
    }

    const item = assetMap[symbol];
    item.transactionCount += 1;
    item.lastBuyDate = tx.timestamp;
    if (!item.firstBuyDate) item.firstBuyDate = tx.timestamp;

    if (tx.type === 'BUY') {
      item.totalBought += tx.receivedAmount;

      // 1. Precise EUR spent calculation
      let spentEUR = 0;
      if (tx.spentCurrency.toUpperCase() === 'EUR') {
        spentEUR = tx.spentAmount;
      } else if (tx.nativeCurrency?.toUpperCase() === 'EUR' && tx.nativeAmount && tx.nativeAmount > 0) {
        spentEUR = tx.nativeAmount;
      } else if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0 && tx.receivedAmount > 0) {
        spentEUR = tx.pricePerUnitEUR * tx.receivedAmount;
      } else if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
        // If native USD is present and spent is not EUR, convert via tx rate or live rate
        spentEUR = tx.nativeAmountUSD / eurUsdRate;
      } else if (tx.spentCurrency.toUpperCase() === 'USD') {
        spentEUR = tx.spentAmount / eurUsdRate;
      } else {
        spentEUR = tx.spentAmount;
      }

      // 2. Precise USD spent calculation (Matches Crypto.com native USD accounting!)
      let spentUSD = 0;
      if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
        spentUSD = tx.nativeAmountUSD;
      } else if (tx.nativeCurrency?.toUpperCase() === 'USD' && tx.nativeAmount && tx.nativeAmount > 0) {
        spentUSD = tx.nativeAmount;
      } else if (tx.spentCurrency.toUpperCase() === 'USD') {
        spentUSD = tx.spentAmount;
      } else if (tx.pricePerUnitUSD && tx.pricePerUnitUSD > 0 && tx.receivedAmount > 0) {
        spentUSD = tx.pricePerUnitUSD * tx.receivedAmount;
      } else if (tx.spentCurrency.toUpperCase() === 'EUR') {
        spentUSD = tx.spentAmount * eurUsdRate;
      } else {
        spentUSD = spentEUR * eurUsdRate;
      }

      item.totalInvestedEUR += spentEUR;
      item.totalInvestedUSD += spentUSD;
    } else if (tx.type === 'REWARD' || tx.type === 'STAKE') {
      item.totalBought += tx.receivedAmount;
    } else if (tx.type === 'SELL') {
      item.totalSold += tx.spentAmount > 0 ? tx.spentAmount : tx.receivedAmount;
    } else if (tx.type === 'TRANSFER') {
      item.totalBought += tx.receivedAmount;
    }
  }

  let totalPortfolioInvested = 0;
  let totalPortfolioCurrentValue = 0;

  let totalPortfolioInvestedEUR = 0;
  let totalPortfolioCurrentValueEUR = 0;

  const rawAssets = Object.values(assetMap)
    .filter(item => !NON_CRYPTO_SYMBOLS.has(item.symbol.toUpperCase()))
    .map(item => {
    const currentBalance = Math.max(0, item.totalBought - item.totalSold);

    // Active currency metrics
    const totalInvested = currency === 'USD' ? item.totalInvestedUSD : item.totalInvestedEUR;
    const averageBuyPrice = item.totalBought > 0 ? totalInvested / item.totalBought : 0;
    const currentPrice = getCoinPrice(item.symbol, currency, customPrices);
    const currentValue = currentBalance * currentPrice;

    // Cost basis of current open holdings
    const openCostBasis = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPrice
      : totalInvested;

    const pnl = currentValue - openCostBasis;
    const pnlPercentage = openCostBasis > 0 ? (pnl / openCostBasis) * 100 : 0;

    // EUR specific metrics
    const averageBuyPriceEUR = item.totalBought > 0 ? item.totalInvestedEUR / item.totalBought : 0;
    const currentPriceEUR = getCoinPriceEUR(item.symbol, customPrices);
    const currentValueEUR = currentBalance * currentPriceEUR;
    const openCostBasisEUR = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPriceEUR
      : item.totalInvestedEUR;
    const pnlEUR = currentValueEUR - openCostBasisEUR;

    // USD specific metrics
    const averageBuyPriceUSD = item.totalBought > 0 ? item.totalInvestedUSD / item.totalBought : 0;
    const currentPriceUSD = getCoinPriceUSD(item.symbol, customPrices);
    const currentValueUSD = currentBalance * currentPriceUSD;
    const openCostBasisUSD = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPriceUSD
      : item.totalInvestedUSD;
    const pnlUSD = currentValueUSD - openCostBasisUSD;

    totalPortfolioInvested += totalInvested;
    totalPortfolioCurrentValue += currentValue;

    totalPortfolioInvestedEUR += item.totalInvestedEUR;
    totalPortfolioCurrentValueEUR += currentValueEUR;

    const details = getCoinDetails(item.symbol);

    return {
      symbol: item.symbol,
      name: details.name,
      totalBought: item.totalBought,
      totalSold: item.totalSold,
      currentBalance,
      currency,
      currencySymbol,
      totalInvested,
      averageBuyPrice,
      currentPrice,
      currentValue,
      pnl,
      pnlPercentage,
      totalInvestedEUR: item.totalInvestedEUR,
      averageBuyPriceEUR,
      currentPriceEUR,
      currentValueEUR,
      pnlEUR,
      totalInvestedUSD: item.totalInvestedUSD,
      averageBuyPriceUSD,
      currentPriceUSD,
      currentValueUSD,
      pnlUSD,
      firstBuyDate: item.firstBuyDate,
      lastBuyDate: item.lastBuyDate,
      transactionCount: item.transactionCount,
    };
  });

  // Calculate allocation percentage based on active current value
  const assets: AssetSummary[] = rawAssets
    .map(a => ({
      ...a,
      allocationPercentage: totalPortfolioCurrentValue > 0 ? (a.currentValue / totalPortfolioCurrentValue) * 100 : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue);

  const totalPnl = totalPortfolioCurrentValue - totalPortfolioInvested;
  const totalPnlPercentage = totalPortfolioInvested > 0 ? (totalPnl / totalPortfolioInvested) * 100 : 0;

  const totalPnlEUR = totalPortfolioCurrentValueEUR - totalPortfolioInvestedEUR;
  const totalPnlPercentageEUR = totalPortfolioInvestedEUR > 0 ? (totalPnlEUR / totalPortfolioInvestedEUR) * 100 : 0;

  const topAsset = assets[0];

  const totals: PortfolioTotals = {
    currency,
    currencySymbol,
    totalInvested: totalPortfolioInvested,
    currentValue: totalPortfolioCurrentValue,
    totalPnl,
    totalPnlPercentage,
    eurUsdRate,
    totalInvestedEUR: totalPortfolioInvestedEUR,
    currentValueEUR: totalPortfolioCurrentValueEUR,
    totalPnlEUR,
    totalPnlPercentageEUR,
    assetCount: assets.filter(a => a.currentBalance > 0 || a.totalInvested > 0).length,
    transactionCount: transactions.length,
    topAssetSymbol: topAsset ? topAsset.symbol : '-',
    topAssetPercentage: topAsset ? topAsset.allocationPercentage : 0,
  };

  return { assets, totals };
}

export interface TimelineDataPoint {
  date: string;
  formattedDate: string;
  investedCumEUR: number;
  addedEUR: number;
  investedCumUSD: number;
  addedUSD: number;
  investedCum: number;
  added: number;
  currencySymbol: string;
  description: string;
  asset: string;
}

export function generateInvestmentTimeline(
  transactions: Transaction[],
  currency: PortfolioCurrency = 'EUR'
): TimelineDataPoint[] {
  const eurUsdRate = getLiveEurUsdRate();
  const currencySymbol = currency === 'USD' ? '$' : '€';

  const buys = transactions
    .filter(t => t.type === 'BUY' && t.spentAmount > 0 && !NON_CRYPTO_SYMBOLS.has((t.receivedCurrency || '').toUpperCase()))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let cumulativeEUR = 0;
  let cumulativeUSD = 0;
  const points: TimelineDataPoint[] = [];

  for (const buy of buys) {
    let eur = 0;
    let usd = 0;

    if (buy.spentCurrency.toUpperCase() === 'EUR') {
      eur = buy.spentAmount;
      usd = buy.nativeAmountUSD || (buy.spentAmount * eurUsdRate);
    } else if (buy.spentCurrency.toUpperCase() === 'USD') {
      usd = buy.spentAmount;
      eur = buy.spentAmount / eurUsdRate;
    } else if (buy.nativeCurrency === 'EUR' && buy.nativeAmount) {
      eur = buy.nativeAmount;
      usd = eur * eurUsdRate;
    } else if (buy.nativeAmountUSD) {
      usd = buy.nativeAmountUSD;
      eur = usd / eurUsdRate;
    } else {
      eur = buy.spentAmount;
      usd = eur * eurUsdRate;
    }

    cumulativeEUR += eur;
    cumulativeUSD += usd;

    const added = currency === 'USD' ? usd : eur;
    const cumulative = currency === 'USD' ? cumulativeUSD : cumulativeEUR;

    const d = new Date(buy.timestamp);
    const formattedDate = isNaN(d.getTime())
      ? buy.timestamp.substring(0, 10)
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });

    points.push({
      date: buy.timestamp,
      formattedDate,
      investedCumEUR: cumulativeEUR,
      addedEUR: eur,
      investedCumUSD: cumulativeUSD,
      addedUSD: usd,
      investedCum: cumulative,
      added,
      currencySymbol,
      description: buy.description,
      asset: buy.receivedCurrency,
    });
  }

  return points;
}

export interface PortfolioValuePoint {
  date: string;
  formattedDate: string;
  portfolioValue: number;
  investedCapital: number;
  pnl: number;
  pnlPercentage: number;
  txCount: number;
  holdingsSummary: string;
  isToday?: boolean;
  coinValues?: Record<string, number>;
}

/**
 * Calculates portfolio valuation and invested capital progression over time based on historical transactions and live prices
 */
export function generatePortfolioValueHistory(
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  currency: PortfolioCurrency = 'EUR',
  daysFilter: number | 'all' = 'all'
): PortfolioValuePoint[] {
  if (!transactions || transactions.length === 0) return [];

  const isUSD = currency === 'USD';
  const eurUsdRate = getLiveEurUsdRate();

  // Sort chronologically
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group transactions by date (YYYY-MM-DD)
  const dailyMap = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const day = (tx.timestamp || '').substring(0, 10);
    if (!day) continue;
    if (!dailyMap.has(day)) dailyMap.set(day, []);
    dailyMap.get(day)!.push(tx);
  }

  const holdings: Record<string, number> = {};
  const latestHistoricalPrices: Record<string, number> = {};
  let cumulativeInvested = 0;
  const rawPoints: PortfolioValuePoint[] = [];

  for (const [day, dayTxs] of dailyMap.entries()) {
    let dayAddedCount = 0;

    for (const tx of dayTxs) {
      dayAddedCount++;
      const isBuy = tx.type === 'BUY';
      const isSell = tx.type === 'SELL';

      // Investment calculation in active currency
      let spent = 0;
      if (isUSD) {
        if (tx.spentCurrency.toUpperCase() === 'USD') spent = tx.spentAmount;
        else if (tx.nativeAmountUSD) spent = tx.nativeAmountUSD;
        else if (tx.spentCurrency.toUpperCase() === 'EUR') spent = tx.spentAmount * eurUsdRate;
        else spent = tx.spentAmount * eurUsdRate;
      } else {
        if (tx.spentCurrency.toUpperCase() === 'EUR') spent = tx.spentAmount;
        else if (tx.nativeCurrency === 'EUR' && tx.nativeAmount) spent = tx.nativeAmount;
        else if (tx.spentCurrency.toUpperCase() === 'USD') spent = tx.spentAmount / eurUsdRate;
        else spent = tx.spentAmount;
      }

      if (isBuy) {
        const coin = (tx.receivedCurrency || '').toUpperCase();
        if (NON_CRYPTO_SYMBOLS.has(coin)) continue;
        holdings[coin] = (holdings[coin] || 0) + (tx.receivedAmount || 0);
        cumulativeInvested += spent;

        // Track price
        const price = isUSD
          ? (tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : undefined))
          : (tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : undefined));

        if (price && price > 0) {
          latestHistoricalPrices[coin] = price;
        }
      } else if (isSell) {
        const coin = (tx.spentCurrency || '').toUpperCase();
        if (NON_CRYPTO_SYMBOLS.has(coin)) continue;
        holdings[coin] = Math.max(0, (holdings[coin] || 0) - (tx.spentAmount || 0));
        cumulativeInvested = Math.max(0, cumulativeInvested - spent);
      }
    }

    // Evaluate portfolio value on this date using known purchase prices or cost basis
    let dayValuation = 0;
    const dayCoinValues: Record<string, number> = {};
    const holdingParts: string[] = [];

    for (const [coin, amount] of Object.entries(holdings)) {
      if (amount <= 0.00000001) continue;
      const coinPrice = latestHistoricalPrices[coin] || (isUSD ? getCoinPriceUSD(coin, customPrices) : getCoinPriceEUR(coin, customPrices));
      const val = amount * coinPrice;
      dayValuation += val;
      dayCoinValues[coin] = Math.round(val * 100) / 100;
      holdingParts.push(`${amount >= 1 ? amount.toFixed(2) : amount.toFixed(4)} ${coin}`);
    }

    const pnl = dayValuation - cumulativeInvested;
    const pnlPercentage = cumulativeInvested > 0 ? (pnl / cumulativeInvested) * 100 : 0;

    const d = new Date(day);
    const formattedDate = isNaN(d.getTime())
      ? day
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });

    rawPoints.push({
      date: day,
      formattedDate,
      portfolioValue: Math.round(dayValuation * 100) / 100,
      investedCapital: Math.round(cumulativeInvested * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercentage: Math.round(pnlPercentage * 100) / 100,
      txCount: dayAddedCount,
      holdingsSummary: holdingParts.join(', '),
      coinValues: dayCoinValues,
      isToday: false,
    });
  }

  // Append Today / Live Market Valuation point at the end
  let currentLiveValuation = 0;
  const todayCoinValues: Record<string, number> = {};
  const currentHoldingsSummary: string[] = [];

  for (const [coin, amount] of Object.entries(holdings)) {
    if (amount <= 0.00000001) continue;
    const livePrice = isUSD ? getCoinPriceUSD(coin, customPrices) : getCoinPriceEUR(coin, customPrices);
    const val = amount * livePrice;
    currentLiveValuation += val;
    todayCoinValues[coin] = Math.round(val * 100) / 100;
    currentHoldingsSummary.push(`${amount >= 1 ? amount.toFixed(2) : amount.toFixed(4)} ${coin}`);
  }

  const livePnl = currentLiveValuation - cumulativeInvested;
  const livePnlPercentage = cumulativeInvested > 0 ? (livePnl / cumulativeInvested) * 100 : 0;

  const todayStr = new Date().toISOString().substring(0, 10);
  rawPoints.push({
    date: todayStr,
    formattedDate: 'Heute (Live)',
    portfolioValue: Math.round(currentLiveValuation * 100) / 100,
    investedCapital: Math.round(cumulativeInvested * 100) / 100,
    pnl: Math.round(livePnl * 100) / 100,
    pnlPercentage: Math.round(livePnlPercentage * 100) / 100,
    txCount: 0,
    holdingsSummary: currentHoldingsSummary.join(', '),
    coinValues: todayCoinValues,
    isToday: true,
  });

  // Filter by timeframe if requested
  if (daysFilter !== 'all' && typeof daysFilter === 'number') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysFilter);
    const cutoffTime = cutoff.getTime();

    const filtered = rawPoints.filter(p => {
      if (p.isToday) return true;
      const t = new Date(p.date).getTime();
      return !isNaN(t) && t >= cutoffTime;
    });

    return filtered.length > 0 ? filtered : rawPoints;
  }

  return rawPoints;
}

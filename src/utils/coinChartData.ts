import { Transaction, PortfolioCurrency } from '../types';
import { getCoinPriceEUR, getCoinPriceUSD, getLiveEurUsdRate } from './priceService';
import { NON_CRYPTO_SYMBOLS } from './portfolioCalculations';

export type ChartTimeframe = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

export interface ChartTradeItem {
  id: string;
  type: 'BUY' | 'SELL';
  amount: number;
  symbol: string;
  price: number;
  totalCost: number;
  source: string;
  timestamp: string;
  timeStr: string;
}

export interface CoinChartPoint {
  date: string;
  formattedDate: string;
  shortLabel: string;
  timestamp: number;
  price: number;
  holdingBalance: number;
  holdingValue: number;
  investedCapital: number;
  pnl: number;
  pnlPercentage: number;
  trades: ChartTradeItem[];
  hasBuy: boolean;
  hasSell: boolean;
  isToday?: boolean;
}

/**
 * Generate rich, high-resolution chart series for a specific coin or total portfolio,
 * with exact Buy and Sell transaction markers positioned at the historical point in time.
 */
export function generateCoinChartSeries(
  symbol: string | 'ALL',
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  currency: PortfolioCurrency = 'EUR',
  timeframe: ChartTimeframe = 'all'
): { points: CoinChartPoint[]; availableCoins: string[] } {
  const isUSD = currency === 'USD';
  const eurUsdRate = getLiveEurUsdRate();
  const isPortfolio = symbol === 'ALL';
  const targetSymbol = symbol.toUpperCase();

  // 1. Gather all available coins from transactions
  const coinsSet = new Set<string>();
  for (const tx of transactions) {
    if (tx.receivedCurrency && !NON_CRYPTO_SYMBOLS.has(tx.receivedCurrency.toUpperCase())) {
      coinsSet.add(tx.receivedCurrency.toUpperCase());
    }
    if (tx.spentCurrency && !NON_CRYPTO_SYMBOLS.has(tx.spentCurrency.toUpperCase())) {
      coinsSet.add(tx.spentCurrency.toUpperCase());
    }
  }
  const availableCoins = Array.from(coinsSet).sort();

  // 2. Filter relevant transactions
  const relevantTxs = transactions.filter(tx => {
    if (isPortfolio) return true;
    const rec = (tx.receivedCurrency || '').toUpperCase();
    const spent = (tx.spentCurrency || '').toUpperCase();
    return rec === targetSymbol || spent === targetSymbol;
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (relevantTxs.length === 0 && !isPortfolio) {
    // No transactions for this coin yet: produce a baseline flat point with current price
    const livePrice = isUSD ? getCoinPriceUSD(targetSymbol, customPrices) : getCoinPriceEUR(targetSymbol, customPrices);
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    return {
      availableCoins,
      points: [
        {
          date: todayStr,
          formattedDate: now.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
          shortLabel: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          timestamp: now.getTime(),
          price: livePrice,
          holdingBalance: 0,
          holdingValue: 0,
          investedCapital: 0,
          pnl: 0,
          pnlPercentage: 0,
          trades: [],
          hasBuy: false,
          hasSell: false,
          isToday: true,
        }
      ]
    };
  }

  // 3. Determine timeframe cutoff date
  const now = new Date();
  let startDate = new Date();
  switch (timeframe) {
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      if (relevantTxs.length > 0) {
        const firstTxDate = new Date(relevantTxs[0].timestamp);
        startDate = isNaN(firstTxDate.getTime()) ? new Date(now.getTime() - 90 * 86400000) : firstTxDate;
      } else {
        startDate.setDate(now.getDate() - 30);
      }
      break;
  }

  // 4. Map transactions by calendar date (YYYY-MM-DD)
  const txByDay = new Map<string, ChartTradeItem[]>();
  for (const tx of relevantTxs) {
    const day = (tx.timestamp || '').substring(0, 10);
    if (!day) continue;

    const isBuy = tx.type === 'BUY' || (tx.receivedCurrency || '').toUpperCase() === targetSymbol;
    const isSell = tx.type === 'SELL' || (tx.spentCurrency || '').toUpperCase() === targetSymbol;
    if (!isBuy && !isSell) continue;

    const sym = isBuy ? (tx.receivedCurrency || '').toUpperCase() : (tx.spentCurrency || '').toUpperCase();
    const amount = isBuy ? (tx.receivedAmount || 0) : (tx.spentAmount || 0);

    let price = isUSD
      ? (tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : 0))
      : (tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : 0));

    let cost = isUSD
      ? (tx.spentCurrency === 'USD' ? tx.spentAmount : tx.nativeAmountUSD || tx.spentAmount * eurUsdRate)
      : (tx.spentCurrency === 'EUR' ? tx.spentAmount : tx.nativeAmount || tx.spentAmount);

    if ((!price || price <= 0) && amount > 0 && cost > 0) {
      price = cost / amount;
    }

    const txDate = new Date(tx.timestamp);
    const timeStr = isNaN(txDate.getTime())
      ? ''
      : txDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    const item: ChartTradeItem = {
      id: tx.id,
      type: isBuy ? 'BUY' : 'SELL',
      amount,
      symbol: sym,
      price: Math.round(price * 10000) / 10000,
      totalCost: Math.round(cost * 100) / 100,
      source: tx.source,
      timestamp: tx.timestamp,
      timeStr,
    };

    if (!txByDay.has(day)) txByDay.set(day, []);
    txByDay.get(day)!.push(item);
  }

  // 5. Track cumulative balance and execution prices per coin
  const holdings: Record<string, number> = {};
  const knownPrices: Record<string, number> = {};
  let cumulativeInvested = 0;

  // Live prices today for single coin
  const livePriceToday = isPortfolio
    ? 0
    : (isUSD ? getCoinPriceUSD(targetSymbol, customPrices) : getCoinPriceEUR(targetSymbol, customPrices));

  // Determine all days between startDate and today
  const dayList: string[] = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  // If start is in future or today, at least include today
  if (cur.getTime() >= end.getTime()) {
    dayList.push(end.toISOString().substring(0, 10));
  } else {
    while (cur.getTime() <= end.getTime()) {
      dayList.push(cur.toISOString().substring(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }

  // If there are too many days (e.g. > 180), step down sample rate while preserving trade days
  let sampledDays: string[] = dayList;
  if (dayList.length > 180) {
    const step = Math.ceil(dayList.length / 120);
    sampledDays = dayList.filter((d, idx) => {
      // Always include days with trades and the very last day (today)
      if (txByDay.has(d) || idx === 0 || idx === dayList.length - 1) return true;
      return idx % step === 0;
    });
  }

  // Prior balance before startDate
  const firstSampledDay = sampledDays[0];
  for (const tx of relevantTxs) {
    const day = (tx.timestamp || '').substring(0, 10);
    if (!day || day >= firstSampledDay) continue;

    const isBuy = tx.type === 'BUY' || (tx.receivedCurrency || '').toUpperCase() === targetSymbol;
    const isSell = tx.type === 'SELL' || (tx.spentCurrency || '').toUpperCase() === targetSymbol;
    if (!isBuy && !isSell) continue;

    const sym = isBuy ? (tx.receivedCurrency || '').toUpperCase() : (tx.spentCurrency || '').toUpperCase();
    if (NON_CRYPTO_SYMBOLS.has(sym)) continue;
    if (!isPortfolio && sym !== targetSymbol) continue;

    const amount = isBuy ? (tx.receivedAmount || 0) : (tx.spentAmount || 0);

    let price = isUSD
      ? (tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : 0))
      : (tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : 0));

    let cost = isUSD
      ? (tx.spentCurrency === 'USD' ? tx.spentAmount : tx.nativeAmountUSD || tx.spentAmount * eurUsdRate)
      : (tx.spentCurrency === 'EUR' ? tx.spentAmount : tx.nativeAmount || tx.spentAmount);

    if ((!price || price <= 0) && amount > 0 && cost > 0) {
      price = cost / amount;
    }

    if (isBuy) {
      holdings[sym] = (holdings[sym] || 0) + amount;
      cumulativeInvested += cost;
      if (price > 0) knownPrices[sym] = price;
    } else if (isSell) {
      holdings[sym] = Math.max(0, (holdings[sym] || 0) - amount);
      cumulativeInvested = Math.max(0, cumulativeInvested - cost);
      if (price > 0) knownPrices[sym] = price;
    }
  }

  // 6. Build piecewise price anchors per coin (Trade 1 -> Trade 2 -> ... -> Today Live)
  // This guarantees smooth, continuous curves without artificial sawtooth dips on trade dates.
  interface PriceAnchor {
    timestamp: number;
    price: number;
  }

  const coinAnchorsMap: Record<string, PriceAnchor[]> = {};
  const todayMidTs = new Date(now.toISOString().substring(0, 10) + 'T12:00:00').getTime();

  const allRelevantCoins = isPortfolio ? Array.from(coinsSet) : [targetSymbol];
  for (const sym of allRelevantCoins) {
    const live = isUSD ? getCoinPriceUSD(sym, customPrices) : getCoinPriceEUR(sym, customPrices);
    const dayPricesMap = new Map<string, { totalCost: number; totalAmount: number; lastPrice: number }>();

    for (const tx of relevantTxs) {
      const isBuy = tx.type === 'BUY' || (tx.receivedCurrency || '').toUpperCase() === sym;
      const isSell = tx.type === 'SELL' || (tx.spentCurrency || '').toUpperCase() === sym;
      if (!isBuy && !isSell) continue;

      const day = (tx.timestamp || '').substring(0, 10);
      if (!day) continue;

      const amount = isBuy ? (tx.receivedAmount || 0) : (tx.spentAmount || 0);
      let price = isUSD
        ? (tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : 0))
        : (tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : 0));
      const cost = isUSD
        ? (tx.spentCurrency === 'USD' ? tx.spentAmount : tx.nativeAmountUSD || tx.spentAmount * eurUsdRate)
        : (tx.spentCurrency === 'EUR' ? tx.spentAmount : tx.nativeAmount || tx.spentAmount);

      if ((!price || price <= 0) && amount > 0 && cost > 0) {
        price = cost / amount;
      }
      if (price > 0) {
        if (!dayPricesMap.has(day)) {
          dayPricesMap.set(day, { totalCost: 0, totalAmount: 0, lastPrice: price });
        }
        const entry = dayPricesMap.get(day)!;
        entry.totalCost += cost;
        entry.totalAmount += amount;
        entry.lastPrice = price;
      }
    }

    const anchors: PriceAnchor[] = [];
    const sortedDays = Array.from(dayPricesMap.keys()).sort();
    for (const d of sortedDays) {
      const entry = dayPricesMap.get(d)!;
      const avgPrice = entry.totalAmount > 0 && entry.totalCost > 0
        ? entry.totalCost / entry.totalAmount
        : entry.lastPrice;
      const dTs = new Date(d + 'T12:00:00').getTime();
      anchors.push({ timestamp: dTs, price: avgPrice });
    }

    // Add today's live price as authoritative end anchor
    const effectiveLive = live > 0 ? live : (anchors.length > 0 ? anchors[anchors.length - 1].price : 0);
    if (effectiveLive > 0) {
      anchors.push({ timestamp: todayMidTs, price: effectiveLive });
    }

    // Sort and deduplicate anchors by timestamp
    anchors.sort((a, b) => a.timestamp - b.timestamp);
    const deduped: PriceAnchor[] = [];
    for (const a of anchors) {
      if (deduped.length > 0 && deduped[deduped.length - 1].timestamp === a.timestamp) {
        deduped[deduped.length - 1] = a; // take the latest for the same timestamp
      } else {
        deduped.push(a);
      }
    }

    coinAnchorsMap[sym] = deduped;
  }

  function getInterpolatedCoinPrice(sym: string, targetTs: number, fallbackPrice: number): number {
    const anchors = coinAnchorsMap[sym];
    if (!anchors || anchors.length === 0) return fallbackPrice;
    if (anchors.length === 1) return anchors[0].price;

    if (targetTs <= anchors[0].timestamp) {
      return anchors[0].price;
    }
    if (targetTs >= anchors[anchors.length - 1].timestamp) {
      return anchors[anchors.length - 1].price;
    }

    for (let i = 0; i < anchors.length - 1; i++) {
      const a1 = anchors[i];
      const a2 = anchors[i + 1];
      if (targetTs >= a1.timestamp && targetTs <= a2.timestamp) {
        const span = a2.timestamp - a1.timestamp;
        if (span <= 0) return a2.price;
        const fraction = (targetTs - a1.timestamp) / span;
        return a1.price + (a2.price - a1.price) * fraction;
      }
    }

    return fallbackPrice;
  }

  const rawPoints: CoinChartPoint[] = [];

  for (let i = 0; i < sampledDays.length; i++) {
    const day = sampledDays[i];
    const isLast = i === sampledDays.length - 1;
    const tradesOnDay = txByDay.get(day) || [];
    const dayTs = new Date(day + 'T12:00:00').getTime();

    // Process trades on this day to maintain balance & invested capital
    for (const trade of tradesOnDay) {
      const sym = trade.symbol;
      if (NON_CRYPTO_SYMBOLS.has(sym)) continue;
      if (!isPortfolio && sym !== targetSymbol) continue;

      if (trade.type === 'BUY') {
        holdings[sym] = (holdings[sym] || 0) + trade.amount;
        cumulativeInvested += trade.totalCost;
        if (trade.price > 0) knownPrices[sym] = trade.price;
      } else {
        holdings[sym] = Math.max(0, (holdings[sym] || 0) - trade.amount);
        cumulativeInvested = Math.max(0, cumulativeInvested - trade.totalCost);
        if (trade.price > 0) knownPrices[sym] = trade.price;
      }
    }

    let holdingVal = 0;
    let dayPrice = 0;
    let balance = 0;

    if (isPortfolio) {
      // Portfolio valuation mode: accurately sum (amount * coinPrice) across all held coins
      for (const [coin, amount] of Object.entries(holdings)) {
        if (amount <= 0.00000001) continue;
        const live = isUSD ? getCoinPriceUSD(coin, customPrices) : getCoinPriceEUR(coin, customPrices);
        const fallback = knownPrices[coin] || live;
        const coinPrice = isLast && live > 0 ? live : getInterpolatedCoinPrice(coin, dayTs, fallback);
        holdingVal += amount * coinPrice;
        balance += amount;
      }
      dayPrice = holdingVal;
    } else {
      // Single coin mode:
      balance = holdings[targetSymbol] || 0;
      const live = isUSD ? getCoinPriceUSD(targetSymbol, customPrices) : getCoinPriceEUR(targetSymbol, customPrices);
      const fallback = knownPrices[targetSymbol] || live;

      if (isLast && live > 0) {
        dayPrice = live;
      } else {
        dayPrice = getInterpolatedCoinPrice(targetSymbol, dayTs, fallback);
      }

      holdingVal = balance * dayPrice;
    }

    const pnl = holdingVal - cumulativeInvested;
    const pnlPercentage = cumulativeInvested > 0 ? (pnl / cumulativeInvested) * 100 : 0;

    const d = new Date(day);
    const formattedDate = isNaN(d.getTime())
      ? day
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });
    const shortLabel = isNaN(d.getTime())
      ? day
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    const hasBuy = tradesOnDay.some(t => t.type === 'BUY');
    const hasSell = tradesOnDay.some(t => t.type === 'SELL');

    rawPoints.push({
      date: day,
      formattedDate: isLast ? 'Heute (Live)' : formattedDate,
      shortLabel,
      timestamp: isNaN(d.getTime()) ? now.getTime() : d.getTime(),
      price: Math.round(dayPrice * 100) / 100,
      holdingBalance: Math.round(balance * 10000) / 10000,
      holdingValue: Math.round(holdingVal * 100) / 100,
      investedCapital: Math.round(cumulativeInvested * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercentage: Math.round(pnlPercentage * 100) / 100,
      trades: tradesOnDay,
      hasBuy,
      hasSell,
      isToday: isLast,
    });
  }

  return { points: rawPoints, availableCoins };
}

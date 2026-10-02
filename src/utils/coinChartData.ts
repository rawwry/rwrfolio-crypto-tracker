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

  // 5. Track cumulative balance and execution prices
  const knownPrices: Record<string, number> = {};
  let currentBalance = 0;
  let cumulativeInvested = 0;

  // Live prices today
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
  for (const tx of relevantTxs) {
    const day = (tx.timestamp || '').substring(0, 10);
    if (day < sampledDays[0]) {
      const isBuy = tx.type === 'BUY' || (tx.receivedCurrency || '').toUpperCase() === targetSymbol;
      const isSell = tx.type === 'SELL' || (tx.spentCurrency || '').toUpperCase() === targetSymbol;
      const amount = isBuy ? (tx.receivedAmount || 0) : (tx.spentAmount || 0);

      let cost = isUSD
        ? (tx.spentCurrency === 'USD' ? tx.spentAmount : tx.nativeAmountUSD || tx.spentAmount * eurUsdRate)
        : (tx.spentCurrency === 'EUR' ? tx.spentAmount : tx.nativeAmount || tx.spentAmount);

      if (isBuy) {
        currentBalance += amount;
        cumulativeInvested += cost;
        const p = isUSD
          ? (tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : 0))
          : (tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : 0));
        if (p > 0) knownPrices[targetSymbol] = p;
      } else if (isSell) {
        currentBalance = Math.max(0, currentBalance - amount);
        cumulativeInvested = Math.max(0, cumulativeInvested - cost);
      }
    }
  }

  const rawPoints: CoinChartPoint[] = [];

  for (let i = 0; i < sampledDays.length; i++) {
    const day = sampledDays[i];
    const tradesOnDay = txByDay.get(day) || [];

    // Process trades on this day
    for (const trade of tradesOnDay) {
      if (trade.type === 'BUY') {
        currentBalance += trade.amount;
        cumulativeInvested += trade.totalCost;
        if (trade.price > 0) knownPrices[trade.symbol] = trade.price;
      } else {
        currentBalance = Math.max(0, currentBalance - trade.amount);
        cumulativeInvested = Math.max(0, cumulativeInvested - trade.totalCost);
      }
    }

    const isLast = i === sampledDays.length - 1;
    let dayPrice = 0;

    if (isPortfolio) {
      // Portfolio valuation mode
      let dayVal = 0;
      for (const [coin, p] of Object.entries(knownPrices)) {
        dayVal += p;
      }
      dayPrice = Math.max(dayVal, cumulativeInvested);
    } else {
      // Coin price calculation:
      // If there's a trade today, use its execution price.
      // If today is the last day, use live market price.
      // Otherwise, interpolate between last known execution price and live price.
      if (isLast && livePriceToday > 0) {
        dayPrice = livePriceToday;
      } else if (tradesOnDay.length > 0 && tradesOnDay[tradesOnDay.length - 1].price > 0) {
        dayPrice = tradesOnDay[tradesOnDay.length - 1].price;
      } else {
        const lastKnown = knownPrices[targetSymbol] || livePriceToday;
        // Interpolate progress towards livePriceToday
        const progress = sampledDays.length > 1 ? i / (sampledDays.length - 1) : 1;
        dayPrice = lastKnown + (livePriceToday - lastKnown) * progress;
      }
    }

    const holdingVal = isPortfolio ? dayPrice : currentBalance * dayPrice;
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
      price: Math.round(dayPrice * 10000) / 10000,
      holdingBalance: Math.round(currentBalance * 10000) / 10000,
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

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

interface TxCoinEffect {
  type: 'BUY' | 'SELL';
  amount: number;
  fiatCostEUR: number;
  fiatCostUSD: number;
  priceEUR: number;
  priceUSD: number;
}

/**
 * Accurately extracts the effect of a transaction on a specific crypto coin.
 * Returns null if the transaction did not involve targetCoin.
 */
function getTxEffectOnCoin(tx: Transaction, targetCoin: string, eurUsdRate: number): TxCoinEffect | null {
  let rec = (tx.receivedCurrency || '').toUpperCase();
  let spent = (tx.spentCurrency || '').toUpperCase();
  if (rec === 'MATIC' || rec === 'POLYGON') rec = 'POL';
  if (spent === 'MATIC' || spent === 'POLYGON') spent = 'POL';

  const isBuy = rec === targetCoin;
  const isSell = spent === targetCoin;

  if (!isBuy && !isSell) return null;

  const amount = isBuy ? (tx.receivedAmount || 0) : (tx.spentAmount || 0);
  if (amount <= 0) return null;

  // Calculate fiat value in EUR
  let fiatCostEUR = 0;
  if (tx.spentCurrency?.toUpperCase() === 'EUR') {
    fiatCostEUR = tx.spentAmount || 0;
  } else if (tx.receivedCurrency?.toUpperCase() === 'EUR') {
    fiatCostEUR = tx.receivedAmount || 0;
  } else if (tx.nativeCurrency?.toUpperCase() === 'EUR' && tx.nativeAmount && tx.nativeAmount > 0) {
    fiatCostEUR = tx.nativeAmount;
  } else if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0 && amount > 0) {
    fiatCostEUR = tx.pricePerUnitEUR * amount;
  } else if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
    fiatCostEUR = tx.nativeAmountUSD / eurUsdRate;
  } else if (tx.spentCurrency?.toUpperCase() === 'USD') {
    fiatCostEUR = (tx.spentAmount || 0) / eurUsdRate;
  } else if (tx.receivedCurrency?.toUpperCase() === 'USD') {
    fiatCostEUR = (tx.receivedAmount || 0) / eurUsdRate;
  } else {
    fiatCostEUR = isBuy ? (tx.spentAmount || 0) : (tx.receivedAmount || 0);
  }

  // Calculate fiat value in USD
  let fiatCostUSD = fiatCostEUR * eurUsdRate;
  if (tx.spentCurrency?.toUpperCase() === 'USD') {
    fiatCostUSD = tx.spentAmount || 0;
  } else if (tx.receivedCurrency?.toUpperCase() === 'USD') {
    fiatCostUSD = tx.receivedAmount || 0;
  } else if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
    fiatCostUSD = tx.nativeAmountUSD;
  }

  let priceEUR = tx.pricePerUnitEUR || (tx.pricePerUnitUSD ? tx.pricePerUnitUSD / eurUsdRate : 0);
  let priceUSD = tx.pricePerUnitUSD || (tx.pricePerUnitEUR ? tx.pricePerUnitEUR * eurUsdRate : 0);

  if ((!priceEUR || priceEUR <= 0) && amount > 0 && fiatCostEUR > 0) {
    priceEUR = fiatCostEUR / amount;
    priceUSD = fiatCostUSD / amount;
  }

  return {
    type: isBuy ? 'BUY' : 'SELL',
    amount,
    fiatCostEUR,
    fiatCostUSD,
    priceEUR,
    priceUSD,
  };
}

interface PriceAnchor {
  timestamp: number;
  price: number;
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
  timeframe: ChartTimeframe = 'all',
  historicalPrices?: Map<string, number>
): { points: CoinChartPoint[]; availableCoins: string[] } {
  const isUSD = currency === 'USD';
  const eurUsdRate = getLiveEurUsdRate();
  const isPortfolio = symbol === 'ALL';
  const targetSymbol = symbol.toUpperCase();

  // 1. Gather all available coins from transactions
  const coinsSet = new Set<string>();
  for (const tx of transactions) {
    let rec = (tx.receivedCurrency || '').toUpperCase();
    let spent = (tx.spentCurrency || '').toUpperCase();
    if (rec === 'MATIC' || rec === 'POLYGON') rec = 'POL';
    if (spent === 'MATIC' || spent === 'POLYGON') spent = 'POL';

    if (rec && !NON_CRYPTO_SYMBOLS.has(rec)) coinsSet.add(rec);
    if (spent && !NON_CRYPTO_SYMBOLS.has(spent)) coinsSet.add(spent);
  }
  const availableCoins = Array.from(coinsSet).sort();

  // 2. Filter relevant transactions
  const relevantTxs = transactions
    .filter(tx => {
      if (isPortfolio) return true;
      let rec = (tx.receivedCurrency || '').toUpperCase();
      let spent = (tx.spentCurrency || '').toUpperCase();
      if (rec === 'MATIC' || rec === 'POLYGON') rec = 'POL';
      if (spent === 'MATIC' || spent === 'POLYGON') spent = 'POL';
      return rec === targetSymbol || spent === targetSymbol;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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

  // 4. Map transactions by calendar date (YYYY-MM-DD) and hourly slot (YYYY-MM-DDTHH)
  const txByDay = new Map<string, ChartTradeItem[]>();
  const txBySlot = new Map<string, ChartTradeItem[]>();

  for (const tx of relevantTxs) {
    const day = (tx.timestamp || '').substring(0, 10);
    const slot = (tx.timestamp || '').substring(0, 13);
    if (!day) continue;

    const txDate = new Date(tx.timestamp);
    const timeStr = isNaN(txDate.getTime())
      ? ''
      : txDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    if (isPortfolio) {
      for (const coin of availableCoins) {
        const effect = getTxEffectOnCoin(tx, coin, eurUsdRate);
        if (effect && effect.amount > 0) {
          const item: ChartTradeItem = {
            id: `${tx.id}_${coin}`,
            type: effect.type,
            amount: effect.amount,
            symbol: coin,
            price: Number((isUSD ? effect.priceUSD : effect.priceEUR).toFixed(8)),
            totalCost: Math.round((isUSD ? effect.fiatCostUSD : effect.fiatCostEUR) * 100) / 100,
            source: tx.source,
            timestamp: tx.timestamp,
            timeStr,
          };
          if (!txByDay.has(day)) txByDay.set(day, []);
          txByDay.get(day)!.push(item);
          if (slot) {
            if (!txBySlot.has(slot)) txBySlot.set(slot, []);
            txBySlot.get(slot)!.push(item);
          }
        }
      }
    } else {
      const effect = getTxEffectOnCoin(tx, targetSymbol, eurUsdRate);
      if (effect && effect.amount > 0) {
        const item: ChartTradeItem = {
          id: tx.id,
          type: effect.type,
          amount: effect.amount,
          symbol: targetSymbol,
          price: Number((isUSD ? effect.priceUSD : effect.priceEUR).toFixed(8)),
          totalCost: Math.round((isUSD ? effect.fiatCostUSD : effect.fiatCostEUR) * 100) / 100,
          source: tx.source,
          timestamp: tx.timestamp,
          timeStr,
        };
        if (!txByDay.has(day)) txByDay.set(day, []);
        txByDay.get(day)!.push(item);
        if (slot) {
          if (!txBySlot.has(slot)) txBySlot.set(slot, []);
          txBySlot.get(slot)!.push(item);
        }
      }
    }
  }

  // 5. Determine calendar days / hourly intervals list
  const is24h = timeframe === '24h';
  const dayList: string[] = [];

  if (is24h) {
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now.getTime() - h * 3600 * 1000);
      dayList.push(d.toISOString().substring(0, 13)); // 'YYYY-MM-DDTHH'
    }
  } else {
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);

    if (cur.getTime() >= end.getTime()) {
      dayList.push(end.toISOString().substring(0, 10));
    } else {
      while (cur.getTime() <= end.getTime()) {
        dayList.push(cur.toISOString().substring(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
    }
  }

  let sampledDays: string[] = dayList;
  if (!is24h && dayList.length > 180) {
    const step = Math.ceil(dayList.length / 120);
    sampledDays = dayList.filter((d, idx) => {
      if (txByDay.has(d) || idx === 0 || idx === dayList.length - 1) return true;
      return idx % step === 0;
    });
  }

  // 6. Build piecewise price anchors per coin strictly from each coin's OWN transactions
  // This eliminates cross-contamination between different coins.
  const coinAnchorsMap: Record<string, PriceAnchor[]> = {};
  const todayMidTs = new Date(now.toISOString().substring(0, 10) + 'T12:00:00').getTime();
  const allRelevantCoins = isPortfolio ? Array.from(coinsSet) : [targetSymbol];

  for (const sym of allRelevantCoins) {
    const live = isUSD ? getCoinPriceUSD(sym, customPrices) : getCoinPriceEUR(sym, customPrices);
    const dayPricesMap = new Map<string, { totalCost: number; totalAmount: number; lastPrice: number }>();

    for (const tx of transactions) {
      const day = (tx.timestamp || '').substring(0, 10);
      if (!day) continue;

      const effect = getTxEffectOnCoin(tx, sym, eurUsdRate);
      if (!effect || effect.amount <= 0) continue;

      const effPrice = isUSD ? effect.priceUSD : effect.priceEUR;
      const effCost = isUSD ? effect.fiatCostUSD : effect.fiatCostEUR;

      if (effPrice > 0) {
        if (!dayPricesMap.has(day)) {
          dayPricesMap.set(day, { totalCost: 0, totalAmount: 0, lastPrice: effPrice });
        }
        const entry = dayPricesMap.get(day)!;
        entry.totalCost += effCost;
        entry.totalAmount += effect.amount;
        entry.lastPrice = effPrice;
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

    anchors.sort((a, b) => a.timestamp - b.timestamp);
    const deduped: PriceAnchor[] = [];
    for (const a of anchors) {
      if (deduped.length > 0 && deduped[deduped.length - 1].timestamp === a.timestamp) {
        deduped[deduped.length - 1] = a;
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

  // 7. Calculate prior balances and invested capital before the first sampled day
  const holdings: Record<string, number> = {};
  const knownPrices: Record<string, number> = {};
  let cumulativeInvested = 0;

  const firstSampledDay = sampledDays[0];
  const priorTxs = transactions
    .filter(t => {
      const day = (t.timestamp || '').substring(0, is24h ? 13 : 10);
      return day && day < firstSampledDay;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const tx of priorTxs) {
    if (isPortfolio) {
      for (const coin of availableCoins) {
        const effect = getTxEffectOnCoin(tx, coin, eurUsdRate);
        if (effect) {
          if (effect.type === 'BUY') {
            holdings[coin] = (holdings[coin] || 0) + effect.amount;
          } else {
            holdings[coin] = Math.max(0, (holdings[coin] || 0) - effect.amount);
          }
          const p = isUSD ? effect.priceUSD : effect.priceEUR;
          if (p > 0) knownPrices[coin] = p;
        }
      }

      // Track fiat cash in/out for portfolio cumulative invested
      let rec = (tx.receivedCurrency || '').toUpperCase();
      let spent = (tx.spentCurrency || '').toUpperCase();
      if (rec === 'MATIC' || rec === 'POLYGON') rec = 'POL';
      if (spent === 'MATIC' || spent === 'POLYGON') spent = 'POL';

      const isFiatSpent = NON_CRYPTO_SYMBOLS.has(spent);
      const isFiatRec = NON_CRYPTO_SYMBOLS.has(rec);
      if (isFiatSpent && !isFiatRec) {
        const cost = isUSD
          ? (spent === 'USD' ? (tx.spentAmount || 0) : (tx.nativeAmountUSD || (tx.spentAmount || 0) * eurUsdRate))
          : (spent === 'EUR' ? (tx.spentAmount || 0) : (tx.nativeAmount || (tx.spentAmount || 0)));
        cumulativeInvested += cost;
      } else if (isFiatRec && !isFiatSpent) {
        const proceeds = isUSD
          ? (rec === 'USD' ? (tx.receivedAmount || 0) : (tx.nativeAmountUSD || (tx.receivedAmount || 0) * eurUsdRate))
          : (rec === 'EUR' ? (tx.receivedAmount || 0) : (tx.nativeAmount || (tx.receivedAmount || 0)));
        cumulativeInvested = Math.max(0, cumulativeInvested - proceeds);
      }
    } else {
      const effect = getTxEffectOnCoin(tx, targetSymbol, eurUsdRate);
      if (effect) {
        if (effect.type === 'BUY') {
          holdings[targetSymbol] = (holdings[targetSymbol] || 0) + effect.amount;
          cumulativeInvested += (isUSD ? effect.fiatCostUSD : effect.fiatCostEUR);
        } else {
          holdings[targetSymbol] = Math.max(0, (holdings[targetSymbol] || 0) - effect.amount);
          cumulativeInvested = Math.max(0, cumulativeInvested - (isUSD ? effect.fiatCostUSD : effect.fiatCostEUR));
        }
        const p = isUSD ? effect.priceUSD : effect.priceEUR;
        if (p > 0) knownPrices[targetSymbol] = p;
      }
    }
  }

  // 8. Generate simulation points across sampled days
  const rawPoints: CoinChartPoint[] = [];

  for (let i = 0; i < sampledDays.length; i++) {
    const day = sampledDays[i];
    const isLast = i === sampledDays.length - 1;
    const tradesOnDay = is24h
      ? (txBySlot.get(day) || [])
      : (txByDay.get(day) || []);
    const dayTs = is24h
      ? new Date(day + ':00:00Z').getTime()
      : new Date(day + 'T12:00:00').getTime();

    // Process trades on this day to maintain balance & invested capital
    for (const trade of tradesOnDay) {
      const sym = trade.symbol;
      if (NON_CRYPTO_SYMBOLS.has(sym)) continue;
      if (!isPortfolio && sym !== targetSymbol) continue;

      if (trade.type === 'BUY') {
        holdings[sym] = (holdings[sym] || 0) + trade.amount;
        if (trade.price > 0) knownPrices[sym] = trade.price;
      } else {
        holdings[sym] = Math.max(0, (holdings[sym] || 0) - trade.amount);
        if (trade.price > 0) knownPrices[sym] = trade.price;
      }

      if (!isPortfolio) {
        if (trade.type === 'BUY') {
          cumulativeInvested += trade.totalCost;
        } else {
          cumulativeInvested = Math.max(0, cumulativeInvested - trade.totalCost);
        }
      }
    }

    if (isPortfolio) {
      // Find all raw transactions on this day to accurately track fiat cash in/out
      const rawTxsOnDay = transactions.filter(t => (t.timestamp || '').substring(0, 10) === day);
      for (const tx of rawTxsOnDay) {
        let rec = (tx.receivedCurrency || '').toUpperCase();
        let spent = (tx.spentCurrency || '').toUpperCase();
        if (rec === 'MATIC' || rec === 'POLYGON') rec = 'POL';
        if (spent === 'MATIC' || spent === 'POLYGON') spent = 'POL';

        const isFiatSpent = NON_CRYPTO_SYMBOLS.has(spent);
        const isFiatRec = NON_CRYPTO_SYMBOLS.has(rec);
        if (isFiatSpent && !isFiatRec) {
          const cost = isUSD
            ? (spent === 'USD' ? (tx.spentAmount || 0) : (tx.nativeAmountUSD || (tx.spentAmount || 0) * eurUsdRate))
            : (spent === 'EUR' ? (tx.spentAmount || 0) : (tx.nativeAmount || (tx.spentAmount || 0)));
          cumulativeInvested += cost;
        } else if (isFiatRec && !isFiatSpent) {
          const proceeds = isUSD
            ? (rec === 'USD' ? (tx.receivedAmount || 0) : (tx.nativeAmountUSD || (tx.receivedAmount || 0) * eurUsdRate))
            : (rec === 'EUR' ? (tx.receivedAmount || 0) : (tx.nativeAmount || (tx.receivedAmount || 0)));
          cumulativeInvested = Math.max(0, cumulativeInvested - proceeds);
        }
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

      // Authentic historical market price lookup from Binance / Kraken
      const histPrice = historicalPrices?.get(day) ?? (is24h ? historicalPrices?.get(day.substring(0, 13)) : historicalPrices?.get(day.substring(0, 10)));

      if (isLast && live > 0) {
        dayPrice = live;
      } else if (histPrice && histPrice > 0) {
        dayPrice = isUSD ? histPrice * eurUsdRate : histPrice;
      } else {
        dayPrice = getInterpolatedCoinPrice(targetSymbol, dayTs, fallback);
      }

      if (dayPrice <= 0 && fallback > 0) {
        dayPrice = fallback;
      }

      holdingVal = balance * dayPrice;
    }

    const pnl = holdingVal - cumulativeInvested;
    const pnlPercentage = cumulativeInvested > 0 ? (pnl / cumulativeInvested) * 100 : 0;

    let formattedDate = day;
    let shortLabel = day;

    if (is24h) {
      const d = new Date(day + ':00:00Z');
      shortLabel = isNaN(d.getTime())
        ? day.substring(11) + ':00'
        : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      formattedDate = isNaN(d.getTime())
        ? day
        : d.toLocaleString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      const d = new Date(day);
      formattedDate = isNaN(d.getTime())
        ? day
        : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });
      shortLabel = isNaN(d.getTime())
        ? day
        : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }

    const hasBuy = tradesOnDay.some(t => t.type === 'BUY');
    const hasSell = tradesOnDay.some(t => t.type === 'SELL');

    const pointTs = is24h
      ? new Date(day + ':00:00Z').getTime()
      : new Date(day).getTime();

    rawPoints.push({
      date: day,
      formattedDate: isLast ? 'Heute (Live)' : formattedDate,
      shortLabel,
      timestamp: isNaN(pointTs) ? now.getTime() : pointTs,
      price: isPortfolio ? Math.round(dayPrice * 100) / 100 : Number(dayPrice.toFixed(8)),
      holdingBalance: Number(balance.toFixed(8)),
      holdingValue: holdingVal > 0 && holdingVal < 0.01 ? Number(holdingVal.toFixed(6)) : Math.round(holdingVal * 100) / 100,
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

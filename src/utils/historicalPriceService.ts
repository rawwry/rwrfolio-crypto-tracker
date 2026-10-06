// Service for fetching real historical market prices from Binance & Kraken public APIs (no API key required)
// Provides authentic market price curves for BTC, ETH, SOL, DOT, HBAR, AKT, and all other portfolio assets.

import { ChartTimeframe } from './coinChartData';
import { getLiveEurUsdRate } from './priceService';
import { AssetSummary, PortfolioCurrency, Portfolio24hDelta, Asset24hChange } from '../types';

// In-memory cache for market price series to ensure instantaneous responsiveness
const memoryPriceCache = new Map<string, { timestamp: number; prices: Map<string, number> }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory 24h ticker cache (60 seconds TTL) to avoid duplicate API requests
const ticker24hCache = new Map<string, { timestamp: number; pct: number }>();
const TICKER_24H_TTL_MS = 60 * 1000;

/**
 * Fetch real historical market price curve (daily or hourly) for a given coin.
 * Returns a Map of key -> price in EUR.
 * For daily timeframe (7d, 30d, 90d, 1y, all): key is 'YYYY-MM-DD'
 * For 24h timeframe: key is 'YYYY-MM-DDTHH'
 */
export async function fetchHistoricalMarketPrices(
  symbol: string,
  timeframe: ChartTimeframe,
  eurUsdRate: number = getLiveEurUsdRate()
): Promise<Map<string, number>> {
  const sym = symbol.toUpperCase();
  if (sym === 'ALL' || !sym) return new Map();

  const cacheKey = `${sym}_${timeframe}_${eurUsdRate.toFixed(4)}`;
  const cached = memoryPriceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.prices;
  }

  // Also check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`rwrfolio_hist_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.entries)) {
          const map = new Map<string, number>(parsed.entries);
          memoryPriceCache.set(cacheKey, { timestamp: parsed.timestamp, prices: map });
          return map;
        }
      }
    } catch {
      // Ignore cache read error
    }
  }

  const is24h = timeframe === '24h';
  const binanceInterval = is24h ? '1h' : '1d';
  const krakenInterval = is24h ? 60 : 1440;

  let limit = 30;
  switch (timeframe) {
    case '24h':
      limit = 24;
      break;
    case '7d':
      limit = 7;
      break;
    case '30d':
      limit = 30;
      break;
    case '90d':
      limit = 90;
      break;
    case '1y':
      limit = 365;
      break;
    case 'all':
    default:
      limit = 1000;
      break;
  }

  const resultMap = new Map<string, number>();

  // 1. Attempt Binance Public Klines (Fastest, zero auth, highest liquidity)
  try {
    const candidatePairs: string[] = [];
    if (sym === 'POL') {
      candidatePairs.push('POLUSDT', 'MATICEUR', 'MATICUSDT');
    } else if (sym === 'MATIC') {
      candidatePairs.push('MATICEUR', 'MATICUSDT', 'POLUSDT');
    } else {
      candidatePairs.push(`${sym}EUR`, `${sym}USDT`);
    }

    for (const pair of candidatePairs) {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=${limit}`;
        const res = await fetch(url);
        if (res.ok) {
          const klines = await res.json();
          if (Array.isArray(klines) && klines.length > 0) {
            const isUsdt = pair.endsWith('USDT') || pair.endsWith('USD');
            for (const k of klines) {
              const ts = Number(k[0]);
              const d = new Date(ts);
              const key = is24h
                ? d.toISOString().substring(0, 13) // 'YYYY-MM-DDTHH'
                : d.toISOString().substring(0, 10); // 'YYYY-MM-DD'
              const closePrice = parseFloat(k[4]);
              if (closePrice > 0) {
                const priceEUR = isUsdt ? closePrice / eurUsdRate : closePrice;
                resultMap.set(key, priceEUR);
              }
            }
            break; // Successfully loaded from Binance
          }
        }
      } catch {
        // Continue to next pair candidate
      }
    }
  } catch (err) {
    console.warn(`[HistoricalPrices] Binance query error for ${sym}:`, err);
  }

  // 2. If not on Binance (e.g. AKT, MLN, niche Kraken pairs), query Kraken Public OHLC
  if (resultMap.size === 0) {
    try {
      const krakenPairs = [
        `${sym}EUR`,
        `${sym}USD`,
        `X${sym}ZEUR`,
        `X${sym}ZUSD`,
        `${sym}USDT`,
      ];

      for (const kp of krakenPairs) {
        try {
          const url = `https://api.kraken.com/0/public/OHLC?pair=${kp}&interval=${krakenInterval}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const pairKey = Object.keys(data.result || {}).find(k => k !== 'last');
            if (pairKey && Array.isArray(data.result[pairKey])) {
              const rows = data.result[pairKey].slice(-limit);
              const isUsd = pairKey.endsWith('USD') || pairKey.endsWith('ZUSD') || pairKey.endsWith('USDT');
              for (const r of rows) {
                const ts = Number(r[0]) * 1000;
                const d = new Date(ts);
                const key = is24h
                  ? d.toISOString().substring(0, 13)
                  : d.toISOString().substring(0, 10);
                const closePrice = parseFloat(r[4]);
                if (closePrice > 0) {
                  const priceEUR = isUsd ? closePrice / eurUsdRate : closePrice;
                  resultMap.set(key, priceEUR);
                }
              }
              break; // Successfully loaded from Kraken
            }
          }
        } catch {
          // Continue to next Kraken candidate
        }
      }
    } catch (err) {
      console.warn(`[HistoricalPrices] Kraken OHLC error for ${sym}:`, err);
    }
  }

  // Cache results if we have data points
  if (resultMap.size > 0) {
    memoryPriceCache.set(cacheKey, { timestamp: Date.now(), prices: resultMap });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(
          `rwrfolio_hist_${cacheKey}`,
          JSON.stringify({
            timestamp: Date.now(),
            entries: Array.from(resultMap.entries()),
          })
        );
      } catch {
        // Ignore localStorage quota errors
      }
    }
  }

  return resultMap;
}

export interface AssetPeriodChange {
  priceChangePct: number;
  priceChangeFiat: number;
  valueChangeFiat: number;
}

/**
 * Fetch period return for an asset (24h, 7d, 30d, 90d, 1y).
 * Computes priceChangePct, priceChangeFiat and valueChangeFiat on the holding balance.
 */
export async function fetchAssetPeriodChange(
  symbol: string,
  timeframe: ChartTimeframe,
  currentPrice: number,
  balance: number,
  eurUsdRate: number = getLiveEurUsdRate()
): Promise<AssetPeriodChange | null> {
  if (timeframe === 'all' || !symbol || symbol === 'ALL') return null;

  // 1. Fast 24h ticker optimization via Binance & Crypto.com with in-memory caching
  if (timeframe === '24h') {
    const sym = symbol.toUpperCase() === 'MATIC' || symbol.toUpperCase() === 'POLYGON' ? 'POL' : symbol.toUpperCase();
    
    // Check in-memory 24h cache first
    const cached = ticker24hCache.get(sym);
    if (cached && Date.now() - cached.timestamp < TICKER_24H_TTL_MS) {
      const pct = cached.pct;
      const oldPrice = currentPrice / (1 + pct / 100);
      const priceChangeFiat = currentPrice - oldPrice;
      const valueChangeFiat = priceChangeFiat * balance;
      return {
        priceChangePct: pct,
        priceChangeFiat,
        valueChangeFiat,
      };
    }

    // Attempt Binance 24hr ticker
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`);
      if (res.ok) {
        const data = await res.json();
        const pct = parseFloat(data.priceChangePercent);
        if (!isNaN(pct)) {
          ticker24hCache.set(sym, { timestamp: Date.now(), pct });
          const oldPrice = currentPrice / (1 + pct / 100);
          const priceChangeFiat = currentPrice - oldPrice;
          const valueChangeFiat = priceChangeFiat * balance;
          return {
            priceChangePct: pct,
            priceChangeFiat,
            valueChangeFiat,
          };
        }
      }
    } catch {
      // Fall back to Crypto.com or historical candles
    }

    // Attempt Crypto.com public ticker fallback (e.g. for AKT, CRO, etc.)
    try {
      const cdcRes = await fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${sym}_USDT`);
      if (cdcRes.ok) {
        const cdcData = await cdcRes.json();
        const ticker = cdcData.result?.data?.[0];
        if (ticker && ticker.a && ticker.c) {
          const lastAsk = parseFloat(ticker.a);
          const change24 = parseFloat(ticker.c);
          const open24 = lastAsk - change24;
          if (open24 > 0) {
            const pct = (change24 / open24) * 100;
            ticker24hCache.set(sym, { timestamp: Date.now(), pct });
            const oldPrice = currentPrice / (1 + pct / 100);
            const priceChangeFiat = currentPrice - oldPrice;
            const valueChangeFiat = priceChangeFiat * balance;
            return {
              priceChangePct: pct,
              priceChangeFiat,
              valueChangeFiat,
            };
          }
        }
      }
    } catch {
      // Fall back to historical series
    }
  }

  // 2. Multi-day timeframe using historical market candles
  try {
    const history = await fetchHistoricalMarketPrices(symbol, timeframe, eurUsdRate);
    if (!history || history.size < 2) return null;

    const prices = Array.from(history.values());
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1] || currentPrice;

    if (startPrice <= 0) return null;

    const priceChangePct = ((endPrice - startPrice) / startPrice) * 100;
    const priceChangeFiat = endPrice - startPrice;
    const valueChangeFiat = priceChangeFiat * balance;

    return {
      priceChangePct,
      priceChangeFiat,
      valueChangeFiat,
    };
  } catch (err) {
    console.warn(`[HistoricalPrices] Error calculating period return for ${symbol}:`, err);
    return null;
  }
}

/**
 * Calculate aggregate 24h Portfolio Delta (€ / $ absolute & %) across all current coin holdings.
 * Queries ticker price moves for all active assets in parallel, determines exact fiat value gains/losses,
 * and identifies the top 24h contributor and detractor.
 */
export async function calculatePortfolio24hDelta(
  assets: AssetSummary[],
  currency: PortfolioCurrency = 'EUR',
  eurUsdRate: number = getLiveEurUsdRate()
): Promise<Portfolio24hDelta> {
  const isUSD = currency === 'USD';
  const activeAssets = assets.filter(a => a.currentBalance > 0);

  if (activeAssets.length === 0) {
    return {
      changeFiat: 0,
      changePercentage: 0,
      value24hAgo: 0,
      currentValue: 0,
      isPositive: true,
      assetChanges: {},
      isLoading: false,
    };
  }

  const assetChanges: Record<string, Asset24hChange> = {};
  let totalCurrentValue = 0;
  let totalChangeFiat = 0;

  await Promise.allSettled(
    activeAssets.map(async (asset) => {
      const activePrice = isUSD
        ? (asset.currentPriceUSD || asset.currentPrice)
        : (asset.currentPriceEUR || asset.currentPrice);
      const activeValue = isUSD
        ? (asset.currentValueUSD ?? asset.currentValue)
        : (asset.currentValueEUR ?? asset.currentValue);

      totalCurrentValue += activeValue;

      const res = await fetchAssetPeriodChange(
        asset.symbol,
        '24h',
        activePrice,
        asset.currentBalance,
        eurUsdRate
      );

      if (res) {
        totalChangeFiat += res.valueChangeFiat;
        assetChanges[asset.symbol] = {
          symbol: asset.symbol,
          priceChangePct: res.priceChangePct,
          priceChangeFiat: res.priceChangeFiat,
          valueChangeFiat: res.valueChangeFiat,
          currentValue: activeValue,
        };
      } else {
        assetChanges[asset.symbol] = {
          symbol: asset.symbol,
          priceChangePct: 0,
          priceChangeFiat: 0,
          valueChangeFiat: 0,
          currentValue: activeValue,
        };
      }
    })
  );

  const value24hAgo = totalCurrentValue - totalChangeFiat;
  const changePercentage = value24hAgo > 0 ? (totalChangeFiat / value24hAgo) * 100 : 0;
  const isPositive = totalChangeFiat >= 0;

  const changeList = Object.values(assetChanges);
  const contributors = [...changeList].filter(c => c.valueChangeFiat > 0).sort((a, b) => b.valueChangeFiat - a.valueChangeFiat);
  const detractors = [...changeList].filter(c => c.valueChangeFiat < 0).sort((a, b) => a.valueChangeFiat - b.valueChangeFiat);

  const topContributor = contributors[0] || undefined;
  const topDetractor = detractors[0] || undefined;

  return {
    changeFiat: totalChangeFiat,
    changePercentage,
    value24hAgo,
    currentValue: totalCurrentValue,
    isPositive,
    assetChanges,
    topContributor,
    topDetractor,
    isLoading: false,
  };
}

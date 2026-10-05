import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Dot
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  Coins,
  Loader2,
  Crosshair,
  Target,
  Award,
  Activity,
  X,
  Sliders,
  ShieldCheck,
  Clock,
  ChevronRight,
  MessageSquare,
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Transaction, PortfolioCurrency, AssetSummary } from '../types';
import { generateCoinChartSeries, ChartTimeframe, CoinChartPoint, ChartTradeItem } from '../utils/coinChartData';
import { getCoinDetails, getLiveEurUsdRate } from '../utils/priceService';
import { fetchHistoricalMarketPrices } from '../utils/historicalPriceService';

interface InteractiveCoinChartProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  customPrices?: Record<string, number>;
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  selectedCoinInitial?: string;
  onSelectCoin?: (coin: string) => void;
}

export const InteractiveCoinChart: React.FC<InteractiveCoinChartProps> = ({
  assets,
  transactions,
  customPrices = {},
  currency = 'EUR',
  theme = 'dark',
  selectedCoinInitial = 'ALL',
  onSelectCoin,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const currencySymbol = isUSD ? '$' : '€';

  const [selectedCoin, setSelectedCoin] = useState<string>(selectedCoinInitial);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('all');
  const [metricMode, setMetricMode] = useState<'price' | 'value' | 'pnl'>('price');
  const [historicalPrices, setHistoricalPrices] = useState<Map<string, number>>(new Map());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Interactive Chart Tool overlays & Technical Indicators
  const [showDcaLine, setShowDcaLine] = useState(true);
  const [showTradePins, setShowTradePins] = useState(true);
  const [showExtrema, setShowExtrema] = useState(false);
  const [showSma, setShowSma] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showAth, setShowAth] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<CoinChartPoint | null>(null);
  const [inspectedTrade, setInspectedTrade] = useState<ChartTradeItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Prevent background scrolling when fullscreen is active
  React.useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Sync when parent changes selectedCoinInitial
  React.useEffect(() => {
    if (selectedCoinInitial) {
      setSelectedCoin(selectedCoinInitial);
    }
  }, [selectedCoinInitial]);

  // Reset inspected trade and hovered point when coin or timeframe changes
  React.useEffect(() => {
    setInspectedTrade(null);
    setHoveredPoint(null);
  }, [selectedCoin, timeframe]);

  const handleCoinChange = (coin: string) => {
    setSelectedCoin(coin);
    if (onSelectCoin) onSelectCoin(coin);
  };

  const isPortfolio = selectedCoin === 'ALL';

  // Fetch real historical market candles for the active coin from Binance & Kraken
  React.useEffect(() => {
    if (isPortfolio) {
      setHistoricalPrices(new Map());
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);

    fetchHistoricalMarketPrices(selectedCoin, timeframe, getLiveEurUsdRate())
      .then(prices => {
        if (isMounted) {
          setHistoricalPrices(prices);
          setIsLoadingHistory(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCoin, timeframe, isPortfolio]);

  const { points, availableCoins } = useMemo(() => {
    return generateCoinChartSeries(
      selectedCoin,
      transactions,
      customPrices,
      currency as PortfolioCurrency,
      timeframe,
      historicalPrices
    );
  }, [selectedCoin, transactions, customPrices, currency, timeframe, historicalPrices]);

  const coinDetail = isPortfolio ? null : getCoinDetails(selectedCoin);
  const assetItem = isPortfolio ? null : assets.find(a => a.symbol.toUpperCase() === selectedCoin.toUpperCase());

  // Authoritative live portfolio totals calculated from assets
  const portfolioTotalVal = useMemo(() => {
    return assets.reduce((sum, a) => sum + (isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue)), 0);
  }, [assets, isUSD]);

  const portfolioTotalInvested = useMemo(() => {
    return assets.reduce((sum, a) => sum + (isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested)), 0);
  }, [assets, isUSD]);

  const portfolioTotalPnl = portfolioTotalVal - portfolioTotalInvested;
  const portfolioTotalPnlPct = portfolioTotalInvested > 0 ? (portfolioTotalPnl / portfolioTotalInvested) * 100 : 0;

  // Metrics for header
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const firstPoint = points.length > 0 ? points[0] : null;

  const currentPrice = isPortfolio 
    ? portfolioTotalVal 
    : (assetItem?.currentPrice && assetItem.currentPrice > 0 
        ? assetItem.currentPrice 
        : (latestPoint && latestPoint.price > 0 
            ? latestPoint.price 
            : (assetItem?.averageBuyPrice || 0)));
  const currentHolding = isPortfolio ? assets.length : (latestPoint ? latestPoint.holdingBalance : (assetItem?.currentBalance || 0));
  const currentValue = isPortfolio ? portfolioTotalVal : (isUSD ? (assetItem?.currentValueUSD ?? assetItem?.currentValue ?? (latestPoint?.holdingValue || 0)) : (assetItem?.currentValueEUR ?? assetItem?.currentValue ?? (latestPoint?.holdingValue || 0)));
  const currentInvested = isPortfolio ? portfolioTotalInvested : (isUSD ? (assetItem?.totalInvestedUSD ?? assetItem?.totalInvested ?? (latestPoint?.investedCapital || 0)) : (assetItem?.totalInvestedEUR ?? assetItem?.totalInvested ?? (latestPoint?.investedCapital || 0)));
  const currentPnl = isPortfolio ? portfolioTotalPnl : (currentValue - currentInvested);
  const currentPnlPct = isPortfolio ? portfolioTotalPnlPct : (currentInvested > 0 ? (currentPnl / currentInvested) * 100 : 0);

  // Period price & value changes
  const periodPriceDiff = firstPoint && latestPoint ? latestPoint.price - firstPoint.price : 0;
  const periodPricePct = firstPoint && firstPoint.price > 0 ? (periodPriceDiff / firstPoint.price) * 100 : 0;
  const periodValueDiff = firstPoint && latestPoint ? latestPoint.holdingValue - firstPoint.holdingValue : 0;
  const periodValuePct = firstPoint && firstPoint.holdingValue > 0 ? (periodValueDiff / firstPoint.holdingValue) * 100 : currentPnlPct;

  // Determining loss / profit state
  // If period change is flat / zero, defer to overall position currentPnl to prevent false positive green signals
  const isLoss = isPortfolio 
    ? (timeframe === 'all' ? currentPnl < 0 : (periodValueDiff !== 0 ? periodValueDiff < 0 : currentPnl < 0))
    : (metricMode === 'price'
        ? (periodPriceDiff !== 0 ? periodPriceDiff < 0 : currentPnl < 0)
        : (metricMode === 'pnl' 
            ? currentPnl < 0 
            : (periodValueDiff !== 0 ? periodValueDiff < 0 : currentPnl < 0)));

  const isProfit = !isLoss;

  // Count trades in series
  const allTradesInPeriod = useMemo(() => {
    const list: { point: CoinChartPoint; trade: ChartTradeItem }[] = [];
    for (const pt of points) {
      for (const tr of pt.trades) {
        list.push({ point: pt, trade: tr });
      }
    }
    return list;
  }, [points]);

  const buyCount = allTradesInPeriod.filter(t => t.trade.type === 'BUY').length;
  const sellCount = allTradesInPeriod.filter(t => t.trade.type === 'SELL').length;

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatPrice = (val: number) => {
    const dec = val < 0.0001 ? 8 : (val < 0.01 ? 6 : (val < 1 ? 4 : 2));
    return formatCurr(val, dec);
  };

  // Determine active data key for Y axis
  const activeDataKey = isPortfolio 
    ? (metricMode === 'pnl' ? 'pnl' : 'holdingValue')
    : (metricMode === 'price' ? 'price' : (metricMode === 'pnl' ? 'pnl' : 'holdingValue'));

  const chartThemeColor = isLoss ? '#f43f5e' : '#10b981';
  const gradientId = `chartGrad_${selectedCoin}_${metricMode}_${isProfit ? 'green' : 'red'}`;

  // Dynamic YAxis domain calculation ensuring micro-cent coins or flat periods never collapse to [0, 4]
  const yDomain = useMemo(() => {
    if (!points || points.length === 0) return ['auto', 'auto'];
    const values = points
      .map(p => (p as any)[activeDataKey])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return ['auto', 'auto'];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      const pad = min !== 0 ? Math.abs(min) * 0.08 : 0.01;
      const lower = activeDataKey === 'pnl' ? min - pad : Math.max(0, min - pad);
      return [lower, max + pad];
    }

    const diff = max - min;
    const pad = diff * 0.12;
    const lower = activeDataKey === 'pnl' ? min - pad : Math.max(0, min - pad);
    const upper = max + pad;
    return [lower, upper];
  }, [points, activeDataKey]);

  const formatYAxisTick = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return '';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';

    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ${currencySymbol}`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k ${currencySymbol}`;
    if (abs >= 100) return `${sign}${abs.toFixed(0)} ${currencySymbol}`;
    if (abs >= 1) return `${sign}${abs.toFixed(2)} ${currencySymbol}`;
    if (abs >= 0.01) return `${sign}${abs.toFixed(3)} ${currencySymbol}`;
    if (abs >= 0.0001) return `${sign}${abs.toFixed(5)} ${currencySymbol}`;
    if (abs > 0) return `${sign}${abs.toFixed(6)} ${currencySymbol}`;
    return `0 ${currencySymbol}`;
  };

  // DCA average buy price and distance %
  const avgBuyPrice = useMemo(() => {
    if (isPortfolio || !assetItem) return 0;
    return isUSD 
      ? (assetItem.averageBuyPriceUSD || assetItem.averageBuyPrice || 0)
      : (assetItem.averageBuyPriceEUR || assetItem.averageBuyPrice || 0);
  }, [isPortfolio, assetItem, isUSD]);

  const dcaDistancePct = useMemo(() => {
    if (avgBuyPrice <= 0 || currentPrice <= 0) return 0;
    return ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;
  }, [avgBuyPrice, currentPrice]);

  // Technical Indicators: SMA 20, Bollinger Bands (20, 2σ), RSI 14 & All-Time-High (ATH)
  const { pointsWithIndicators, periodAth } = useMemo(() => {
    if (!points || points.length === 0) {
      return { 
        pointsWithIndicators: [] as (CoinChartPoint & { sma20?: number; bbUpper?: number; bbLower?: number; rsi14?: number })[], 
        periodAth: { maxPoint: null as CoinChartPoint | null, maxVal: 0, distancePct: 0 } 
      };
    }

    const smaWindow = Math.min(20, Math.max(3, Math.floor(points.length / 4)));
    const rsiWindow = Math.min(14, Math.max(3, Math.floor(points.length / 4)));

    let maxPt = points[0];
    let maxVal = (points[0] as any)[activeDataKey] ?? 0;

    const enriched = points.map((pt, idx) => {
      const v = (pt as any)[activeDataKey] ?? 0;
      if (typeof v === 'number' && !isNaN(v) && v > maxVal) {
        maxVal = v;
        maxPt = pt;
      }

      // 1. SMA 20
      const start = Math.max(0, idx - smaWindow + 1);
      const windowSlice = points.slice(start, idx + 1);
      const sum = windowSlice.reduce((acc, curr) => acc + ((curr as any)[activeDataKey] || 0), 0);
      const sma = sum / windowSlice.length;

      // 2. Bollinger Bands (20, 2σ)
      const variance = windowSlice.reduce((acc, curr) => {
        const diff = ((curr as any)[activeDataKey] || 0) - sma;
        return acc + (diff * diff);
      }, 0) / windowSlice.length;
      const stdDev = Math.sqrt(variance);
      const bbUpper = sma + 2 * stdDev;
      const bbLower = Math.max(0, sma - 2 * stdDev);

      // 3. RSI 14 (Momentum Oscillator)
      let gains = 0;
      let losses = 0;
      let count = 0;
      for (let i = Math.max(1, idx - rsiWindow + 1); i <= idx; i++) {
        const prevP = (points[i - 1] as any)[activeDataKey] || 0;
        const curP = (points[i] as any)[activeDataKey] || 0;
        const diff = curP - prevP;
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
        count++;
      }
      let rsi = 50;
      if (count > 0) {
        const avgGain = gains / count;
        const avgLoss = losses / count;
        if (avgLoss === 0) {
          rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }
      }

      return {
        ...pt,
        sma20: Number(sma.toFixed(6)),
        bbUpper: Number(bbUpper.toFixed(6)),
        bbLower: Number(bbLower.toFixed(6)),
        rsi14: Number(rsi.toFixed(1)),
      };
    });

    const distancePct = maxVal > 0 && currentPrice > 0 ? ((currentPrice - maxVal) / maxVal) * 100 : 0;

    return {
      pointsWithIndicators: enriched,
      periodAth: { maxPoint: maxPt, maxVal, distancePct }
    };
  }, [points, activeDataKey, currentPrice]);

  // High & Low period extrema
  const extrema = useMemo(() => {
    if (!points || points.length === 0) return { maxPoint: null, minPoint: null, maxVal: 0, minVal: 0 };
    let maxPt = points[0];
    let minPt = points[0];
    let maxV = (points[0] as any)[activeDataKey] ?? 0;
    let minV = (points[0] as any)[activeDataKey] ?? 0;

    for (const pt of points) {
      const v = (pt as any)[activeDataKey];
      if (typeof v === 'number' && !isNaN(v)) {
        if (v > maxV) {
          maxV = v;
          maxPt = pt;
        }
        if (v < minV) {
          minV = v;
          minPt = pt;
        }
      }
    }
    return { maxPoint: maxPt, minPoint: minPt, maxVal: maxV, minVal: minV };
  }, [points, activeDataKey]);

  // Custom Dot renderer that marks BUY and SELL points with TradingView-style interactive badges
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!showTradePins || !payload || !payload.trades || payload.trades.length === 0) {
      return null;
    }

    const hasBuy = payload.hasBuy;
    const hasSell = payload.hasSell;
    const isBoth = hasBuy && hasSell;
    const pinColor = isBoth ? '#f59e0b' : (hasBuy ? '#10b981' : '#f43f5e');

    const isInspected = inspectedTrade && payload.trades.some((t: any) => t.id === inspectedTrade.id);
    const buyTrades = payload.trades.filter((t: any) => t.type === 'BUY');
    const sellTrades = payload.trades.filter((t: any) => t.type === 'SELL');

    let badgeText = '▲ KAUF';
    if (isBoth) {
      badgeText = '▲▼ TRADE';
    } else if (hasBuy) {
      badgeText = buyTrades.length > 1 ? `▲ ${buyTrades.length}×` : '▲ KAUF';
    } else if (hasSell) {
      badgeText = sellTrades.length > 1 ? `▼ ${sellTrades.length}×` : '▼ VERK.';
    }

    // Place badge below curve if near top border (< 36px) to avoid clipping
    const badgeBelow = cy < 36;
    const badgeY = badgeBelow ? cy + 22 : cy - 22;

    return (
      <g 
        key={`pin-${payload.date}-${cx}-${cy}`} 
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setInspectedTrade(payload.trades[0]);
        }}
      >
        {/* Pulsing halo ring on line */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={isInspected ? 11 : 7} 
          fill={pinColor} 
          fillOpacity={isInspected ? 0.5 : 0.25} 
        />
        {/* Anchor point on curve */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={isInspected ? 5 : 3.5} 
          fill={pinColor} 
          stroke={isLight ? '#ffffff' : '#0f172a'} 
          strokeWidth={1.5} 
        />

        {/* Drop guideline */}
        <line 
          x1={cx} 
          y1={cy + (badgeBelow ? 4 : -4)} 
          x2={cx} 
          y2={badgeY + (badgeBelow ? -10 : 10)} 
          stroke={pinColor} 
          strokeDasharray="2 2" 
          strokeWidth={1.2} 
          opacity={0.7} 
        />

        {/* Badge Pin */}
        <g transform={`translate(${cx}, ${badgeY})`}>
          <rect
            x={-25}
            y={-10}
            width={50}
            height={20}
            rx={6}
            fill={isInspected ? (hasBuy ? '#065f46' : '#881337') : (isLight ? '#ffffff' : '#090d16')}
            stroke={isInspected ? '#ffffff' : pinColor}
            strokeWidth={isInspected ? 2 : 1.2}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          />
          <text
            x={0}
            y={3.5}
            textAnchor="middle"
            fill={isInspected ? '#ffffff' : (isLight ? (hasBuy ? '#059669' : '#e11d48') : '#ffffff')}
            fontSize={9}
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.2px"
          >
            {badgeText}
          </text>
        </g>
      </g>
    );
  };

  // Tooltip Synchronizer Component: synchronously updates hoveredPoint for the anchored HUD Card
  // without rendering any duplicate floating element inside the canvas.
  const ChartTooltipSync = ({ active, payload }: any) => {
    React.useEffect(() => {
      if (active && payload && payload.length > 0) {
        setHoveredPoint(payload[0].payload);
      } else {
        setHoveredPoint(null);
      }
    }, [active, payload]);

    return null;
  };


  return (
    <div className={
      isFullscreen
        ? `fixed inset-0 z-[9999] p-4 sm:p-6 overflow-y-auto flex flex-col space-y-4 ${
            isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950/98 backdrop-blur-2xl text-slate-100'
          }`
        : `p-4 sm:p-6 rounded-2xl border shadow-xl transition-all space-y-5 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
          }`
    }>
      
      {/* 1. Header: Coin Selector & Timeframe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Active Asset Identity */}
        <div>
          <div className="flex items-center space-x-2.5">
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md border flex-shrink-0 ${
                isPortfolio 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : (isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700')
              }`}
              style={{
                color: isPortfolio ? '#ffffff' : (coinDetail?.color || '#818cf8'),
              }}
            >
              {isPortfolio ? <Layers className="w-5 h-5 text-white" /> : <TrendingUp className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isPortfolio ? 'Gesamt-Portfolio Entwicklung' : `${selectedCoin} (${coinDetail?.name || selectedCoin})`}
                </h3>
                {(() => {
                  const badgePct = isPortfolio 
                    ? (timeframe === 'all' ? currentPnlPct : periodValuePct)
                    : (metricMode === 'price' ? periodPricePct : (metricMode === 'pnl' ? currentPnlPct : periodValuePct));

                  const isBadgePositive = badgePct > 0.001;
                  const isBadgeNegative = badgePct < -0.001 || (Math.abs(badgePct) <= 0.001 && currentPnl < 0);
                  const badgeSign = isBadgePositive ? '+' : '';

                  const badgeText = isPortfolio 
                    ? (timeframe === 'all' ? `${badgeSign}${badgePct.toFixed(2)} % Rendite` : `${badgeSign}${badgePct.toFixed(2)} % (${timeframe})`)
                    : `${badgeSign}${badgePct.toFixed(2)} % (${timeframe})`;

                  return (
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                      isBadgePositive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                        : (isBadgeNegative
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/25')
                    }`}>
                      {badgeText}
                    </span>
                  );
                })()}
              </div>
              <p className={`text-xs mt-0.5 flex flex-wrap items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{isPortfolio ? 'Portfolio-Verlauf' : 'Echter Kursverlauf & Trades'}</span>
                {!isPortfolio && (
                  <>
                    <span>&bull;</span>
                    {isLoadingHistory ? (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Lade Marktkurs...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        <span>Marktkurs</span>
                      </span>
                    )}
                  </>
                )}
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>{buyCount} Käufe</span>
                </span>
                {sellCount > 0 && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                      <span>{sellCount} Verkäufe</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Timeframe Switcher (`24h`, `7T`, `30T`, `90T`, `1J`, `Gesamt`) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric mode switcher */}
          {!isPortfolio && (
            <div className={`p-1 rounded-xl border flex items-center text-xs font-semibold ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setMetricMode('price')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  metricMode === 'price'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Kurs
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('value')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  metricMode === 'value'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Wert
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('pnl')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  metricMode === 'pnl'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                P&amp;L
              </button>
            </div>
          )}

          {/* Timeframe selector */}
          <div className={`p-1 rounded-xl border flex items-center text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            {(['24h', '7d', '30d', '90d', '1y', 'all'] as ChartTimeframe[]).map((tf) => {
              const labelMap: Record<ChartTimeframe, string> = {
                '24h': '24h',
                '7d': '7T',
                '30d': '30T',
                '90d': '90T',
                '1y': '1J',
                'all': 'Gesamt'
              };
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {labelMap[tf]}
                </button>
              );
            })}
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isFullscreen ? "Vollbildmodus beenden (Esc)" : "Chart im Vollbildmodus öffnen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Vollbild schließen (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
                <span className="hidden sm:inline">Vollbild</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Coin Selector Pills Carousel / Wrap */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {availableCoins
          .slice()
          .sort((a, b) => {
            const allocA = assets.find(x => x.symbol.toUpperCase() === a)?.allocationPercentage || 0;
            const allocB = assets.find(x => x.symbol.toUpperCase() === b)?.allocationPercentage || 0;
            return allocB - allocA;
          })
          .map((sym) => {
            const isSelected = selectedCoin === sym;
            const a = assets.find(x => x.symbol.toUpperCase() === sym);
            const details = getCoinDetails(sym);
            return (
              <button
                key={sym}
                type="button"
                onClick={() => handleCoinChange(sym)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0" 
                  style={{ backgroundColor: details.color || '#818cf8' }} 
                />
                <span>{sym}</span>
                {a && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected 
                      ? 'bg-indigo-800 text-indigo-100' 
                      : (isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {a.allocationPercentage.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}

        <div className={`h-4 w-px mx-1 flex-shrink-0 ${isLight ? 'bg-slate-300' : 'bg-slate-700/50'}`} />

        <button
          type="button"
          onClick={() => handleCoinChange('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer ${
            selectedCoin === 'ALL'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Gesamt-Portfolio</span>
        </button>
      </div>

      {/* 3. KPI Status Grid for Selected Item */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border text-xs font-mono ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
      }`}>
        {/* Metric 1: Live Price / Portfolio Total */}
        <div>
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isPortfolio ? 'Portfolio Gesamtwert' : `Live-Kurs (${selectedCoin})`}
          </span>
          <span className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isPortfolio ? formatCurr(currentValue) : formatPrice(currentPrice)}
          </span>
        </div>

        {/* Metric 2: DCA / Invested */}
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isPortfolio ? 'Investiertes Kapital' : 'Ø Kaufkurs (DCA)'}
            </span>
            {!isPortfolio && avgBuyPrice > 0 && currentPrice > 0 && (
              <span className={`text-[10px] font-mono font-bold ${
                dcaDistancePct >= 0 
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                  : (isLight ? 'text-rose-700' : 'text-rose-400')
              }`}>
                {dcaDistancePct >= 0 ? '+' : ''}{dcaDistancePct.toFixed(1)}%
              </span>
            )}
          </div>
          <span className={`text-sm sm:text-base font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {isPortfolio 
              ? formatCurr(currentInvested) 
              : (avgBuyPrice > 0 ? formatPrice(avgBuyPrice) : '-')}
          </span>
        </div>

        {/* Metric 3: Profit / Loss */}
        <div>
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Gewinn / Verlust (P&amp;L)
          </span>
          <span className={`text-sm sm:text-base font-bold ${
            currentPnl >= 0 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {currentPnl >= 0 ? '+' : ''}{formatCurr(currentPnl)}
          </span>
        </div>

        {/* Metric 4: Trade count */}
        <div>
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Trades auf der Kurve
          </span>
          <span className={`text-sm sm:text-base font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{buyCount} Kauf</span>
            {sellCount > 0 && (
              <>
                <span className="opacity-50">/</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>{sellCount} Verk.</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 3.5 Interactive Chart Overlays Toolbar */}
      {!isPortfolio && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <Sliders className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
            <span className="hidden sm:inline">Chart-Overlays:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* 1. Toggle DCA Reference Line (only in Kurs / price mode) */}
            {metricMode === 'price' && avgBuyPrice > 0 && (
              <button
                type="button"
                onClick={() => setShowDcaLine(!showDcaLine)}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                  showDcaLine
                    ? isLight ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-sm'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Durchschnittlicher Kaufkurs als horizontale Referenzlinie einblenden"
              >
                <Target className="w-3 h-3" />
                <span>Ø Kaufkurs ({formatPrice(avgBuyPrice)})</span>
              </button>
            )}

            {/* 2. Toggle Trade Pins */}
            <button
              type="button"
              onClick={() => setShowTradePins(!showTradePins)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                showTradePins
                  ? isLight ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm' : 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Kauf- und Verkaufs-Badges im Chart ein-/ausblenden"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Trade-Pins ({allTradesInPeriod.length})</span>
            </button>

            {/* 3. Toggle Period Extrema (High/Low) */}
            <button
              type="button"
              onClick={() => setShowExtrema(!showExtrema)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                showExtrema
                  ? isLight ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm' : 'bg-amber-600/25 border-amber-500 text-amber-300 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Höchst- und Tiefststand des Zeitraums markieren"
            >
              <Activity className="w-3 h-3" />
              <span>Hoch / Tief</span>
            </button>

            {/* 4. Toggle SMA Trendline */}
            <button
              type="button"
              onClick={() => setShowSma(!showSma)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                showSma
                  ? isLight ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-sm' : 'bg-purple-600/25 border-purple-500 text-purple-300 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Gleitender Durchschnitt SMA (20-Perioden Trendlinie) einblenden"
            >
              <TrendingUp className="w-3 h-3 text-purple-500" />
              <span>Trend (SMA 20)</span>
            </button>

            {/* 5. Toggle Bollinger Bands */}
            <button
              type="button"
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                showBollinger
                  ? isLight ? 'bg-cyan-100 border-cyan-400 text-cyan-800 shadow-sm' : 'bg-cyan-600/25 border-cyan-500 text-cyan-300 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Bollinger Bänder (20, 2σ Volatilitäts-Korridor) einblenden – visualisiert Überkauft/Überverkauft-Zonen"
            >
              <Activity className="w-3 h-3 text-cyan-500" />
              <span>Bollinger Bänder</span>
            </button>

            {/* 6. Toggle ATH / All-Time-High Reference Line */}
            {metricMode === 'price' && periodAth && periodAth.maxVal > 0 && (
              <button
                type="button"
                onClick={() => setShowAth(!showAth)}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                  showAth
                    ? isLight ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm' : 'bg-amber-600/25 border-amber-500 text-amber-300 shadow-sm'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Allzeithoch / Höchststand als Referenzlinie mit prozentualem Rabattabstand einblenden"
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>ATH ({periodAth.distancePct.toFixed(1)}%)</span>
              </button>
            )}

            {/* 7. Toggle RSI (14) Momentum Oscillator */}
            <button
              type="button"
              onClick={() => setShowRsi(!showRsi)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                showRsi
                  ? isLight ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="RSI 14 (Relative Strength Index) Oszillator einblenden – signalisiert Akkumulations- & Dip-Zonen (<30)"
            >
              <LineChartIcon className={`w-3 h-3 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>RSI (14)</span>
            </button>

            {/* 8. Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-semibold ${
                isFullscreen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isFullscreen ? "Vollbildmodus beenden (Esc)" : "Chart im Vollbildmodus öffnen"}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className={`w-3 h-3 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />}
              <span>{isFullscreen ? 'Vollbild beenden' : 'Vollbild'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3.6 Anchored Live Inspection HUD Card (Fest im Diagrammbereich verankert, 100% sprungfrei & pixel-stabil) */}
      {(() => {
        const displayPoint: CoinChartPoint | null = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);
        const isLive = !hoveredPoint;
        const distBuy = displayPoint && avgBuyPrice > 0 
          ? ((displayPoint.price - avgBuyPrice) / avgBuyPrice) * 100 
          : null;

        return (
          <div className={`h-11 min-h-[44px] max-h-[44px] px-3.5 rounded-xl border flex items-center justify-between text-xs font-mono shadow-sm select-none overflow-x-auto scrollbar-none gap-3 transition-colors duration-150 ${
            isLight 
              ? 'bg-slate-100/90 border-slate-200 text-slate-800' 
              : (hoveredPoint ? 'bg-indigo-950/40 border-indigo-700/60 text-slate-100' : 'bg-slate-950/70 border-slate-800/80 text-slate-200')
          }`}>
            {/* Left Slot: Date, Live/Inspektion Badge & Fixed Trade Slot */}
            <div className="flex items-center gap-2.5 shrink-0 h-full">
              {/* Date */}
              <div className={`w-24 shrink-0 flex items-center gap-1.5 font-sans font-bold text-xs ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`} />
                <span className="truncate">{displayPoint ? displayPoint.formattedDate : 'Live'}</span>
              </div>

              {/* Status Badge with fixed sizing */}
              <div className="w-20 shrink-0 flex items-center">
                {displayPoint?.isToday || isLive ? (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                    isLight 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Live</span>
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border font-sans ${
                    isLight 
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300' 
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    Inspektion
                  </span>
                )}
              </div>

              {/* Fixed Separator */}
              <div className={`w-px h-4 shrink-0 ${isLight ? 'bg-slate-300' : 'bg-slate-700/40'}`} />

              {/* Reserved Trade Slot (Fixed width to completely prevent jitter) */}
              <div className="w-64 sm:w-80 shrink-0 h-7 flex items-center overflow-hidden">
                {displayPoint?.trades && displayPoint.trades.length > 0 ? (
                  <div className="flex items-center gap-1.5 truncate">
                    {displayPoint.trades.map((tr) => (
                      <span 
                        key={tr.id}
                        onClick={() => setInspectedTrade(tr)}
                        title="Klick für Tranchen-Details (§ 23 EStG)"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer hover:scale-105 transition-transform flex items-center gap-1 shrink-0 ${
                          tr.type === 'BUY'
                            ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                            : (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                        }`}
                      >
                        <ShoppingBag className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {tr.type === 'BUY' ? '▲ KAUF' : '▼ VERK.'} {tr.amount.toLocaleString('de-DE')} {tr.symbol} @ {formatPrice(tr.price)}
                        </span>
                        <span className="opacity-75 uppercase text-[9px] font-normal shrink-0">({tr.source.replace('_', '.')})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={`flex items-center text-[11px] font-sans truncate ${isLight ? 'text-slate-500' : 'text-slate-500/80'}`}>
                    {isLive && !isPortfolio ? (
                      <span>💡 Bewege die Maus über die Kurve zur Punkt-Inspektion</span>
                    ) : (
                      <span className="opacity-60 font-mono text-[10px]">Keine Trades am Tag</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Slot: Key metrics with fixed column widths & tabular-nums */}
            {displayPoint && (
              <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs font-mono tabular-nums ml-auto h-full">
                {/* Metric 1: Kurs */}
                {!isPortfolio && (
                  <div className="w-28 sm:w-32 text-right shrink-0 flex items-center justify-end gap-1 font-mono tabular-nums">
                    <span className={`text-[11px] font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kurs:</span>
                    <span className={`font-bold tabular-nums truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      {formatPrice(displayPoint.price)}
                    </span>
                  </div>
                )}

                {/* Metric 2: Wert / Portfolio */}
                <div className="w-28 sm:w-32 text-right shrink-0 flex items-center justify-end gap-1 font-mono tabular-nums">
                  <span className={`text-[11px] font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isPortfolio ? 'Portf.:' : 'Wert:'}
                  </span>
                  <span className={`font-bold tabular-nums truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {formatCurr(displayPoint.holdingValue)}
                  </span>
                </div>

                {/* Metric 3: P&L */}
                <div className="w-40 sm:w-48 text-right shrink-0 flex items-center justify-end gap-1 font-mono tabular-nums">
                  <span className={`text-[11px] font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>P&amp;L:</span>
                  <span className={`font-bold tabular-nums truncate ${
                    displayPoint.pnl >= 0 
                      ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                      : (isLight ? 'text-rose-700' : 'text-rose-400')
                  }`}>
                    {displayPoint.pnl >= 0 ? '+' : ''}{formatCurr(displayPoint.pnl)} ({displayPoint.pnl >= 0 ? '+' : ''}{displayPoint.pnlPercentage.toFixed(2)} %)
                  </span>
                </div>

                {/* Metric 4: Ø Einstieg */}
                {!isPortfolio && (
                  <div className="w-24 sm:w-28 text-right shrink-0 flex items-center justify-end gap-1 font-mono tabular-nums">
                    <span className={`text-[11px] font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Ø:</span>
                    {distBuy !== null ? (
                      <span className={`font-semibold tabular-nums truncate ${
                        distBuy >= 0 
                          ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                          : (isLight ? 'text-rose-700' : 'text-rose-400')
                      }`}>
                        {distBuy >= 0 ? '+' : ''}{distBuy.toFixed(1)} %
                      </span>
                    ) : (
                      <span className={`${isLight ? 'text-slate-400' : 'text-slate-500'} font-mono text-[11px]`}>-</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. Chart Canvas */}
      <div 
        tabIndex={-1}
        style={{ outline: 'none' }}
        className={`w-full relative outline-none focus:outline-none select-none ring-0 focus:ring-0 ${
          isFullscreen ? 'h-[58vh] min-h-[440px]' : 'h-72 sm:h-80'
        }`}
      >
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Keine Chart-Daten für den gewählten Zeitraum vorhanden.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={pointsWithIndicators} 
              margin={{ top: 26, right: 15, left: 5, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  setHoveredPoint(state.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={chartThemeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                stroke="transparent" 
                vertical={false} 
                horizontal={false}
              />

              <XAxis 
                dataKey="shortLabel" 
                stroke={isLight ? '#94a3b8' : '#64748b'} 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <YAxis 
                stroke={isLight ? '#94a3b8' : '#64748b'} 
                fontSize={11}
                width={72}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
                tickFormatter={formatYAxisTick}
              />

              {/* Crosshair Tracker & Payload Synchronizer for Anchored HUD (no inner duplicate box) */}
              <RechartsTooltip 
                content={<ChartTooltipSync />}
                isAnimationActive={false}
                animationDuration={0}
                cursor={{ stroke: '#818cf8', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                wrapperStyle={{ pointerEvents: 'none', zIndex: 40, outline: 'none' }}
              />

              {/* Horizontal DCA Reference Line */}
              {showDcaLine && !isPortfolio && metricMode === 'price' && avgBuyPrice > 0 && (
                <ReferenceLine 
                  y={avgBuyPrice} 
                  stroke="#818cf8" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.8}
                  label={{
                    value: `🎯 Ø ${formatPrice(avgBuyPrice)}`,
                    fill: isLight ? '#4f46e5' : '#a5b4fc',
                    fontSize: 10,
                    position: 'insideTopRight',
                    fontWeight: 600
                  }}
                />
              )}

              {/* Period Extrema: High Point */}
              {showExtrema && extrema.maxPoint && (
                <ReferenceDot
                  x={extrema.maxPoint.shortLabel}
                  y={(extrema.maxPoint as any)[activeDataKey]}
                  r={4}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  label={{
                    value: `▲ Hoch: ${formatPrice(extrema.maxVal)}`,
                    fill: '#10b981',
                    fontSize: 9.5,
                    position: 'top',
                    fontWeight: 'bold'
                  }}
                />
              )}

              {/* Period Extrema: Low Point */}
              {showExtrema && extrema.minPoint && (
                <ReferenceDot
                  x={extrema.minPoint.shortLabel}
                  y={(extrema.minPoint as any)[activeDataKey]}
                  r={4}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  label={{
                    value: `▼ Tief: ${formatPrice(extrema.minVal)}`,
                    fill: '#f43f5e',
                    fontSize: 9.5,
                    position: 'bottom',
                    fontWeight: 'bold'
                  }}
                />
              )}

              {/* 20-period Moving Average (SMA) */}
              {showSma && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Bollinger Bands (20, 2σ Volatilitäts-Korridor) */}
              {showBollinger && (
                <>
                  <Line
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="#06b6d4"
                    strokeWidth={1.3}
                    strokeDasharray="2 2"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbLower"
                    stroke="#06b6d4"
                    strokeWidth={1.3}
                    strokeDasharray="2 2"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* All-Time-High (ATH) Reference Line */}
              {showAth && periodAth && periodAth.maxVal > 0 && (
                <ReferenceLine 
                  y={periodAth.maxVal} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.6}
                  label={{
                    value: `🏆 Hoch: ${formatPrice(periodAth.maxVal)} (${periodAth.distancePct.toFixed(1)}%)`,
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopLeft',
                    fontWeight: 600
                  }}
                />
              )}

              <Area 
                type="monotone" 
                dataKey={activeDataKey} 
                stroke={chartThemeColor} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill={`url(#${gradientId})`}
                dot={renderCustomDot}
                activeDot={{ r: 6, fill: chartThemeColor, stroke: isLight ? '#ffffff' : '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4.5 Synchronized RSI (14) Momentum Oscillator Panel */}
      {showRsi && points.length > 0 && (() => {
        const displayPoint: CoinChartPoint | null = hoveredPoint || points[points.length - 1];
        const rsiVal = (displayPoint as any)?.rsi14 ?? 50;
        const isOversold = rsiVal <= 30;
        const isOverbought = rsiVal >= 70;

        return (
          <div className={`p-3 rounded-xl border space-y-1.5 transition-all ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400 font-sans flex items-center gap-1">
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>RSI (14) Momentum:</span>
                </span>
                <span className="font-bold text-slate-100">{rsiVal.toFixed(1)}</span>
                {isOversold ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Überverkauft (Akkumulations-Zone)
                  </span>
                ) : isOverbought ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Überkauft (Hitze-Zone)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                    Neutral
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-3">
                <span className="text-emerald-400 font-semibold">&le; 30: Überverkauft / Dip</span>
                <span className="text-rose-400 font-semibold">&ge; 70: Überkauft</span>
              </div>
            </div>

            <div 
              tabIndex={-1}
              style={{ outline: 'none' }}
              className="h-16 w-full outline-none focus:outline-none select-none ring-0 focus:ring-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={pointsWithIndicators}
                  margin={{ top: 4, right: 15, left: 5, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <RechartsTooltip 
                    content={() => null}
                    isAnimationActive={false}
                    animationDuration={0}
                    cursor={{ stroke: '#818cf8', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                    wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                  />
                  <CartesianGrid stroke="transparent" vertical={false} horizontal={false} />
                  <YAxis domain={[0, 100]} ticks={[30, 70]} width={25} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                  <Area 
                    type="monotone" 
                    dataKey="rsi14" 
                    stroke="#818cf8" 
                    strokeWidth={1.8} 
                    fill="#818cf8" 
                    fillOpacity={0.15} 
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* 5. Chart Legend & Interactive Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">Kauf (Buy)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">Verkauf (Sell)</span>
          </span>
          {showDcaLine && avgBuyPrice > 0 && metricMode === 'price' && (
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-indigo-400 inline-block" />
              <span className="text-indigo-400 font-medium">Ø Einstieg ({formatPrice(avgBuyPrice)})</span>
            </span>
          )}
          {showSma && (
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-purple-400 inline-block" />
              <span className="text-purple-400 font-medium">SMA 20 Trend</span>
            </span>
          )}
          {showBollinger && (
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-cyan-400 inline-block" />
              <span className="text-cyan-400 font-medium">Bollinger Bänder (20, 2σ)</span>
            </span>
          )}
          {showAth && periodAth && periodAth.maxVal > 0 && (
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
              <span className="text-amber-400 font-medium">ATH ({formatPrice(periodAth.maxVal)})</span>
            </span>
          )}
        </div>
        <div className="opacity-80">
          Tipp: Klicke auf die Pins oder Tranchen für den Steuer- &amp; Performance-Inspektor (§ 23 EStG)
        </div>
      </div>

      {/* 6. Tranche Inspector Card (when a trade pin or tranche card is clicked) */}
      {!isPortfolio && inspectedTrade && (() => {
        const isBuy = inspectedTrade.type === 'BUY';
        const tDate = new Date(inspectedTrade.timestamp);
        const dateStr = !isNaN(tDate.getTime()) 
          ? tDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
          : inspectedTrade.timestamp;
        
        const daysHeld = Math.max(0, Math.floor((Date.now() - (!isNaN(tDate.getTime()) ? tDate.getTime() : Date.now())) / (1000 * 60 * 60 * 24)));
        const isTaxFree = daysHeld >= 365;
        const daysRemaining = Math.max(0, 365 - daysHeld);
        const taxProgress = Math.min(100, Math.max(0, (daysHeld / 365) * 100));

        const tradeCurrentVal = isBuy ? (inspectedTrade.amount * currentPrice) : 0;
        const tradeCost = inspectedTrade.totalCost;
        const tradePnl = isBuy ? (tradeCurrentVal - tradeCost) : 0;
        const tradePnlPct = (isBuy && tradeCost > 0) ? (tradePnl / tradeCost) * 100 : 0;

        return (
          <div className={`p-4 rounded-xl border transition-all space-y-3 font-mono ${
            isLight 
              ? 'bg-indigo-50/70 border-indigo-200 text-slate-800' 
              : 'bg-indigo-950/20 border-indigo-800/60 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-indigo-200' : 'border-indigo-800/40'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className={`font-bold text-xs sm:text-sm font-sans flex items-center gap-1.5 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
                  <Crosshair className="w-4 h-4" />
                  <span>Tranchen-Inspektor: {isBuy ? 'Kauf' : 'Verkauf'} vom {dateStr}</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-300'}`}>
                  {inspectedTrade.source.replace('_', '.')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedTrade(null)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-indigo-100 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                }`}
                title="Inspektor schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* 1. Einstieg */}
              <div className="space-y-0.5">
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kauf-Einstieg</span>
                <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isBuy ? '+' : '-'}{inspectedTrade.amount.toLocaleString('de-DE')} {inspectedTrade.symbol}
                </span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  à {formatPrice(inspectedTrade.price)} ({formatCurr(tradeCost)})
                </span>
              </div>

              {/* 2. Aktueller Wert */}
              <div className="space-y-0.5">
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Aktueller Wert heute</span>
                <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isBuy ? formatCurr(tradeCurrentVal) : '-'}
                </span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Live-Kurs: {formatPrice(currentPrice)}
                </span>
              </div>

              {/* 3. Rendite dieser Tranche */}
              <div className="space-y-0.5">
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Tranchen-Rendite</span>
                {isBuy ? (
                  <>
                    <span className={`font-bold block ${tradePnl >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                      {tradePnl >= 0 ? '+' : ''}{formatCurr(tradePnl)}
                    </span>
                    <span className={`text-[11px] font-bold block ${tradePnlPct >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                      {tradePnlPct >= 0 ? '+' : ''}{tradePnlPct.toFixed(2)} %
                    </span>
                  </>
                ) : (
                  <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'}`}>-</span>
                )}
              </div>

              {/* 4. Deutsche Steuerfrist */}
              <div className="space-y-0.5">
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Haltefrist (§ 23 EStG)</span>
                {isBuy ? (
                  <>
                    {isTaxFree ? (
                      <div className={`flex items-center gap-1.5 font-bold text-xs ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                        <span>Steuerfrei!</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 font-bold text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Noch {daysRemaining} Tage</span>
                      </div>
                    )}
                    <span className={`text-[10px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {daysHeld} von 365 Tagen ({taxProgress.toFixed(0)}%)
                    </span>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden mt-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                      <div 
                        className={`h-full rounded-full ${isTaxFree ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${taxProgress}%` }} 
                      />
                    </div>
                  </>
                ) : (
                  <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'}`}>-</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Tranches Timeline Ribbon */}
      {!isPortfolio && allTradesInPeriod.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <ShoppingBag className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>Ausgeführte Trades im Diagramm ({allTradesInPeriod.length})</span>
            </span>
            <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Klicke auf einen Pin oder eine Karte zur Tranchen-Analyse
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allTradesInPeriod.map(({ trade }, idx) => {
              const isBuy = trade.type === 'BUY';
              const isSelected = inspectedTrade?.id === trade.id;
              const tradeCurVal = isBuy ? trade.amount * currentPrice : 0;
              const pnl = isBuy ? tradeCurVal - trade.totalCost : 0;
              const pnlPct = (isBuy && trade.totalCost > 0) ? (pnl / trade.totalCost) * 100 : 0;
              
              const tDate = new Date(trade.timestamp);
              const dStr = !isNaN(tDate.getTime()) 
                ? tDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                : trade.timestamp.slice(0, 10);
              const days = Math.floor((Date.now() - (!isNaN(tDate.getTime()) ? tDate.getTime() : Date.now())) / (1000 * 60 * 60 * 24));
              const taxExempt = days >= 365;

              return (
                <button
                  key={trade.id || idx}
                  type="button"
                  onClick={() => setInspectedTrade(isSelected ? null : trade)}
                  className={`p-2.5 rounded-xl border text-left flex-shrink-0 transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? (isLight 
                          ? 'bg-indigo-100 border-indigo-500 shadow-md ring-1 ring-indigo-500 text-indigo-950 font-bold' 
                          : 'bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500 text-white')
                      : isLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="flex items-center gap-1 font-bold">
                      <span className={`w-2 h-2 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{isBuy ? 'KAUF' : 'VERKAUF'}</span>
                      <span className="opacity-60 font-normal">{dStr}</span>
                    </span>
                    {isBuy && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        taxExempt 
                          ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30')
                          : (isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                      }`}>
                        {taxExempt ? 'Steuerfrei' : `${days}T`}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 font-bold">
                    {isBuy ? '+' : '-'}{trade.amount.toLocaleString('de-DE')} {trade.symbol}
                  </div>

                  <div className={`flex items-center justify-between gap-2 text-[10px] mt-1 font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span>Kurs: {formatPrice(trade.price)}</span>
                    {isBuy && (
                      <span className={`font-mono font-bold ${
                        pnl >= 0 
                          ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                          : (isLight ? 'text-rose-700' : 'text-rose-400')
                      }`}>
                        {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Notice if no trades in active timeframe */}
      {!isPortfolio && allTradesInPeriod.length === 0 && timeframe !== 'all' && (
        <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-800 text-slate-400'
        }`}>
          <span>Keine Trades im gewählten Zeitraum ({timeframe.toUpperCase()}).</span>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-2 flex items-center gap-1"
          >
            <span>Alle historischen Käufe anzeigen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};

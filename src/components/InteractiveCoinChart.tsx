import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceDot,
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
  Coins
} from 'lucide-react';
import { Transaction, PortfolioCurrency, AssetSummary } from '../types';
import { generateCoinChartSeries, ChartTimeframe, CoinChartPoint, ChartTradeItem } from '../utils/coinChartData';
import { getCoinDetails } from '../utils/priceService';

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

  // Sync when parent changes selectedCoinInitial
  React.useEffect(() => {
    if (selectedCoinInitial) {
      setSelectedCoin(selectedCoinInitial);
    }
  }, [selectedCoinInitial]);

  const handleCoinChange = (coin: string) => {
    setSelectedCoin(coin);
    if (onSelectCoin) onSelectCoin(coin);
  };

  const { points, availableCoins } = useMemo(() => {
    return generateCoinChartSeries(
      selectedCoin,
      transactions,
      customPrices,
      currency as PortfolioCurrency,
      timeframe
    );
  }, [selectedCoin, transactions, customPrices, currency, timeframe]);

  const isPortfolio = selectedCoin === 'ALL';
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

  // Custom Dot renderer that marks BUY and SELL points clearly with glowing rings
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || !payload.trades || payload.trades.length === 0) {
      return null;
    }

    const hasBuy = payload.hasBuy;
    const hasSell = payload.hasSell;
    const dotColor = hasBuy && hasSell ? '#f59e0b' : (hasBuy ? '#10b981' : '#f43f5e');

    return (
      <g key={`dot-${payload.date}-${cx}-${cy}`}>
        {/* Pulsing outer aura */}
        <circle cx={cx} cy={cy} r={8} fill={dotColor} fillOpacity={0.25} />
        {/* Inner solid badge */}
        <circle cx={cx} cy={cy} r={4.5} fill={dotColor} stroke={isLight ? '#ffffff' : '#0f172a'} strokeWidth={2} />
      </g>
    );
  };

  // Custom Rich Interactive Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: CoinChartPoint = payload[0].payload;
    if (!data) return null;

    const priceDec = data.price < 0.0001 ? 8 : (data.price < 0.01 ? 6 : (data.price < 1 ? 4 : 2));

    return (
      <div className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md max-w-xs text-xs z-50 transition-all ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50' 
          : 'bg-slate-900/95 border-slate-700/80 text-white shadow-black/80'
      }`}>
        {/* Header: Date */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800">
          <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            {data.formattedDate}
          </span>
          {data.isToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live
            </span>
          )}
        </div>

        {/* Core Metric Values */}
        <div className="py-2 space-y-1 font-mono">
          {!isPortfolio && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-sans">Kurs:</span>
              <span className="font-bold text-slate-100">{formatCurr(data.price, priceDec)}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 font-sans">
              {isPortfolio ? 'Portfoliowert:' : 'Bestandswert:'}
            </span>
            <span className="font-bold text-slate-100">{formatCurr(data.holdingValue)}</span>
          </div>

          {!isPortfolio && data.holdingBalance > 0 && (
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400 font-sans">Bestand:</span>
              <span className="text-slate-300">{data.holdingBalance.toLocaleString('de-DE')} {selectedCoin}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 font-sans">Gewinn / Verlust:</span>
            <span className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.pnl >= 0 ? '+' : ''}{formatCurr(data.pnl)} ({data.pnl >= 0 ? '+' : ''}{data.pnlPercentage.toFixed(2)} %)
            </span>
          </div>
        </div>

        {/* Embedded Trades on this date */}
        {data.trades && data.trades.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              <span>{data.trades.length} Trade{data.trades.length !== 1 ? 's' : ''} ausgeführt:</span>
            </div>

            {data.trades.map((tr, idx) => {
              const isBuy = tr.type === 'BUY';
              return (
                <div 
                  key={tr.id || idx} 
                  className={`p-2 rounded-lg border text-[11px] ${
                    isBuy 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${isBuy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{isBuy ? 'KAUF' : 'VERKAUF'}</span>
                      {tr.timeStr && <span className="opacity-75 font-normal text-[10px]">({tr.timeStr})</span>}
                    </span>
                    <span className="font-mono">{isBuy ? '+' : '-'}{tr.amount.toLocaleString('de-DE')} {tr.symbol}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mt-1 opacity-90 font-mono">
                    <span>Kurs: {formatPrice(tr.price)}</span>
                    <span>Kosten: {formatCurr(tr.totalCost)}</span>
                  </div>

                  <div className="text-[9px] mt-0.5 opacity-75 capitalize">
                    Börse: {tr.source.replace('_', '.')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl transition-all space-y-5 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
    }`}>
      
      {/* 1. Header: Coin Selector & Timeframe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Active Asset Identity */}
        <div>
          <div className="flex items-center space-x-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md border ${
              isPortfolio 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-white'
            }`}>
              {isPortfolio ? <Layers className="w-5 h-5" /> : selectedCoin.substring(0, 3)}
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
              <p className={`text-xs mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Interaktiver Kurs- &amp; Trade-Verlauf</span>
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
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setMetricMode('price')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  metricMode === 'price'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'hover:text-white'
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
                    : 'hover:text-white'
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
                    : 'hover:text-white'
                }`}
              >
                P&amp;L
              </button>
            </div>
          )}

          {/* Timeframe selector */}
          <div className={`p-1 rounded-xl border flex items-center text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-300'
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
                      : 'hover:text-white'
                  }`}
                >
                  {labelMap[tf]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Coin Selector Pills Carousel / Wrap */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
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

        {availableCoins.map((sym) => {
          const isSelected = selectedCoin === sym;
          const a = assets.find(x => x.symbol.toUpperCase() === sym);
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
              <span>{sym}</span>
              {a && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {a.allocationPercentage.toFixed(1)}%
                </span>
              )}
            </button>
          );
        })}
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
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isPortfolio ? 'Investiertes Kapital' : 'Ø Kaufkurs (DCA)'}
          </span>
          <span className={`text-sm sm:text-base font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {isPortfolio 
              ? formatCurr(currentInvested) 
              : (assetItem && assetItem.averageBuyPrice ? formatPrice(isUSD ? (assetItem.averageBuyPriceUSD || assetItem.averageBuyPrice) : (assetItem.averageBuyPriceEUR || assetItem.averageBuyPrice)) : '-')}
          </span>
        </div>

        {/* Metric 3: Profit / Loss */}
        <div>
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Gewinn / Verlust (P&amp;L)
          </span>
          <span className={`text-sm sm:text-base font-bold ${currentPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {currentPnl >= 0 ? '+' : ''}{formatCurr(currentPnl)}
          </span>
        </div>

        {/* Metric 4: Trade count */}
        <div>
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Trades auf der Kurve
          </span>
          <span className={`text-sm sm:text-base font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>{buyCount} Kauf</span>
            {sellCount > 0 && (
              <>
                <span className="opacity-50">/</span>
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                <span>{sellCount} Verk.</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 4. Chart Canvas */}
      <div className="h-72 sm:h-80 w-full relative">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Keine Chart-Daten für den gewählten Zeitraum vorhanden.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={chartThemeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isLight ? '#e2e8f0' : '#1e293b'} 
                vertical={false} 
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

              <RechartsTooltip content={<CustomTooltip />} />

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

      {/* 5. Chart Legend & Tooltip Hint */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">Kauf-Zeitpunkt (Buy)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">Verkauf-Zeitpunkt (Sell)</span>
          </span>
        </div>
        <div className="opacity-80">
          Tipp: Fahre mit der Maus über die Punkte für genaue Trade-Details
        </div>
      </div>

    </div>
  );
};

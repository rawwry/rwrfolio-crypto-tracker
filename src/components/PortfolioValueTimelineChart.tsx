import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Percent, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Transaction, PortfolioCurrency } from '../types';
import { generatePortfolioValueHistory, PortfolioValuePoint } from '../utils/portfolioCalculations';

interface PortfolioValueTimelineChartProps {
  transactions: Transaction[];
  customPrices: Record<string, number>;
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

export const PortfolioValueTimelineChart: React.FC<PortfolioValueTimelineChartProps> = ({
  transactions,
  customPrices,
  currency = 'EUR',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const currencySymbol = isUSD ? '$' : '€';

  const [timeframe, setTimeframe] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'value' | 'pnl'>('value');

  const historyData = useMemo(() => {
    return generatePortfolioValueHistory(transactions, customPrices, currency as PortfolioCurrency, timeframe);
  }, [transactions, customPrices, currency, timeframe]);

  const latestPoint = historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const initialPoint = historyData.length > 0 ? historyData[0] : null;

  const currentVal = latestPoint ? latestPoint.portfolioValue : 0;
  const currentInvested = latestPoint ? latestPoint.investedCapital : 0;
  const currentPnl = latestPoint ? latestPoint.pnl : 0;
  const currentPnlPct = latestPoint ? latestPoint.pnlPercentage : 0;
  const isProfit = currentPnl >= 0;

  // Find max value reached in this timeframe
  const maxVal = useMemo(() => {
    if (historyData.length === 0) return 0;
    return Math.max(...historyData.map(p => p.portfolioValue));
  }, [historyData]);

  const formatCurrency = (val: number, decimals: number = 0) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: PortfolioValuePoint = payload[0].payload;
      const isPointProfit = data.pnl >= 0;

      return (
        <div className={`p-3.5 rounded-xl shadow-2xl border text-xs space-y-2 max-w-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          <div className={`flex items-center justify-between border-b pb-1.5 font-sans ${isLight ? 'border-slate-100' : 'border-slate-700/60'}`}>
            <div className="flex items-center space-x-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{data.formattedDate}</span>
              {data.isToday && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-normal">
                  Live
                </span>
              )}
            </div>
            {data.txCount > 0 && (
              <span className="text-[11px] text-slate-400">
                {data.txCount} Transaktion{data.txCount !== 1 ? 'en' : ''}
              </span>
            )}
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-baseline">
              <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert:</span>
              <span className="font-bold text-sm text-emerald-400">
                {formatCurrency(data.portfolioValue, 2)}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert:</span>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-indigo-300'}`}>
                {formatCurrency(data.investedCapital, 2)}
              </span>
            </div>

            <div className={`flex justify-between items-baseline pt-1 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Rendite:</span>
              <span className={`font-bold ${isPointProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPointProfit ? '+' : ''}{formatCurrency(data.pnl, 2)} ({isPointProfit ? '+' : ''}{data.pnlPercentage.toFixed(2)} %)
              </span>
            </div>
          </div>

          {data.holdingsSummary && (
            <div className={`text-[10px] pt-1.5 border-t font-sans truncate ${isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
              <span className="font-semibold">Bestand:</span> {data.holdingsSummary}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800/80'
      }`}>
        <TrendingUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-300">Noch keine Transaktionen für den Wertverlauf</h4>
        <p className="text-xs text-slate-500 mt-1">Importiere Trades, um die historische Entwicklung deines Portfolios zu sehen.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border shadow-xl overflow-hidden transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800/90'
    }`}>
      {/* Header with Title and Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Portfolio-Gesamtbewertung über Zeit</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Transaktions-Historie
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Entwicklung deines Gesamtportfolios vom ersten Kauf bis zum aktuellen Live-Marktkurs
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <button
              onClick={() => setViewMode('value')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'value'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wert &amp; Investition
            </button>
            <button
              onClick={() => setViewMode('pnl')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'pnl'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gewinnkurve (PnL)
            </button>
          </div>

          {/* Timeframe selector */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alles
            </button>
            <button
              onClick={() => setTimeframe(180)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 180
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeframe(90)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 90
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3M
            </button>
            <button
              onClick={() => setTimeframe(30)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 30
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30T
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Summary Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b text-xs font-mono ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'
      }`}>
        <div>
          <span className={`text-[11px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Portfoliowert</span>
          <span className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatCurrency(currentVal, 2)}
          </span>
        </div>
        <div>
          <span className={`text-[11px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiertes Kapital</span>
          <span className={`text-base font-semibold ${isLight ? 'text-slate-700' : 'text-indigo-300'}`}>
            {formatCurrency(currentInvested, 2)}
          </span>
        </div>
        <div>
          <span className={`text-[11px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gesamtrendite (PnL)</span>
          <span className={`text-base font-bold flex items-center space-x-1 ${
            isProfit ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isProfit ? <ArrowUpRight className="w-4 h-4 inline" /> : <ArrowDownRight className="w-4 h-4 inline" />}
            <span>{isProfit ? '+' : ''}{formatCurrency(currentPnl, 2)} ({isProfit ? '+' : ''}{currentPnlPct.toFixed(1)} %)</span>
          </span>
        </div>
        <div>
          <span className={`text-[11px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Höchststand im Zeitraum</span>
          <span className="text-base font-semibold text-emerald-400">
            {formatCurrency(maxVal, 2)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorInvestedLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
              />
              
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}${currencySymbol}`}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              
              <RechartsTooltip 
                content={<CustomTooltip />} 
                isAnimationActive={false} 
                animationDuration={0}
              />

              {viewMode === 'value' ? (
                <>
                  {/* Invested Capital area and dashed line */}
                  <Area 
                    type="monotone" 
                    dataKey="investedCapital" 
                    stroke="#818cf8" 
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorInvestedLine)" 
                    name="Investiert"
                  />

                  {/* Portfolio Valuation line and glowing fill */}
                  <Area 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    stroke="#10b981" 
                    strokeWidth={2.8}
                    fillOpacity={1} 
                    fill="url(#colorPortfolioValue)" 
                    name="Portfoliowert"
                  />
                </>
              ) : (
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                  name="Gewinn/Verlust"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full"></span>
              <span className="text-slate-300 font-medium">Portfolio-Gesamtwert</span>
            </div>
            {viewMode === 'value' && (
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-indigo-400 border-dashed rounded-full"></span>
                <span className="text-slate-400">Investiertes Kapital (DCA)</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Zeigt reale Anschaffungszeitpunkte &bull; <strong>{historyData.length} Datenpunkte</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

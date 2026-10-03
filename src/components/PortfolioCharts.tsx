import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from 'recharts';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { getCoinDetails } from '../utils/priceService';
import { PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Layers, DollarSign, Wallet } from 'lucide-react';

interface PortfolioChartsProps {
  assets: AssetSummary[];
  transactions?: Transaction[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

type AllocationMode = 'value' | 'invested';

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  assets,
  currency = 'EUR' as PortfolioCurrency,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const [mode, setMode] = useState<AllocationMode>('value');
  const [activeCoinSymbol, setActiveCoinSymbol] = useState<string | null>(null);

  // Compute portfolio totals
  const totalValue = useMemo(() => {
    return assets.reduce((sum, a) => {
      const val = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
      return sum + (val > 0 ? val : 0);
    }, 0);
  }, [assets, isUSD]);

  const totalInvested = useMemo(() => {
    return assets.reduce((sum, a) => {
      const inv = isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested);
      return sum + (inv > 0 ? inv : 0);
    }, 0);
  }, [assets, isUSD]);

  // Transform assets into comprehensive allocation entries
  const items = useMemo(() => {
    return assets
      .map(a => {
        const details = getCoinDetails(a.symbol);
        const val = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
        const inv = isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested);
        const pnl = isUSD ? (a.pnlUSD ?? a.pnl) : (a.pnlEUR ?? a.pnl);

        const valPct = totalValue > 0 ? (val / totalValue) * 100 : 0;
        const invPct = totalInvested > 0 ? (inv / totalInvested) * 100 : 0;
        const shiftPct = valPct - invPct;

        return {
          symbol: a.symbol,
          fullName: a.name,
          color: details.color || '#6366f1',
          balance: a.currentBalance,
          currentValue: val,
          totalInvested: inv,
          pnl,
          pnlPercentage: a.pnlPercentage,
          valuePercentage: valPct,
          investedPercentage: invPct,
          shiftPercentage: shiftPct,
          // Active metric depending on mode
          chartValue: mode === 'value' ? Math.max(0, val) : Math.max(0, inv),
          displayPercentage: mode === 'value' ? valPct : invPct,
        };
      })
      .filter(item => item.chartValue > 0)
      .sort((a, b) => b.chartValue - a.chartValue);
  }, [assets, isUSD, totalValue, totalInvested, mode]);

  // Concentration and diversification insights
  const insights = useMemo(() => {
    if (items.length === 0) return null;
    const top1 = items[0];
    const top3Share = items.slice(0, 3).reduce((sum, item) => sum + item.displayPercentage, 0);
    
    // Find greatest value grower relative to capital
    const sortedByGrowth = [...items].sort((a, b) => b.shiftPercentage - a.shiftPercentage);
    const topGrower = sortedByGrowth.length > 0 && sortedByGrowth[0].shiftPercentage > 1 ? sortedByGrowth[0] : null;

    return {
      top1,
      top3Share,
      topGrower,
      isConcentrated: top3Share > 80,
    };
  }, [items]);

  const formatCurrency = (val: number, decimals: number = 0) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const activeCoin = activeCoinSymbol 
    ? items.find(c => c.symbol === activeCoinSymbol) || null 
    : null;

  const activeTotal = mode === 'value' ? totalValue : totalInvested;

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl transition-all space-y-4 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* 1. Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <PieIcon className="w-4 h-4 text-indigo-500" />
            <span>Coin Allokation &amp; Gewichtung</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {items.length} Positionen
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {mode === 'value' 
              ? `Aufteilung nach aktuellem Marktwert in ${currency}` 
              : `Aufteilung nach tatsächlich eingesetztem Eigenkapital (Cost Basis)`}
          </p>
        </div>

        {/* Mode Switch: Marktwert vs. Investiert */}
        <div className={`inline-flex p-1 rounded-xl border text-xs font-semibold self-start sm:self-auto ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          <button
            type="button"
            onClick={() => setMode('value')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'value'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Nach Marktwert</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('invested')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'invested'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Nach Investition</span>
          </button>
        </div>
      </div>

      {/* 2. Key Concentration Insights Strip */}
      {insights && items.length > 0 && (
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Top 1 Dominanz ({insights.top1.symbol})
            </span>
            <span className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {insights.top1.displayPercentage.toFixed(1)} %
            </span>
          </div>

          <div>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Top 3 Konzentration
            </span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {insights.top3Share.toFixed(1)} %
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                insights.isConcentrated 
                  ? 'bg-amber-500/15 text-amber-400' 
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {insights.isConcentrated ? 'Fokussiert' : 'Ausgewogen'}
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Stärkster Werttreiber vs. Kapital
            </span>
            {insights.topGrower ? (
              <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-0.5">
                <span>{insights.topGrower.symbol}</span>
                <span className="text-xs font-normal text-emerald-300">
                  (+{insights.topGrower.shiftPercentage.toFixed(1)}% Anteil)
                </span>
              </span>
            ) : (
              <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Ausgeglichen
              </span>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Noch keine Bestände mit Wert vorhanden.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 pt-1">
          
          {/* 3. Left: Crisp Donut Chart with Centerpiece Display */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={items.length > 1 ? 2.5 : 0}
                  dataKey="chartValue"
                  onMouseEnter={(_, index) => setActiveCoinSymbol(items[index].symbol)}
                  onMouseLeave={() => setActiveCoinSymbol(null)}
                >
                  {items.map((entry) => {
                    const isSelected = activeCoinSymbol === entry.symbol;
                    return (
                      <Cell 
                        key={`cell-${entry.symbol}`} 
                        fill={entry.color} 
                        stroke={isLight ? '#ffffff' : '#0f172a'} 
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          filter: isSelected ? 'brightness(1.15) drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Non-obscuring Center Hole Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3 text-center select-none">
              {activeCoin ? (
                <div className="space-y-0.5 animate-fadeIn">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeCoin.color }} />
                    <span className={`font-mono font-bold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeCoin.symbol}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-indigo-500 font-mono">
                    {formatCurrency(activeCoin.chartValue)}
                  </div>
                  <div className={`text-[11px] font-semibold px-2 py-0.2 rounded-full inline-block ${
                    isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {activeCoin.displayPercentage.toFixed(1)} %
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {mode === 'value' ? 'Marktwert' : 'Investiert'}
                  </span>
                  <div className={`font-extrabold text-sm sm:text-base font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(activeTotal)}
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {items.length} Positionen
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Right: High-Density, Space-Efficient Allocation Breakdown */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item, index) => {
                const isSelected = activeCoinSymbol === item.symbol;
                const isPositiveShift = item.shiftPercentage > 0.5;
                const isNegativeShift = item.shiftPercentage < -0.5;

                return (
                  <div
                    key={item.symbol}
                    onMouseEnter={() => setActiveCoinSymbol(item.symbol)}
                    onMouseLeave={() => setActiveCoinSymbol(null)}
                    onClick={() => setActiveCoinSymbol(isSelected ? null : item.symbol)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? (isLight ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400 shadow-sm' : 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md')
                        : (isLight ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200' : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800/80')
                    }`}
                  >
                    {/* Top Row: Rank, Color, Name, % Share */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`text-[10px] font-mono px-1 rounded ${
                          isLight ? 'bg-slate-200/60 text-slate-600' : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className={`font-bold font-mono text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {item.symbol}
                        </span>
                        <span className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.fullName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-indigo-400 flex-shrink-0">
                        {item.displayPercentage.toFixed(1)} %
                      </span>
                    </div>

                    {/* Middle Row: Values (Marktwert vs. Investiert) */}
                    <div className="flex items-baseline justify-between pt-0.5 text-xs font-mono">
                      <div>
                        <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {formatCurrency(item.currentValue)}
                        </span>
                        <span className={`text-[10px] ml-1.5 font-sans ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          (Inv: {formatCurrency(item.totalInvested)})
                        </span>
                      </div>

                      {/* Value vs. Invested shift indicator */}
                      {isPositiveShift && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center" title="Marktanteil übersteigt Investitionsanteil (Gewinn-Treiber)">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>+{item.shiftPercentage.toFixed(1)}%</span>
                        </span>
                      )}
                      {isNegativeShift && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center" title="Marktanteil unter Investitionsanteil">
                          <ArrowDownRight className="w-3 h-3" />
                          <span>{item.shiftPercentage.toFixed(1)}%</span>
                        </span>
                      )}
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div 
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(2, item.displayPercentage))}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

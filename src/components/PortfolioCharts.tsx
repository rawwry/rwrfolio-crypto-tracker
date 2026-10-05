import React, { useState, useMemo } from 'react';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { getCoinDetails } from '../utils/priceService';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  DollarSign, 
  Wallet, 
  Scale, 
  TrendingUp, 
  PieChart as PieIcon,
  ShieldCheck,
  Percent
} from 'lucide-react';

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

  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

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
    
    // Find greatest value grower relative to capital (Alpha / Outperformer)
    const sortedByGrowth = [...items].sort((a, b) => b.shiftPercentage - a.shiftPercentage);
    const topGrower = sortedByGrowth.length > 0 && sortedByGrowth[0].shiftPercentage > 0.5 ? sortedByGrowth[0] : null;

    return {
      top1,
      top3Share,
      topGrower,
      isConcentrated: top3Share > 75,
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

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl transition-all space-y-4 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* 1. Header with Mode Toggle & Position Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Coin-Allokation &amp; Gewichtung</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {items.length} Positionen
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {mode === 'value' 
              ? `Verteilung nach aktuellem Marktwert (${currency}) & Alpha-Gewichtung` 
              : `Verteilung nach tatsächlich eingesetztem Eigenkapital (Cost Basis)`}
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

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Noch keine Bestände mit Wert vorhanden.
        </div>
      ) : (
        <>
          {/* 2. Interactive Horizon Allocation Bar (Ultra-kompakter gestapelter Horizon-Streifen) */}
          <div className="space-y-1.5">
            <div className={`w-full h-3.5 sm:h-4 rounded-xl overflow-hidden flex p-0.5 border shadow-inner ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              {items.map((item) => {
                const isSelected = activeCoinSymbol === item.symbol;
                const widthPct = Math.max(0.6, item.displayPercentage);

                return (
                  <div
                    key={item.symbol}
                    onClick={() => setActiveCoinSymbol(isSelected ? null : item.symbol)}
                    onMouseEnter={() => setActiveCoinSymbol(item.symbol)}
                    onMouseLeave={() => setActiveCoinSymbol(null)}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: item.color,
                    }}
                    className={`h-full transition-all duration-150 cursor-pointer first:rounded-l-lg last:rounded-r-lg ${
                      isSelected 
                        ? 'brightness-125 scale-y-110 shadow-lg ring-2 ring-white z-10' 
                        : 'hover:brightness-115 opacity-90 hover:opacity-100'
                    }`}
                    title={`${item.symbol}: ${item.displayPercentage.toFixed(1)}% (${formatCurrency(item.chartValue)})`}
                  />
                );
              })}
            </div>

            {/* Micro-HUD for Hovered / Focused Coin */}
            <div className="h-5 flex items-center justify-between text-xs font-mono">
              {activeCoin ? (
                <div className="flex items-center gap-2 animate-fadeIn truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeCoin.color }} />
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeCoin.symbol}</span>
                  <span className="text-slate-400 font-sans truncate">({activeCoin.fullName})</span>
                  <span className="text-indigo-400 font-bold">
                    {activeCoin.displayPercentage.toFixed(1)} %
                  </span>
                  <span className="text-slate-500 hidden sm:inline">&bull;</span>
                  <span className={`font-semibold hidden sm:inline ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Wert: {formatCurrency(activeCoin.currentValue)}
                  </span>
                  <span className={`text-[11px] hidden md:inline ${activeCoin.shiftPercentage >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    (Drift: {activeCoin.shiftPercentage >= 0 ? '+' : ''}{activeCoin.shiftPercentage.toFixed(1)}%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans truncate">
                  <span>💡 Tipp: Fahre über ein Segment oder klicke eine Karte zur Detailanalyse</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-sans ml-auto shrink-0">
                <span>Gesamt: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(mode === 'value' ? totalValue : totalInvested)}</strong></span>
              </div>
            </div>
          </div>

          {/* 3. Key Concentration & Drift Intelligence Strip */}
          {insights && (
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
            }`}>
              {/* Insight 1: Top 1 Dominanz */}
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Top 1 Dominanz ({insights.top1.symbol})
                </span>
                <span className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {insights.top1.displayPercentage.toFixed(1)} %
                </span>
              </div>

              {/* Insight 2: Top 3 Konzentration */}
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

              {/* Insight 3: Alpha / Stärkster Werttreiber vs. Kapital */}
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Top Alpha-Treiber vs. Kapital
                </span>
                {insights.topGrower ? (
                  <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <span>{insights.topGrower.symbol}</span>
                    <span className="text-[11px] font-normal text-emerald-300">
                      (+{insights.topGrower.shiftPercentage.toFixed(1)}% Drift)
                    </span>
                  </span>
                ) : (
                  <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ausgeglichen
                  </span>
                )}
              </div>

              {/* Insight 4: Gesamtrendite / P&L Gesamt */}
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Gesamt P&amp;L Rendite
                </span>
                <span className={`text-sm font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)} %
                  <span className="text-[10px] ml-1 font-normal opacity-80">
                    ({totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)})
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* 4. High-Density Asset Weighting Matrix / Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
            {items.map((item, index) => {
              const isSelected = activeCoinSymbol === item.symbol;
              const isPositiveShift = item.shiftPercentage > 0.5;
              const isNegativeShift = item.shiftPercentage < -0.5;
              const isProfit = item.pnl >= 0;

              return (
                <div
                  key={item.symbol}
                  onMouseEnter={() => setActiveCoinSymbol(item.symbol)}
                  onMouseLeave={() => setActiveCoinSymbol(null)}
                  onClick={() => setActiveCoinSymbol(isSelected ? null : item.symbol)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? (isLight ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400 shadow-sm' : 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md')
                      : (isLight ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200' : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800/80')
                  }`}
                >
                  {/* Top Row: Rank, Color, Symbol, Name, % Share */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className={`text-[10px] font-mono px-1 rounded shrink-0 ${
                        isLight ? 'bg-slate-200/60 text-slate-600' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{index + 1}
                      </span>
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className={`font-bold font-mono text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.symbol}
                      </span>
                      <span className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.fullName}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-xs text-indigo-400 shrink-0">
                      {item.displayPercentage.toFixed(1)} %
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className={`w-full rounded-full h-1 mb-2 overflow-hidden ${
                    isLight ? 'bg-slate-200/80' : 'bg-slate-800'
                  }`}>
                    <div 
                      className="h-1 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, Math.max(2, item.displayPercentage))}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  </div>

                  {/* Values Row: Marktwert & Investiert */}
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <div>
                      <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Marktwert
                      </span>
                      <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        {formatCurrency(item.currentValue)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Cost Basis
                      </span>
                      <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {formatCurrency(item.totalInvested)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: P&L & Weighting Drift */}
                  <div className={`pt-1.5 border-t flex items-center justify-between text-[11px] font-mono ${
                    isLight ? 'border-slate-200/80' : 'border-slate-800/60'
                  }`}>
                    {/* P&L */}
                    <div className={isProfit ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      <span>{isProfit ? '+' : ''}{item.pnlPercentage.toFixed(1)} %</span>
                      <span className="opacity-75 text-[10px] ml-1">({isProfit ? '+' : ''}{formatCurrency(item.pnl)})</span>
                    </div>

                    {/* Drift Badge */}
                    <div>
                      {isPositiveShift && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5" title="Marktanteil übersteigt Investitionsanteil (Gewinn-Treiber)">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>+{item.shiftPercentage.toFixed(1)}% Drift</span>
                        </span>
                      )}
                      {isNegativeShift && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Marktanteil unter Investitionsanteil">
                          <ArrowDownRight className="w-3 h-3" />
                          <span>{item.shiftPercentage.toFixed(1)}% Drift</span>
                        </span>
                      )}
                      {!isPositiveShift && !isNegativeShift && (
                        <span className="text-[10px] text-slate-500">Parität</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

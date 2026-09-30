import React, { useMemo } from 'react';
import { AssetSummary, PortfolioCurrency } from '../types';
import { getCoinDetails } from '../utils/priceService';
import { ArrowUpRight, ArrowDownRight, Trophy, TrendingDown, Sparkles } from 'lucide-react';

interface TopPerformerCardsProps {
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  onSelectAsset?: (symbol: string) => void;
}

export const TopPerformerCards: React.FC<TopPerformerCardsProps> = ({
  assets,
  currency = 'EUR',
  theme = 'dark',
  onSelectAsset,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const { topGainer, topLoser } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { topGainer: null, topLoser: null };
    }

    const sortedByPnl = [...assets].sort((a, b) => b.pnlPercentage - a.pnlPercentage);
    const gainer = sortedByPnl[0] || null;
    const loser = sortedByPnl.length > 1 ? sortedByPnl[sortedByPnl.length - 1] : null;

    return { topGainer: gainer, topLoser: loser };
  }, [assets]);

  if (!topGainer) return null;

  const gainerDetails = getCoinDetails(topGainer.symbol);
  const gainerPnl = isUSD ? (topGainer.pnlUSD ?? topGainer.pnl) : (topGainer.pnlEUR ?? topGainer.pnl);
  const gainerVal = isUSD ? (topGainer.currentValueUSD ?? topGainer.currentValue) : (topGainer.currentValueEUR ?? topGainer.currentValue);
  const gainerIsProfit = gainerPnl >= 0;

  const loserDetails = topLoser ? getCoinDetails(topLoser.symbol) : null;
  const loserPnl = topLoser ? (isUSD ? (topLoser.pnlUSD ?? topLoser.pnl) : (topLoser.pnlEUR ?? topLoser.pnl)) : 0;
  const loserVal = topLoser ? (isUSD ? (topLoser.currentValueUSD ?? topLoser.currentValue) : (topLoser.currentValueEUR ?? topLoser.currentValue)) : 0;
  const loserIsProfit = loserPnl >= 0;

  return (
    <>
      {/* 1. Top Gainer Card */}
      <div 
        onClick={() => onSelectAsset && onSelectAsset(topGainer.symbol)}
        className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all flex flex-col justify-between space-y-3 cursor-pointer group ${
          isLight 
            ? 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md' 
            : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Top Performer
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {topGainer.symbol}
              </span>
              <span className={`text-xs truncate max-w-[120px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {topGainer.name}
              </span>
            </div>
          </div>

          <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
            gainerIsProfit 
              ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25') 
              : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
          }`}>
            {gainerIsProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
            <span>{gainerIsProfit ? '+' : ''}{topGainer.pnlPercentage.toFixed(2)} %</span>
          </div>
        </div>

        {/* Value and Gain in active currency */}
        <div className="space-y-1 py-1 font-mono">
          <div className="flex items-baseline justify-between">
            <span className={`text-xs font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn</span>
            <span className={`text-lg font-bold ${gainerIsProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
              {gainerIsProfit ? '+' : ''}{formatCurr(gainerPnl)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Wert</span>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {formatCurr(gainerVal)}
            </span>
          </div>
        </div>

        {/* Footer info: Allocation */}
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200/80 text-slate-700' : 'bg-slate-950/40 border-slate-800/60 text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Portfolio-Anteil:</span>
          </div>
          <span className="font-mono font-bold">{topGainer.allocationPercentage.toFixed(1)} %</span>
        </div>
      </div>

      {/* 2. Top Loser / Dip Card */}
      {topLoser ? (
        <div 
          onClick={() => onSelectAsset && onSelectAsset(topLoser.symbol)}
          className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all flex flex-col justify-between space-y-3 cursor-pointer group ${
            isLight 
              ? 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-md' 
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {loserIsProfit ? 'Niedrigste Rendite' : 'Größter Dip'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {topLoser.symbol}
                </span>
                <span className={`text-xs truncate max-w-[120px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {topLoser.name}
                </span>
              </div>
            </div>

            <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              loserIsProfit 
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25') 
                : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
            }`}>
              {loserIsProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
              <span>{loserIsProfit ? '+' : ''}{topLoser.pnlPercentage.toFixed(2)} %</span>
            </div>
          </div>

          {/* Value and Loss/Gain in active currency */}
          <div className="space-y-1 py-1 font-mono">
            <div className="flex items-baseline justify-between">
              <span className={`text-xs font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {loserIsProfit ? 'Gewinn' : 'Verlust'}
              </span>
              <span className={`text-lg font-bold ${loserIsProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                {loserIsProfit ? '+' : ''}{formatCurr(loserPnl)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className={`font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Wert</span>
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {formatCurr(loserVal)}
              </span>
            </div>
          </div>

          {/* Footer info: DCA Chance or Allocation */}
          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200/80 text-slate-700' : 'bg-slate-950/40 border-slate-800/60 text-slate-300'
          }`}>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">{!loserIsProfit ? 'Günstiger Nachkaufkurs' : 'Portfolio-Anteil:'}</span>
            </div>
            <span className="font-mono font-bold">{topLoser.allocationPercentage.toFixed(1)} %</span>
          </div>
        </div>
      ) : null}
    </>
  );
};

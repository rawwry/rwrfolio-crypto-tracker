import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CircleDollarSign
} from 'lucide-react';
import { PortfolioTotals, AssetSummary, PortfolioCurrency, Portfolio24hDelta, Asset24hChange } from '../types';

interface PortfolioStatsProps {
  totals: PortfolioTotals;
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  delta24h?: Portfolio24hDelta | null;
  isLoading24h?: boolean;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({ 
  totals, 
  assets, 
  currency = 'EUR', 
  theme = 'dark',
  delta24h,
  isLoading24h = false,
}) => {
  const isLight = theme === 'light';
  const activeCurrency = totals.currency || currency;
  const isUSD = activeCurrency === 'USD';
  
  const totalPnl = totals.totalPnl !== undefined ? totals.totalPnl : totals.totalPnlEUR;
  const isPositive = totalPnl >= 0;

  const formatActive = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatAlt = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: isUSD ? 'EUR' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const deltaTooltip = useMemo(() => {
    if (!delta24h || !delta24h.assetChanges) return undefined;
    const items = (Object.values(delta24h.assetChanges) as Asset24hChange[])
      .sort((a, b) => b.valueChangeFiat - a.valueChangeFiat);
    if (items.length === 0) return undefined;
    const prefix = `24h Portfolio Delta: ${delta24h.isPositive ? '+' : ''}${formatActive(delta24h.changeFiat)} (${delta24h.isPositive ? '+' : ''}${delta24h.changePercentage.toFixed(2)} %)\n\nAssets:`;
    const lines = items.map(
      item => `• ${item.symbol}: ${item.valueChangeFiat >= 0 ? '+' : ''}${formatActive(item.valueChangeFiat)} (${item.priceChangePct >= 0 ? '+' : ''}${item.priceChangePct.toFixed(2)} %)`
    );
    return [prefix, ...lines].join('\n');
  }, [delta24h, isUSD]);

  const activeValue = totals.currentValue !== undefined ? totals.currentValue : totals.currentValueEUR;
  const altValue = isUSD ? totals.currentValueEUR : (totals.currentValueEUR * (totals.eurUsdRate || 1.1591));

  const activeInvested = totals.totalInvested !== undefined ? totals.totalInvested : totals.totalInvestedEUR;
  const altInvested = isUSD ? totals.totalInvestedEUR : (totals.totalInvestedEUR * (totals.eurUsdRate || 1.1591));

  const altPnl = isUSD ? totals.totalPnlEUR : (totals.totalPnlEUR * (totals.eurUsdRate || 1.1591));

  const cardBaseClass = isLight
    ? 'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all'
    : 'bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all';

  const titleClass = `text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`;
  const bigNumClass = `text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`;
  const subTextClass = `mt-2.5 flex flex-wrap items-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} gap-1.5`;
  const subValClass = isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Portfolio Value Card */}
      <div className={cardBaseClass}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Portfolio Gesamtwert
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className={bigNumClass}>
          {formatActive(activeValue)}
        </div>

        {/* 24h Performance Delta Pill */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {delta24h ? (
            <div 
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono transition-all ${
                delta24h.isPositive
                  ? (isLight 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25')
                  : (isLight 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs' 
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
              }`}
              title={deltaTooltip}
            >
              {delta24h.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{delta24h.isPositive ? '+' : ''}{formatActive(delta24h.changeFiat)}</span>
              <span className="font-normal opacity-90">({delta24h.isPositive ? '+' : ''}{delta24h.changePercentage.toFixed(2)} %)</span>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${
              isLight ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
            }`}>
              {isLoading24h ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>24h berechnen...</span>
                </>
              ) : (
                <span>+0,00 {isUSD ? '$' : '€'} (0.00 %)</span>
              )}
            </div>
          )}
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            24h Delta
          </span>
        </div>

        <div className={subTextClass}>
          <span className={subValClass}>≈ {formatAlt(altValue)}</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>&bull;</span>
          <span>Live-Kurse</span>
          {delta24h?.topContributor && delta24h.topContributor.valueChangeFiat > 0 && (
            <>
              <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>&bull;</span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]" title={`Top 24h-Gewinner: ${delta24h.topContributor.symbol} (${delta24h.topContributor.priceChangePct >= 0 ? '+' : ''}${delta24h.topContributor.priceChangePct.toFixed(2)} %)`}>
                Top: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{delta24h.topContributor.symbol}</strong> ({delta24h.topContributor.priceChangePct >= 0 ? '+' : ''}{delta24h.topContributor.priceChangePct.toFixed(1)} %)
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Total Profit & Loss Card */}
      <div className={cardBaseClass}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${isPositive ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'} rounded-full blur-2xl transition-all`} />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Gesamtertrag (P&amp;L)
          </span>
          <div className={`w-8 h-8 rounded-lg ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} border flex items-center justify-center`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isPositive ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
            {isPositive ? '+' : ''}{formatActive(totalPnl)}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive 
              ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20') 
              : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20')
          }`}>
            {isPositive ? '+' : ''}{totals.totalPnlPercentage.toFixed(2)} %
          </span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Gesamt
          </span>
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            ≈ {isPositive ? '+' : ''}{formatAlt(altPnl)}
          </span>
        </div>
      </div>

      {/* 3. Invested Capital Card */}
      <div className={cardBaseClass}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Investiertes Kapital
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className={bigNumClass}>
          {formatActive(activeInvested)}
        </div>
        <div className={subTextClass}>
          <span className={subValClass}>≈ {formatAlt(altInvested)}</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>&bull;</span>
          <span>{totals.transactionCount} Tx in {totals.assetCount} Coins</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CircleDollarSign
} from 'lucide-react';
import { PortfolioTotals, AssetSummary, PortfolioCurrency } from '../types';

interface PortfolioStatsProps {
  totals: PortfolioTotals;
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({ totals, assets, currency = 'EUR', theme = 'dark' }) => {
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
  const subTextClass = `mt-2 flex flex-wrap items-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} gap-1.5`;
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
        <div className={subTextClass}>
          <span className={subValClass}>≈ {formatAlt(altValue)}</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>&bull;</span>
          <span>Live-Kurse</span>
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive 
              ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20') 
              : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20')
          }`}>
            {isPositive ? '+' : ''}{totals.totalPnlPercentage.toFixed(2)} %
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

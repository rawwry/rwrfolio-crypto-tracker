import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  CircleDollarSign,
  PieChart as PieIcon
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
  const subTextClass = `mt-2 flex items-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} space-x-1.5`;
  const subValClass = isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Portfolio Value Card */}
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
          <span className={isLight ? 'text-slate-300' : 'text-slate-500'}>•</span>
          <span>Live-Kurse</span>
        </div>
      </div>

      {/* Total Invested */}
      <div className={cardBaseClass}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Gesamt Eingezahlt / Investiert
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className={bigNumClass}>
          {formatActive(activeInvested)}
        </div>
        <div className={subTextClass}>
          <span className={subValClass}>≈ {formatAlt(altInvested)}</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-500'}>•</span>
          <span>{totals.transactionCount} Transaktionen</span>
        </div>
      </div>

      {/* Profit & Loss */}
      <div className={cardBaseClass}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${isPositive ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'} rounded-full blur-2xl transition-all`} />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Nicht realisierter Gewinn (P&L)
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
        <div className="mt-2 flex items-center space-x-2">
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

      {/* Asset Diversity / Top Asset */}
      <div className={cardBaseClass}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className={titleClass}>
            Assets &amp; Diversifikation
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className={bigNumClass}>
          {totals.assetCount} <span className={`text-sm font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Coins</span>
        </div>
        <div className={`mt-2 flex items-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} space-x-1`}>
          {totals.topAssetSymbol !== '-' ? (
            <span>
              Top: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{totals.topAssetSymbol}</strong> ({totals.topAssetPercentage.toFixed(1)} % des Portfolios)
            </span>
          ) : (
            <span>Noch keine Bestände</span>
          )}
        </div>
      </div>
    </div>
  );
};

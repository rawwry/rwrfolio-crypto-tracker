import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  LineChart as LineChartIcon,
  Percent,
  SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AssetSummary, PortfolioCurrency } from '../types';
import { getCoinDetails } from '../utils/priceService';

interface CoinPerformanceMatrixProps {
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  onSelectCoinForChart: (symbol: string) => void;
  activeChartCoin?: string;
}

export const CoinPerformanceMatrix: React.FC<CoinPerformanceMatrixProps> = ({
  assets,
  currency = 'EUR',
  theme = 'dark',
  onSelectCoinForChart,
  activeChartCoin,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const [sortField, setSortField] = useState<'pnlPct' | 'value' | 'invested' | 'name'>('value');
  const [sortAsc, setSortAsc] = useState(false);

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatPrice = (val: number) => {
    const dec = val < 0.01 ? 6 : (val < 1 ? 4 : (val < 100 ? 3 : 2));
    return formatCurr(val, dec);
  };

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'name') {
        const res = a.symbol.localeCompare(b.symbol);
        return sortAsc ? res : -res;
      } else if (sortField === 'pnlPct') {
        valA = a.pnlPercentage;
        valB = b.pnlPercentage;
      } else if (sortField === 'invested') {
        valA = isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested);
        valB = isUSD ? (b.totalInvestedUSD ?? b.totalInvested) : (b.totalInvestedEUR ?? b.totalInvested);
      } else {
        valA = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
        valB = isUSD ? (b.currentValueUSD ?? b.currentValue) : (b.currentValueEUR ?? b.currentValue);
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [assets, sortField, sortAsc, isUSD]);

  const toggleSort = (field: 'pnlPct' | 'value' | 'invested' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const profitableCount = assets.filter(a => (isUSD ? (a.pnlUSD ?? a.pnl) : (a.pnlEUR ?? a.pnl)) >= 0).length;
  const losingCount = assets.length - profitableCount;

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl transition-all space-y-4 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
    }`}>
      
      {/* 1. Header with Stats & Sort Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Coin-Performance Matrix
              </h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {assets.length} Assets
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rendite-Vergleich nach DCA, Live-Kurs &amp; P&amp;L &bull; <span className="text-indigo-400 font-medium">Zeile oder Kachel anklicken</span>, um den interaktiven Chart oben zu laden
            </p>
          </div>
        </div>

        {/* Quick Summary Pill & Sort Filter */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              {profitableCount} im Plus
            </span>
            {losingCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                {losingCount} im Minus
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Responsive Performance Table (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
              <th 
                onClick={() => toggleSort('name')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                Coin / Asset {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="py-3 px-3 font-semibold text-center">Allokation</th>
              <th 
                onClick={() => toggleSort('invested')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition-colors"
              >
                Investiert {sortField === 'invested' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th 
                onClick={() => toggleSort('value')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition-colors"
              >
                Aktueller Wert {sortField === 'value' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="py-3 px-3 font-semibold text-right">Ø Kaufkurs / Live</th>
              <th 
                onClick={() => toggleSort('pnlPct')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition-colors"
              >
                Gewinn / Rendite {sortField === 'pnlPct' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono">
            {sortedAssets.map(asset => {
              const details = getCoinDetails(asset.symbol);
              const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
              const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
              const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
              const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
              const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);
              const isProfit = activePnl >= 0;
              const isSelected = activeChartCoin === asset.symbol;

              return (
                <tr 
                  key={asset.symbol}
                  onClick={() => onSelectCoinForChart(asset.symbol)}
                  title={`${asset.symbol} anklicken, um interaktiven Chart oben zu laden`}
                  className={`transition-colors cursor-pointer select-none ${
                    isSelected 
                      ? (isLight ? 'bg-indigo-50/90 ring-1 ring-inset ring-indigo-400' : 'bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/50') 
                      : (isLight ? 'hover:bg-slate-100/70' : 'hover:bg-slate-800/50')
                  }`}
                >
                  {/* Asset Identity */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {asset.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-sm font-sans text-white flex items-center gap-1.5">
                          <span>{asset.symbol}</span>
                          <span className="text-[11px] font-normal text-slate-400 font-sans">
                            {details.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-sans font-medium">
                              Chart aktiv
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {asset.currentBalance.toLocaleString('de-DE', { maximumFractionDigits: 4 })} {asset.symbol}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Allocation Bar */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-bold text-xs text-slate-200">
                        {asset.allocationPercentage.toFixed(1)} %
                      </span>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-500" 
                          style={{ width: `${Math.min(100, Math.max(4, asset.allocationPercentage))}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Invested */}
                  <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                    {formatCurr(activeInvested)}
                  </td>

                  {/* Current Value */}
                  <td className="py-3 px-3 text-right font-bold text-white">
                    {formatCurr(activeValue)}
                  </td>

                  {/* Prices: DCA vs Live */}
                  <td className="py-3 px-3 text-right">
                    <div className="text-slate-200 font-semibold">
                      {formatPrice(activePrice)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Ø {formatPrice(activeAvgBuy)}
                    </div>
                  </td>

                  {/* Return / P&L */}
                  <td className="py-3 px-3 text-right">
                    <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{formatCurr(activePnl)}
                    </div>
                    <div className={`text-[10px] inline-flex items-center gap-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Mobile Card View - fully clickable, no bulky buttons */}
      <div className="md:hidden space-y-3">
        {sortedAssets.map(asset => {
          const details = getCoinDetails(asset.symbol);
          const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
          const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
          const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
          const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
          const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);
          const isProfit = activePnl >= 0;
          const isSelected = activeChartCoin === asset.symbol;

          return (
            <div 
              key={asset.symbol}
              onClick={() => onSelectCoinForChart(asset.symbol)}
              className={`p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.99] select-none ${
                isSelected
                  ? (isLight ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400 shadow-md' : 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md')
                  : (isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800')
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    {asset.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{asset.symbol}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-sans">
                          Chart aktiv
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{details.name}</span>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                  isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Wert</span>
                  <span className="font-bold text-white">{formatCurr(activeValue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Gewinn/Verlust</span>
                  <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}{formatCurr(activePnl)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Live-Kurs</span>
                  <span className="text-slate-200">{formatPrice(activePrice)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Ø Kaufkurs</span>
                  <span className="text-slate-300">{formatPrice(activeAvgBuy)}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Allokation: {asset.allocationPercentage.toFixed(1)} %</span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {asset.currentBalance.toLocaleString('de-DE', { maximumFractionDigits: 4 })} {asset.symbol}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

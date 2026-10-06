import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  LineChart as LineChartIcon,
  Percent,
  SlidersHorizontal,
  Clock,
  Loader2
} from 'lucide-react';
import { AssetSummary, PortfolioCurrency } from '../types';
import { getCoinDetails, getLiveEurUsdRate } from '../utils/priceService';
import { ChartTimeframe } from '../utils/coinChartData';
import { fetchAssetPeriodChange, AssetPeriodChange } from '../utils/historicalPriceService';

interface CoinPerformanceMatrixProps {
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  onSelectCoinForChart: (symbol: string) => void;
  activeChartCoin?: string;
}

const TIMEFRAMES: { label: string; value: ChartTimeframe; tooltip: string }[] = [
  { label: '24h', value: '24h', tooltip: 'Letzte 24 Stunden (Tag)' },
  { label: '7T', value: '7d', tooltip: 'Letzte 7 Tage (Woche)' },
  { label: '30T', value: '30d', tooltip: 'Letzte 30 Tage (1 Monat)' },
  { label: '90T', value: '90d', tooltip: 'Letzte 90 Tage (3 Monate)' },
  { label: '1J', value: '1y', tooltip: 'Letztes Jahr (12 Monate)' },
  { label: 'Gesamt', value: 'all', tooltip: 'Gesamte Historie (DCA All-Time)' },
];

export const CoinPerformanceMatrix: React.FC<CoinPerformanceMatrixProps> = ({
  assets,
  currency = 'EUR',
  theme = 'dark',
  onSelectCoinForChart,
  activeChartCoin,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const [matrixTimeframe, setMatrixTimeframe] = useState<ChartTimeframe>('all');
  const [periodChanges, setPeriodChanges] = useState<Record<string, AssetPeriodChange>>({});
  const [loadingPeriod, setLoadingPeriod] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'pnlPct' | 'value' | 'invested' | 'name'>('value');
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch period changes when a specific timeframe is selected
  useEffect(() => {
    if (matrixTimeframe === 'all') return;
    let isMounted = true;
    setLoadingPeriod(true);

    const fetchAllChanges = async () => {
      const rate = getLiveEurUsdRate();
      const results: Record<string, AssetPeriodChange> = {};

      await Promise.allSettled(
        assets.map(async (asset) => {
          const activePrice = isUSD 
            ? (asset.currentPriceUSD || asset.currentPrice) 
            : (asset.currentPriceEUR || asset.currentPrice);
          const res = await fetchAssetPeriodChange(
            asset.symbol,
            matrixTimeframe,
            activePrice,
            asset.currentBalance,
            rate
          );
          if (res) {
            results[asset.symbol] = res;
          }
        })
      );

      if (isMounted) {
        setPeriodChanges(results);
        setLoadingPeriod(false);
      }
    };

    fetchAllChanges();

    return () => {
      isMounted = false;
    };
  }, [matrixTimeframe, assets, isUSD]);

  const activeTfObj = TIMEFRAMES.find(t => t.value === matrixTimeframe) || TIMEFRAMES[5];
  const activeTfLabel = activeTfObj.label;

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatPrice = (val: number) => {
    const dec = Math.abs(val) < 0.01 ? 6 : (Math.abs(val) < 1 ? 4 : (Math.abs(val) < 100 ? 3 : 2));
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
        if (matrixTimeframe === 'all') {
          valA = a.pnlPercentage;
          valB = b.pnlPercentage;
        } else {
          valA = periodChanges[a.symbol]?.priceChangePct ?? 0;
          valB = periodChanges[b.symbol]?.priceChangePct ?? 0;
        }
      } else if (sortField === 'invested') {
        valA = isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested);
        valB = isUSD ? (b.totalInvestedUSD ?? b.totalInvested) : (b.totalInvestedEUR ?? b.totalInvested);
      } else {
        valA = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
        valB = isUSD ? (b.currentValueUSD ?? b.currentValue) : (b.currentValueEUR ?? b.currentValue);
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [assets, sortField, sortAsc, isUSD, matrixTimeframe, periodChanges]);

  const toggleSort = (field: 'pnlPct' | 'value' | 'invested' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl transition-all space-y-4 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
    }`}>
      
      {/* 1. Header with Stats & Multi-Timeframe Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Coin-Performance Matrix
              </h3>
            </div>
            <p className={`text-xs mt-0.5 flex flex-wrap items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>
                {matrixTimeframe === 'all' 
                  ? 'Rendite-Vergleich nach DCA, Live-Kurs & P&L' 
                  : `Performance: ${activeTfObj.tooltip}`}
              </span>
              <span>&bull;</span>
              {loadingPeriod ? (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Aktualisiere {activeTfLabel}...</span>
                </span>
              ) : (
                <span className={`font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Zeile anklicken für Chart</span>
              )}
            </p>
          </div>
        </div>

        {/* Timeframe Switcher & Summary Pills (Fixed-layout, zero layout shift) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* Multi-Timeframe Switcher Pills */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            {TIMEFRAMES.map(tf => {
              const isActive = matrixTimeframe === tf.value;
              return (
                <button
                  key={tf.value}
                  onClick={() => setMatrixTimeframe(tf.value)}
                  title={tf.tooltip}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all text-center min-w-[36px] ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60')
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Responsive Performance Table (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`text-[11px] font-sans uppercase tracking-wider ${isLight ? 'text-slate-700 bg-slate-100/90 border-b border-slate-200' : 'text-slate-400 bg-slate-900/60'}`}>
              <th 
                onClick={() => toggleSort('name')}
                className={`py-2.5 px-3 font-semibold cursor-pointer transition-colors ${isLight ? 'hover:text-slate-900' : 'hover:text-white'}`}
              >
                Coin / Asset {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="py-2.5 px-3 font-semibold text-center">Allokation</th>
              <th 
                onClick={() => toggleSort('invested')}
                className={`py-2.5 px-3 font-semibold text-right cursor-pointer transition-colors ${isLight ? 'hover:text-slate-900' : 'hover:text-white'}`}
              >
                Investiert {sortField === 'invested' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th 
                onClick={() => toggleSort('value')}
                className={`py-2.5 px-3 font-semibold text-right cursor-pointer transition-colors ${isLight ? 'hover:text-slate-900' : 'hover:text-white'}`}
              >
                Aktueller Wert {sortField === 'value' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">
                {matrixTimeframe === 'all' ? 'Ø Kaufkurs / Live' : 'Live-Kurs'}
              </th>
              <th 
                onClick={() => toggleSort('pnlPct')}
                className={`py-2.5 px-3 font-semibold text-right cursor-pointer transition-colors ${isLight ? 'hover:text-slate-900' : 'hover:text-white'}`}
              >
                {matrixTimeframe === 'all' 
                  ? 'Gesamt P&L / Rendite' 
                  : `${activeTfLabel} Rendite & Wert`} {sortField === 'pnlPct' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {sortedAssets.map(asset => {
              const details = getCoinDetails(asset.symbol);
              const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
              const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
              const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
              const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
              const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);
              const isProfit = activePnl >= 0;
              const isSelected = activeChartCoin === asset.symbol;

              // Period data for timeframes other than 'all'
              const periodChange = periodChanges[asset.symbol];
              const isPeriodProfit = periodChange ? periodChange.priceChangePct >= 0 : isProfit;

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
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2.5">
                      <div 
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: details.color || '#6366f1' }}
                      />
                      <div>
                        <div className={`font-bold text-sm font-sans flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <span>{asset.symbol}</span>
                          <span className={`text-[11px] font-normal font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {details.name}
                          </span>
                          {isSelected && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                              isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              Chart aktiv
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {asset.currentBalance.toLocaleString('de-DE', { maximumFractionDigits: 4 })} {asset.symbol}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Allocation Badge (Pill statt horizontaler grauer Leiste) */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold font-mono border ${
                      isLight 
                        ? 'bg-slate-100 border-slate-200/80 text-slate-800' 
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}>
                      <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: details.color || '#6366f1' }} />
                      <span>{asset.allocationPercentage.toFixed(1)} %</span>
                    </span>
                  </td>

                  {/* Invested */}
                  <td className={`py-3 px-3 text-right font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {formatCurr(activeInvested)}
                  </td>

                  {/* Current Value */}
                  <td className={`py-3 px-3 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurr(activeValue)}
                  </td>

                  {/* Prices: DCA vs Live */}
                  <td className="py-3 px-3 text-right">
                    <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {formatPrice(activePrice)}
                    </div>
                    {matrixTimeframe === 'all' && (
                      <div className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Ø {formatPrice(activeAvgBuy)}
                      </div>
                    )}
                  </td>

                  {/* Return / P&L (Relative and Absolute) */}
                  <td className="py-3 px-3 text-right">
                    {matrixTimeframe === 'all' ? (
                      <>
                        <div className={`font-bold ${isProfit ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                          {isProfit ? '+' : ''}{formatCurr(activePnl)}
                        </div>
                        <div className={`text-[10px] inline-flex items-center gap-0.5 ${isProfit ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                          {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {loadingPeriod && !periodChange ? (
                          <div className={`text-[11px] animate-pulse font-sans ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>wird geladen...</div>
                        ) : (
                          <>
                            <div className={`font-bold ${isPeriodProfit ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                              {isPeriodProfit ? '+' : ''}{formatCurr(periodChange?.valueChangeFiat ?? 0)}
                            </div>
                            <div className={`text-[10px] inline-flex items-center gap-0.5 ${isPeriodProfit ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                              {isPeriodProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{isPeriodProfit ? '+' : ''}{(periodChange?.priceChangePct ?? 0).toFixed(2)} %</span>
                            </div>
                            {periodChange && (
                              <div className={`text-[9px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                                Kurs: {periodChange.priceChangeFiat >= 0 ? '+' : ''}{formatPrice(periodChange.priceChangeFiat)}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
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

          // Period data for timeframes other than 'all'
          const periodChange = periodChanges[asset.symbol];
          const isPeriodProfit = periodChange ? periodChange.priceChangePct >= 0 : isProfit;
          const cardPct = matrixTimeframe === 'all' ? asset.pnlPercentage : (periodChange?.priceChangePct ?? 0);
          const cardVal = matrixTimeframe === 'all' ? activePnl : (periodChange?.valueChangeFiat ?? 0);
          const isCardProfit = matrixTimeframe === 'all' ? isProfit : isPeriodProfit;

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
                <div className="flex items-center space-x-2.5">
                  <div 
                    className="w-1.5 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: details.color || '#6366f1' }}
                  />
                  <div>
                    <div className={`font-bold text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <span>{asset.symbol}</span>
                      {isSelected && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                          isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          Chart aktiv
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{details.name}</span>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                  isCardProfit 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400') 
                    : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400')
                }`}>
                  {isCardProfit ? '+' : ''}{cardPct.toFixed(2)} % {matrixTimeframe !== 'all' && `(${activeTfLabel})`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Wert</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(activeValue)}</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {matrixTimeframe === 'all' ? 'Gewinn/Verlust' : `${activeTfLabel} Veränderung`}
                  </span>
                  <span className={`font-bold ${isCardProfit ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                    {isCardProfit ? '+' : ''}{formatCurr(cardVal)}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Live-Kurs</span>
                  <span className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>{formatPrice(activePrice)}</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {matrixTimeframe === 'all' ? 'Ø Kaufkurs' : 'Investiert'}
                  </span>
                  <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>
                    {matrixTimeframe === 'all' ? formatPrice(activeAvgBuy) : formatCurr(activeInvested)}
                  </span>
                </div>
              </div>

              <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800/60 text-slate-400'
              }`}>
                <span>Allokation: {asset.allocationPercentage.toFixed(1)} %</span>
                <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
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

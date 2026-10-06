import React, { useState, useMemo, useEffect } from 'react';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { InteractiveCoinChart } from './InteractiveCoinChart';
import { CoinPerformanceMatrix } from './CoinPerformanceMatrix';
import { calculateAssetSummaries } from '../utils/portfolioCalculations';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Coins, 
  Layers, 
  Building2 
} from 'lucide-react';

interface AnalyticsViewProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  theme: 'light' | 'dark' | 'system';
  currency?: PortfolioCurrency;
  customPrices?: Record<string, number>;
  selectedCoin?: string;
  onSelectCoin?: (coin: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assets,
  transactions,
  theme,
  currency = 'EUR',
  customPrices = {},
  selectedCoin,
  onSelectCoin,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  // Default to BTC or the top holding asset by allocation instead of flat Gesamt-Portfolio
  const defaultChartCoin = useMemo(() => {
    if (assets.some(a => a.symbol.toUpperCase() === 'BTC')) return 'BTC';
    if (assets.length > 0) {
      const topAsset = [...assets].sort((a, b) => b.allocationPercentage - a.allocationPercentage)[0];
      return topAsset ? topAsset.symbol : assets[0].symbol;
    }
    return 'ALL';
  }, [assets]);

  const [selectedChartCoin, setSelectedChartCoin] = useState<string>(() => selectedCoin || defaultChartCoin);

  // Sync when assets finish loading or when selectedCoin prop changes
  useEffect(() => {
    if (selectedCoin) {
      setSelectedChartCoin(selectedCoin);
    } else if (selectedChartCoin === 'ALL' && assets.length > 0 && defaultChartCoin !== 'ALL') {
      setSelectedChartCoin(defaultChartCoin);
    }
  }, [selectedCoin, defaultChartCoin]);

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  // Split calculations by exchange source: Kraken Pro vs Crypto.com
  const krakenTxs = useMemo(() => transactions.filter(t => t.source === 'kraken'), [transactions]);
  const cryptoComTxs = useMemo(() => transactions.filter(t => t.source === 'crypto_com'), [transactions]);

  const krakenSummary = useMemo(() => calculateAssetSummaries(krakenTxs, customPrices, currency as PortfolioCurrency), [krakenTxs, customPrices, currency]);
  const cryptoComSummary = useMemo(() => calculateAssetSummaries(cryptoComTxs, customPrices, currency as PortfolioCurrency), [cryptoComTxs, customPrices, currency]);

  const krakenInvested = krakenSummary.totals.totalInvested || 0;
  const krakenValue = krakenSummary.totals.currentValue || 0;
  const krakenPnl = krakenSummary.totals.totalPnl || 0;
  const krakenPnlPct = krakenSummary.totals.totalPnlPercentage || 0;
  const krakenIsProfit = krakenPnl >= 0;

  const cryptoInvested = cryptoComSummary.totals.totalInvested || 0;
  const cryptoValue = cryptoComSummary.totals.currentValue || 0;
  const cryptoPnl = cryptoComSummary.totals.totalPnl || 0;
  const cryptoPnlPct = cryptoComSummary.totals.totalPnlPercentage || 0;
  const cryptoIsProfit = cryptoPnl >= 0;

  const totalAllInvested = krakenInvested + cryptoInvested;
  const krakenShare = totalAllInvested > 0 ? (krakenInvested / totalAllInvested) * 100 : 0;
  const cryptoShare = totalAllInvested > 0 ? (cryptoInvested / totalAllInvested) * 100 : 0;

  const handleSelectCoinForChart = (sym: string) => {
    setSelectedChartCoin(sym);
    onSelectCoin?.(sym);
    // Smooth scroll to top of chart
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Core Feature: Interactive Coin & Trade Chart with Timeframe Switchers */}
      <InteractiveCoinChart
        assets={assets}
        transactions={transactions}
        customPrices={customPrices}
        currency={currency}
        theme={theme}
        selectedCoinInitial={selectedChartCoin}
        onSelectCoin={(sym) => {
          setSelectedChartCoin(sym);
          onSelectCoin?.(sym);
        }}
      />

      {/* 2. Structured Side-by-Side Coin Performance Matrix */}
      <CoinPerformanceMatrix
        assets={assets}
        currency={currency}
        theme={theme}
        activeChartCoin={selectedChartCoin}
        onSelectCoinForChart={handleSelectCoinForChart}
      />

      {/* 3. High-Contrast Börsen- & Plattform-Vergleich (Kraken Pro vs. Crypto.com) */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl transition-colors space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Börsen- &amp; Plattform-Vergleich
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Gegenüberstellung von Portfoliowert, Rendite und Trade-Aktivität nach Börsen-Quelle.
              </p>
            </div>
          </div>
        </div>

        {/* Capital Split Progress Bar with high-contrast labels */}
        {krakenTxs.length > 0 && cryptoComTxs.length > 0 && (
          <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/60 border-slate-800/60'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono font-semibold">
              <span className="text-purple-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-sm" />
                <span>Kraken Pro: {krakenShare.toFixed(1)} % ({formatCurr(krakenInvested)})</span>
              </span>
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                <span>Crypto.com: {cryptoShare.toFixed(1)} % ({formatCurr(cryptoInvested)})</span>
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800/80 p-0.5">
              <div 
                style={{ width: `${krakenShare}%` }} 
                className="bg-purple-600 h-full rounded-l-full transition-all duration-500" 
                title={`Kraken Pro: ${krakenShare.toFixed(1)} %`} 
              />
              <div 
                style={{ width: `${cryptoShare}%` }} 
                className="bg-cyan-400 h-full rounded-r-full transition-all duration-500" 
                title={`Crypto.com: ${cryptoShare.toFixed(1)} %`} 
              />
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kraken Pro Card (Royal Purple) */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-purple-50/40 border-purple-200/60' : 'bg-purple-950/20 border-purple-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/20">
                  KP
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Kraken Pro</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                    {krakenTxs.length} Transaktion{krakenTxs.length !== 1 ? 'en' : ''} &bull; {krakenSummary.assets.length} Coins
                  </span>
                </div>
              </div>

              {krakenTxs.length > 0 && (
                <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  krakenIsProfit 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25') 
                    : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
                }`}>
                  {krakenIsProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{krakenIsProfit ? '+' : ''}{krakenPnlPct.toFixed(2)} %</span>
                </div>
              )}
            </div>

            {krakenTxs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(krakenValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(krakenInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${krakenIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {krakenIsProfit ? '+' : ''}{formatCurr(krakenPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Top Asset</span>
                  <span className={`text-sm font-bold truncate block ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                    {krakenSummary.totals.topAssetSymbol || '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Noch keine Kraken-Transaktionen importiert.
              </div>
            )}
          </div>

          {/* Crypto.com Card (High Contrast: Electric Cyan & Black) */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-cyan-50/40 border-cyan-200/60' : 'bg-cyan-950/25 border-cyan-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-cyan-400/20">
                  CDC
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Crypto.com</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                    {cryptoComTxs.length} Transaktion{cryptoComTxs.length !== 1 ? 'en' : ''} &bull; {cryptoComSummary.assets.length} Coins
                  </span>
                </div>
              </div>

              {cryptoComTxs.length > 0 && (
                <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  cryptoIsProfit 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25') 
                    : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
                }`}>
                  {cryptoIsProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{cryptoIsProfit ? '+' : ''}{cryptoPnlPct.toFixed(2)} %</span>
                </div>
              )}
            </div>

            {cryptoComTxs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(cryptoValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(cryptoInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${cryptoIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {cryptoIsProfit ? '+' : ''}{formatCurr(cryptoPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Top Asset</span>
                  <span className={`text-sm font-bold truncate block ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                    {cryptoComSummary.totals.topAssetSymbol || '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Noch keine Crypto.com-Transaktionen importiert.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

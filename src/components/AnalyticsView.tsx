import React, { useState, useMemo } from 'react';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { PortfolioCharts } from './PortfolioCharts';
import { PortfolioValueTimelineChart } from './PortfolioValueTimelineChart';
import { getCoinDetails } from '../utils/priceService';
import { calculateAssetSummaries } from '../utils/portfolioCalculations';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins,
  Scale,
  Trophy,
  Building2
} from 'lucide-react';

interface AnalyticsViewProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  theme: 'light' | 'dark' | 'system';
  currency?: PortfolioCurrency;
  customPrices?: Record<string, number>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assets,
  transactions,
  theme,
  currency = 'EUR',
  customPrices = {},
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const [cardSort, setCardSort] = useState<'value' | 'pnl' | 'name'>('value');

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatCoinAmount = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) return val.toLocaleString('de-DE', { maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString('de-DE', { maximumFractionDigits: 4 });
    return val.toLocaleString('de-DE', { maximumFractionDigits: 8 });
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

  const sortedCards = useMemo(() => {
    return [...assets].sort((a, b) => {
      if (cardSort === 'pnl') {
        return b.pnlPercentage - a.pnlPercentage;
      }
      if (cardSort === 'name') {
        return a.symbol.localeCompare(b.symbol);
      }
      const valA = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
      const valB = isUSD ? (b.currentValueUSD ?? b.currentValue) : (b.currentValueEUR ?? b.currentValue);
      return valB - valA;
    });
  }, [assets, cardSort, isUSD]);

  const profitableCount = assets.filter(a => (isUSD ? (a.pnlUSD ?? a.pnl) : (a.pnlEUR ?? a.pnl)) >= 0).length;
  const losingCount = assets.length - profitableCount;

  return (
    <div className="space-y-6">
      {/* 1. Portfolio Total Valuation Over Time (Line Chart) */}
      <PortfolioValueTimelineChart 
        transactions={transactions}
        customPrices={customPrices}
        currency={currency}
        theme={theme}
      />

      {/* 2. Visual Charts Component (Allocation Donut & Cumulative Investment) */}
      <PortfolioCharts assets={assets} transactions={transactions} currency={currency} theme={theme} />

      {/* 2.5 Börsen-Vergleich: Kraken Pro vs. Crypto.com */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl transition-colors space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Börsen- &amp; Plattform-Vergleich
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Gegenüberstellung von Portfoliowert, Rendite und Trade-Aktivität nach Börsen-Quelle.
              </p>
            </div>
          </div>
        </div>

        {/* Capital Split Bar */}
        {krakenTxs.length > 0 && cryptoComTxs.length > 0 && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/40 border-slate-800/60'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono font-semibold">
              <span className="text-purple-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                <span>Kraken Pro: {krakenShare.toFixed(1)} % ({formatCurr(krakenInvested)})</span>
              </span>
              <span className="text-blue-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Crypto.com: {cryptoShare.toFixed(1)} % ({formatCurr(cryptoInvested)})</span>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-800">
              <div 
                style={{ width: `${krakenShare}%` }} 
                className="bg-purple-500 h-full transition-all duration-500" 
                title={`Kraken Pro: ${krakenShare.toFixed(1)} %`} 
              />
              <div 
                style={{ width: `${cryptoShare}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Crypto.com: ${cryptoShare.toFixed(1)} %`} 
              />
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kraken Pro Card */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-purple-50/30 border-purple-100' : 'bg-purple-950/15 border-purple-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  KP
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Kraken Pro</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(krakenValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(krakenInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${krakenIsProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {krakenIsProfit ? '+' : ''}{formatCurr(krakenPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
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

          {/* Crypto.com Card */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-blue-50/30 border-blue-100' : 'bg-blue-950/15 border-blue-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  CDC
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Crypto.com</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(cryptoValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(cryptoInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${cryptoIsProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {cryptoIsProfit ? '+' : ''}{formatCurr(cryptoPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Top Asset</span>
                  <span className={`text-sm font-bold truncate block ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
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

      {/* 3. Section: Coin Performance & Rendite-Profile */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Coin-Performance &amp; Rendite-Profile
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {assets.length} Coins
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ø Kaufkurs im direkten Vergleich zum Live-Marktkurs, Kapitaleinsatz und Gewinnverteilung.
              </p>
            </div>
          </div>

          {/* Quick Stats & Sort Filter */}
          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                {profitableCount} im Plus
              </span>
              {losingCount > 0 && (
                <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20">
                  {losingCount} im Minus
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Sortieren:
              </span>
              <select
                value={cardSort}
                onChange={(e) => setCardSort(e.target.value as any)}
                aria-label="Kacheln sortieren"
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900' 
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="value">Höchster Wert</option>
                <option value="pnl">Beste Rendite (%)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Coin Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCards.map(asset => {
            const details = getCoinDetails(asset.symbol);

            const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
            const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
            const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
            const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
            const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);

            const isProfit = activePnl >= 0;
            const priceDecimals = activePrice < 1 ? 4 : (activePrice < 10 ? 3 : 2);
            const avgBuyDecimals = activeAvgBuy < 1 ? 4 : (activeAvgBuy < 10 ? 3 : 2);

            return (
              <div 
                key={asset.symbol} 
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md' 
                    : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700 hover:shadow-xl'
                }`}
              >
                {/* 1. Header: Icon, Names & Prominent PnL Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.symbol}</span>
                      <span className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`} title={asset.name}>
                        {asset.name}
                      </span>
                    </div>
                    <div className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatCoinAmount(asset.currentBalance)} {asset.symbol}
                    </div>
                  </div>

                  {/* Return Badge */}
                  <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex-shrink-0 border ${
                    isProfit 
                      ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') 
                      : (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')
                  }`}>
                    {isProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
                    <span>{isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %</span>
                  </div>
                </div>

                {/* 2. Main Value & Unrealized Gain/Loss Banner */}
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50/70 border-slate-200/80' : 'bg-slate-950/50 border-slate-800/70'
                }`}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Portfoliowert</span>
                    <span className={`text-[11px] font-mono font-semibold ${
                      isProfit ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')
                    }`}>
                      {isProfit ? '+' : ''}{formatCurr(activePnl)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatCurr(activeValue)}
                    </span>
                    <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {asset.allocationPercentage.toFixed(1)} % Anteil
                    </span>
                  </div>

                  {/* Allocation progress bar */}
                  <div className="w-full bg-slate-700/20 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, Math.max(3, asset.allocationPercentage))}%`,
                        backgroundColor: details.color || '#6366f1'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Detailed Metrics: DCA Comparison & Capital Invested */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  {/* Left Column: Price Comparison */}
                  <div className={`p-2.5 rounded-xl border space-y-1 ${
                    isLight ? 'bg-slate-50/40 border-slate-200/60' : 'bg-slate-950/30 border-slate-800/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ø Kaufkurs</span>
                      <span className={`font-semibold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {formatCurr(activeAvgBuy, avgBuyDecimals)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Live-Kurs</span>
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formatCurr(activePrice, priceDecimals)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Capital flow */}
                  <div className={`p-2.5 rounded-xl border space-y-1 ${
                    isLight ? 'bg-slate-50/40 border-slate-200/60' : 'bg-slate-950/30 border-slate-800/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                      <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formatCurr(activeInvested)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Trades</span>
                      <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {asset.transactionCount}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


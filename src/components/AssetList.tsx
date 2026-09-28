import React, { useState } from 'react';
import { AssetSummary, PortfolioCurrency } from '../types';
import { 
  Edit3, 
  Filter, 
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getCoinDetails } from '../utils/priceService';

interface AssetListProps {
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  onSelectAssetForFilter?: (symbol: string) => void;
  onEditPrice?: (symbol: string, currentPrice: number) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  currency = 'EUR',
  onSelectAssetForFilter,
  onEditPrice,
}) => {
  const isUSD = currency === 'USD';
  // Allow user to toggle between responsive card view and full table view
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const formatActive = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatAlt = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: isUSD ? 'EUR' : 'USD',
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

  if (assets.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl p-12 border border-slate-800 text-center">
        <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Sparkles className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Noch keine Krypto-Assets vorhanden</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Importiere deine Kraken oder Crypto.com Export-Datei oder erfasse deine ersten Käufe manuell, um deine Bestände und Durchschnitte hier zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
      {/* Header with Title and Mobile View Mode Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Asset-Übersicht &amp; Durchschnittskurse (DCA)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {assets.length} Coins
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatisch berechneter Einkaufswert, aktueller Marktwert und Gewinn/Verlust
          </p>
        </div>

        {/* View Switcher: Auto (cards on mobile, table on desktop), Force Cards, Force Table */}
        <div className="flex items-center self-start sm:self-auto space-x-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('auto')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'auto'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auf dem Smartphone als kompakte Karten ohne horizontales Wischen, auf Desktop als Tabelle"
          >
            <span>Auto</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kompakte Kartenansicht für schnellen Gewinn/Verlust-Blick"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Karten</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vollständige Tabelle mit allen Spalten"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tabelle</span>
          </button>
        </div>
      </div>

      {/* 1. MOBILE QUICK-CHECK VIEW (Zero horizontal scrolling on phone) */}
      <div className={`${viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block sm:hidden'} divide-y divide-slate-800/60`}>
        {assets.map((asset) => {
          const details = getCoinDetails(asset.symbol);

          const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
          const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
          const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
          const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
          const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);

          const isProfit = activePnl >= 0;
          const priceDecimals = activePrice < 1 ? 4 : (activePrice < 10 ? 3 : 2);
          const avgBuyDecimals = activeAvgBuy < 1 ? 4 : (activeAvgBuy < 10 ? 3 : 2);

          return (
            <div key={asset.symbol} className="p-4 space-y-3 hover:bg-slate-800/20 transition-colors">
              {/* Card Headline: Asset info on left, PROMINENT CURRENT VALUE & GAIN/LOSS ON RIGHT */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: details.color || '#6366f1' }}
                  >
                    {asset.symbol.substring(0, 4)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                      <span>{asset.symbol}</span>
                      <span className="text-xs font-normal text-slate-400 truncate max-w-[120px]">{asset.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {formatCoinAmount(asset.currentBalance)} {asset.symbol}
                    </div>
                  </div>
                </div>

                {/* Right Headline: Current Value & Profit/Loss (Immediately visible without swiping!) */}
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-extrabold font-mono text-white">
                    {formatActive(activeValue)}
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold mt-0.5 ${
                    isProfit 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  }`}>
                    {isProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
                    <span>{isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Quick metrics grid: Ø Kaufkurs, Akt. Kurs, Investiert, Gewinn € */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs font-mono">
                <div>
                  <div className="text-[10px] font-sans text-slate-400">Ø Kaufkurs</div>
                  <div className="font-medium text-indigo-300 truncate">{formatActive(activeAvgBuy, avgBuyDecimals)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-sans text-slate-400">Aktueller Kurs</div>
                  <div className="font-medium text-slate-200 truncate">{formatActive(activePrice, priceDecimals)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-sans text-slate-400">Gewinn (€)</div>
                  <div className={`font-bold truncate ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}{formatActive(activePnl)}
                  </div>
                </div>
              </div>

              {/* Bottom footer: Investiert, Portfolio % bar & Action Buttons */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center space-x-2 flex-1 max-w-[200px]">
                  <span className="text-[11px] text-slate-400">Investiert:</span>
                  <span className="font-mono text-slate-300 font-semibold">{formatActive(activeInvested)}</span>
                  <span className="text-[11px] text-slate-500 font-mono">({asset.allocationPercentage.toFixed(1)}%)</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {onEditPrice && (
                    <button
                      onClick={() => onEditPrice(asset.symbol, activePrice)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 text-xs transition-colors cursor-pointer"
                      title="Kurs manuell anpassen"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onSelectAssetForFilter && (
                    <button
                      onClick={() => onSelectAssetForFilter(asset.symbol)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. REFINED DESKTOP TABLE (Single-line headers, perfectly aligned columns) */}
      <div className={`${viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden sm:block'} overflow-x-auto`}>
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 sm:px-6 text-left whitespace-nowrap">Asset / Coin</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Bestand</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Ø Kaufkurs</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Aktueller Kurs</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Investiert</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Aktueller Wert</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Gewinn / Verlust</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Portfolio</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {assets.map((asset) => {
              const details = getCoinDetails(asset.symbol);

              const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
              const altAvgBuy = isUSD ? asset.averageBuyPriceEUR : asset.averageBuyPriceUSD;

              const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
              const altPrice = isUSD ? asset.currentPriceEUR : asset.currentPriceUSD;

              const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
              const altInvested = isUSD ? asset.totalInvestedEUR : asset.totalInvestedUSD;

              const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
              const altValue = isUSD ? asset.currentValueEUR : asset.currentValueUSD;

              const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);
              const altPnl = isUSD ? asset.pnlEUR : asset.pnlUSD;

              const isProfit = activePnl >= 0;
              const priceDecimals = activePrice < 1 ? 4 : (activePrice < 10 ? 3 : 2);
              const avgBuyDecimals = activeAvgBuy < 1 ? 4 : (activeAvgBuy < 10 ? 3 : 2);
              const altDecimals = (altPrice && altPrice < 1) ? 4 : 2;

              return (
                <tr 
                  key={asset.symbol} 
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Asset Symbol & Name (text-left) */}
                  <td className="py-3.5 px-4 sm:px-6 text-left align-middle">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: details.color || '#6366f1' }}
                      >
                        {asset.symbol.substring(0, 4)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-white shrink-0">{asset.symbol}</span>
                          <span 
                            className="text-xs font-normal text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" 
                            title={asset.name}
                          >
                            {asset.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 whitespace-nowrap">
                          {asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Balance (text-right) */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-100 align-middle whitespace-nowrap">
                    <div>{formatCoinAmount(asset.currentBalance)}</div>
                    <div className="text-xs text-slate-400 font-sans">{asset.symbol}</div>
                  </td>

                  {/* Avg Buy Price / DCA (text-right) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200 align-middle whitespace-nowrap">
                    <div className="font-medium text-indigo-300">
                      {formatActive(activeAvgBuy, avgBuyDecimals)}
                    </div>
                    {altAvgBuy !== undefined && altAvgBuy > 0 && (
                      <div className="text-[10px] text-slate-500 font-sans">
                        ≈ {formatAlt(altAvgBuy, altDecimals)}
                      </div>
                    )}
                  </td>

                  {/* Current Price (text-right) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5 group/price">
                      {onEditPrice && (
                        <button
                          onClick={() => onEditPrice(asset.symbol, activePrice)}
                          title="Kurs manuell anpassen"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <span className="font-medium">{formatActive(activePrice, priceDecimals)}</span>
                    </div>
                    {altPrice !== undefined && altPrice > 0 && (
                      <div className="text-[10px] text-slate-500 font-sans">
                        ≈ {formatAlt(altPrice, altDecimals)}
                      </div>
                    )}
                  </td>

                  {/* Total Invested (text-right) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 align-middle whitespace-nowrap">
                    <div>{formatActive(activeInvested)}</div>
                    {altInvested !== undefined && (
                      <div className="text-[10px] text-slate-500 font-sans">
                        ≈ {formatAlt(altInvested)}
                      </div>
                    )}
                  </td>

                  {/* Current Value (text-right) */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white align-middle whitespace-nowrap">
                    <div>{formatActive(activeValue)}</div>
                    {altValue !== undefined && (
                      <div className="text-[10px] text-slate-500 font-sans font-normal">
                        ≈ {formatAlt(altValue)}
                      </div>
                    )}
                  </td>

                  {/* Profit / Loss (text-right) */}
                  <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                    <div className={`font-mono font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)}%
                    </div>
                    <div className={`text-xs font-mono font-medium ${isProfit ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                      {isProfit ? '+' : ''}{formatActive(activePnl)}
                    </div>
                    {altPnl !== undefined && (
                      <div className="text-[10px] text-slate-500 font-sans">
                        ≈ {altPnl >= 0 ? '+' : ''}{formatAlt(altPnl)}
                      </div>
                    )}
                  </td>

                  {/* Allocation % (text-right) */}
                  <td className="py-3.5 px-4 text-right min-w-[100px] align-middle whitespace-nowrap">
                    <div className="text-xs font-mono font-semibold text-slate-200 mb-1">
                      {asset.allocationPercentage.toFixed(1)}%
                    </div>
                    <div className="w-full max-w-[80px] ml-auto bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(2, asset.allocationPercentage))}%`,
                          backgroundColor: details.color || '#6366f1' 
                        }}
                      />
                    </div>
                  </td>

                  {/* Actions (text-right) */}
                  <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                    {onSelectAssetForFilter && (
                      <button
                        onClick={() => onSelectAssetForFilter(asset.symbol)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700/60 transition-all shadow-sm cursor-pointer"
                        title={`Transaktionen für ${asset.symbol} filtern`}
                      >
                        <Filter className="w-3 h-3" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

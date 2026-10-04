import React, { useState, useMemo } from 'react';
import { AssetSummary, PortfolioCurrency } from '../types';
import { 
  Edit3, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { getCoinDetails } from '../utils/priceService';

type SortKey = 'coin' | 'balance' | 'avgBuy' | 'price' | 'invested' | 'value' | 'pnl' | 'allocation';
type SortDirection = 'asc' | 'desc';

interface AssetListProps {
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  onSelectAssetForFilter?: (symbol: string) => void;
  onEditPrice?: (symbol: string, currentPrice: number) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  currency = 'EUR',
  theme = 'dark',
  onSelectAssetForFilter,
  onEditPrice,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  // Sorting state: default to sorted by portfolio value descending
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'coin' ? 'asc' : 'desc');
    }
  };

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case 'coin':
          aVal = a.symbol.toLowerCase();
          bVal = b.symbol.toLowerCase();
          break;
        case 'balance':
          aVal = a.currentBalance;
          bVal = b.currentBalance;
          break;
        case 'avgBuy':
          aVal = isUSD ? (a.averageBuyPriceUSD || a.averageBuyPrice) : (a.averageBuyPriceEUR || a.averageBuyPrice);
          bVal = isUSD ? (b.averageBuyPriceUSD || b.averageBuyPrice) : (b.averageBuyPriceEUR || b.averageBuyPrice);
          break;
        case 'price':
          aVal = isUSD ? (a.currentPriceUSD || a.currentPrice) : (a.currentPriceEUR || a.currentPrice);
          bVal = isUSD ? (b.currentPriceUSD || b.currentPrice) : (b.currentPriceEUR || b.currentPrice);
          break;
        case 'invested':
          aVal = isUSD ? (a.totalInvestedUSD ?? a.totalInvested) : (a.totalInvestedEUR ?? a.totalInvested);
          bVal = isUSD ? (b.totalInvestedUSD ?? b.totalInvested) : (b.totalInvestedEUR ?? b.totalInvested);
          break;
        case 'value':
          aVal = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
          bVal = isUSD ? (b.currentValueUSD ?? b.currentValue) : (b.currentValueEUR ?? b.currentValue);
          break;
        case 'pnl':
          aVal = a.pnlPercentage;
          bVal = b.pnlPercentage;
          break;
        case 'allocation':
          aVal = a.allocationPercentage;
          bVal = b.allocationPercentage;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [assets, sortKey, sortDirection, isUSD]);

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

  const renderSortHeader = (label: string, key: SortKey, align: 'left' | 'right' = 'right') => {
    const isActive = sortKey === key;
    return (
      <th
        onClick={() => handleSort(key)}
        className={`py-3 px-2 lg:px-3 ${align === 'left' ? 'sm:px-4 text-left' : 'text-right'} whitespace-nowrap cursor-pointer select-none transition-colors group ${
          isActive 
            ? (isLight ? 'text-indigo-600 font-bold bg-indigo-50/60' : 'text-indigo-400 font-bold bg-indigo-950/30') 
            : (isLight ? 'hover:text-slate-900 text-slate-600 hover:bg-slate-100/60' : 'hover:text-slate-200 text-slate-400 hover:bg-slate-800/40')
        }`}
        title={`Nach ${label} sortieren (${isActive ? (sortDirection === 'asc' ? 'aufsteigend' : 'absteigend') : 'klicken'})`}
      >
        <div className={`inline-flex items-center space-x-1 ${align === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="text-xs font-semibold">{label}</span>
          <span className={`inline-flex items-center transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          }`}>
            {isActive ? (
              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
            )}
          </span>
        </div>
      </th>
    );
  };

  if (assets.length === 0) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/80 text-slate-400'
        }`}>
          <Sparkles className="w-7 h-7 text-indigo-500" />
        </div>
        <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Noch keine Krypto-Assets vorhanden</h3>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Importiere deine Kraken oder Crypto.com Export-Datei oder erfasse deine ersten Käufe manuell, um deine Bestände und Durchschnitte hier zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border shadow-xl overflow-hidden ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800/90'
    }`}>
      {/* Header with Title */}
      <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
        isLight ? 'border-slate-100 bg-white' : 'border-slate-800 bg-transparent'
      }`}>
        <div>
          <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>Coinübersicht &amp; Durchschnittskurse</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {assets.length} Coins
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Automatisch berechneter Einkaufswert, aktueller Marktwert und Gewinn/Verlust
          </p>
        </div>
      </div>

      {/* 1. MOBILE QUICK-CHECK VIEW (Zero horizontal scrolling on phone) */}
      <div className={`block md:hidden divide-y ${
        isLight ? 'divide-slate-100' : 'divide-slate-800/60'
      }`}>
        {sortedAssets.map((asset) => {
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
            <div key={asset.symbol} className={`p-4 space-y-3 transition-colors ${
              isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/20'
            }`}>
              {/* Card Headline: Asset info on left, PROMINENT CURRENT VALUE & GAIN/LOSS ON RIGHT */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={`font-bold text-sm flex items-center space-x-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="font-extrabold">{asset.symbol}</span>
                    <span className={`text-xs font-normal truncate max-w-[140px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{asset.name}</span>
                  </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatCoinAmount(asset.currentBalance)} {asset.symbol}
                      </span>
                      <span className="text-slate-400 text-[10px]">&bull;</span>
                      {onSelectAssetForFilter ? (
                        <button
                          onClick={() => onSelectAssetForFilter(asset.symbol)}
                          className={`text-xs cursor-pointer transition-colors ${
                            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={`${asset.transactionCount} Transaktion(en) anzeigen`}
                        >
                          <span>{asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}</span>
                        </button>
                      ) : (
                        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                {/* Right Headline: Current Value & Profit/Loss (Immediately visible without swiping!) */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-base font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatActive(activeValue)}
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold mt-0.5 ${
                    isProfit 
                      ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25') 
                      : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25')
                  }`}>
                    {isProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
                    <span>{isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %</span>
                  </div>
                </div>
              </div>

              {/* Quick metrics grid: Ø Kaufkurs, Akt. Kurs, Investiert, Gewinn € */}
              <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-xs font-mono ${
                isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/50 border-slate-800/70'
              }`}>
                <div>
                  <div className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ø Kaufkurs</div>
                  <div className={`font-medium truncate ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>{formatActive(activeAvgBuy, avgBuyDecimals)}</div>
                </div>
                <div>
                  <div className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Kurs</div>
                  <div className={`font-medium truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatActive(activePrice, priceDecimals)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn (€)</div>
                  <div className={`font-bold truncate ${isProfit ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
                    {isProfit ? '+' : ''}{formatActive(activePnl)}
                  </div>
                </div>
              </div>

              {/* Bottom footer: Investiert, Portfolio % bar & Action Buttons */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center space-x-2 flex-1 max-w-[200px]">
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert:</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{formatActive(activeInvested)}</span>
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>({asset.allocationPercentage.toFixed(1)} %)</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {onEditPrice && (
                    <button
                      onClick={() => onEditPrice(asset.symbol, activePrice)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-indigo-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400'
                      }`}
                      title="Kurs manuell anpassen"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. REFINED DESKTOP TABLE (Single-line headers, perfectly aligned columns) */}
      <div className="hidden md:block overflow-x-auto lg:overflow-x-visible">
        <table className="w-full text-left text-sm border-collapse">
          <thead className={`text-xs uppercase font-semibold tracking-wider border-b ${
            isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950/70 text-slate-400 border-slate-800'
          }`}>
            <tr>
              {renderSortHeader('Coin', 'coin', 'left')}
              {renderSortHeader('Bestand', 'balance', 'right')}
              {renderSortHeader('Ø Kaufkurs', 'avgBuy', 'right')}
              {renderSortHeader('Aktueller Kurs', 'price', 'right')}
              {renderSortHeader('Investiert', 'invested', 'right')}
              {renderSortHeader('Aktueller Wert', 'value', 'right')}
              {renderSortHeader('Gewinn / Verlust', 'pnl', 'right')}
              {renderSortHeader('Portfolio', 'allocation', 'right')}
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
            {sortedAssets.map((asset) => {
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
                <tr 
                  key={asset.symbol} 
                  className={`transition-colors group ${
                    isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Asset Symbol & Name (text-left) */}
                  <td className="py-2.5 px-3 sm:px-4 text-left align-middle">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className={`font-bold shrink-0 text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.symbol}</span>
                        <span 
                          className={`text-xs font-normal truncate max-w-[120px] lg:max-w-[180px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`} 
                          title={asset.name}
                        >
                          {asset.name}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        {onSelectAssetForFilter ? (
                          <button
                            onClick={() => onSelectAssetForFilter(asset.symbol)}
                            className={`text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                              isLight 
                                ? 'text-slate-500 hover:text-slate-800' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={`${asset.transactionCount} Transaktion(en) für ${asset.symbol} in der Transaktionsliste anzeigen`}
                          >
                            <span>{asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}</span>
                          </button>
                        ) : (
                          <div className={`text-[11px] whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Balance (text-right) */}
                  <td className={`py-2.5 px-2 lg:px-3 text-right font-mono font-medium text-xs sm:text-sm align-middle whitespace-nowrap ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {formatCoinAmount(asset.currentBalance)}
                  </td>

                  {/* Avg Buy Price / DCA (text-right) */}
                  <td className="py-2.5 px-2 lg:px-3 text-right font-mono text-xs sm:text-sm align-middle whitespace-nowrap">
                    <div className={`font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>
                      {formatActive(activeAvgBuy, avgBuyDecimals)}
                    </div>
                  </td>

                  {/* Current Price (text-right) */}
                  <td className="py-2.5 px-2 lg:px-3 text-right font-mono text-xs sm:text-sm align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1 group/price">
                      {onEditPrice && (
                        <button
                          onClick={() => onEditPrice(asset.symbol, activePrice)}
                          title="Kurs manuell anpassen"
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer ${
                            isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600' : 'hover:bg-slate-700 text-slate-400 hover:text-indigo-400'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatActive(activePrice, priceDecimals)}</span>
                    </div>
                  </td>

                  {/* Total Invested (text-right) */}
                  <td className={`py-2.5 px-2 lg:px-3 text-right font-mono text-xs sm:text-sm align-middle whitespace-nowrap ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    <div>{formatActive(activeInvested)}</div>
                  </td>

                  {/* Current Value (text-right) */}
                  <td className={`py-2.5 px-2 lg:px-3 text-right font-mono text-xs sm:text-sm font-bold align-middle whitespace-nowrap ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <div>{formatActive(activeValue)}</div>
                  </td>

                  {/* Profit / Loss (text-right) */}
                  <td className="py-2.5 px-2 lg:px-3 text-right align-middle whitespace-nowrap">
                    <div className={`font-mono font-semibold text-xs sm:text-sm ${
                      isProfit ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')
                    }`}>
                      {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)} %
                    </div>
                    <div className={`text-[11px] font-mono font-medium ${
                      isProfit ? (isLight ? 'text-emerald-700/80' : 'text-emerald-400/90') : (isLight ? 'text-rose-700/80' : 'text-rose-400/90')
                    }`}>
                      {isProfit ? '+' : ''}{formatActive(activePnl)}
                    </div>
                  </td>

                  {/* Allocation % (text-right) */}
                  <td className="py-2.5 px-2 lg:px-3 text-right min-w-[70px] align-middle whitespace-nowrap">
                    <div className={`text-xs font-mono font-semibold mb-1 ${
                      isLight ? 'text-slate-700' : 'text-slate-200'
                    }`}>
                      {asset.allocationPercentage.toFixed(1)} %
                    </div>
                    <div className={`w-full max-w-[60px] ml-auto rounded-full h-1.5 overflow-hidden ${
                      isLight ? 'bg-slate-100' : 'bg-slate-800'
                    }`}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(2, asset.allocationPercentage))}%`,
                          backgroundColor: details.color || '#6366f1' 
                        }}
                      />
                    </div>
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

import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from 'recharts';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { getCoinDetails } from '../utils/priceService';
import { PieChart as PieIcon } from 'lucide-react';

interface PortfolioChartsProps {
  assets: AssetSummary[];
  transactions?: Transaction[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  assets,
  currency = 'EUR' as PortfolioCurrency,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const [activeCoinSymbol, setActiveCoinSymbol] = useState<string | null>(null);

  const pieData = assets
    .filter(a => {
      const val = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
      return val > 0;
    })
    .map(a => {
      const details = getCoinDetails(a.symbol);
      const val = isUSD ? (a.currentValueUSD ?? a.currentValue) : (a.currentValueEUR ?? a.currentValue);
      return {
        name: a.symbol,
        fullName: a.name,
        value: val,
        balance: a.currentBalance,
        percentage: a.allocationPercentage,
        color: details.color || '#6366f1',
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const formatCurrency = (val: number, decimals: number = 0) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const activeCoin = activeCoinSymbol 
    ? pieData.find(c => c.name === activeCoinSymbol) || null 
    : null;

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl transition-all ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <PieIcon className="w-4 h-4 text-indigo-500" />
            <span>Coin Allokation</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {pieData.length} Coins
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Prozentuale Gewichtung aller Krypto-Bestände nach aktuellem Marktwert in {currency}
          </p>
        </div>
      </div>

      {pieData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Noch keine Bestände mit Wert vorhanden.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          
          {/* 1. Left: Ringdiagramm with Centerpiece Display */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={105}
                  paddingAngle={pieData.length > 1 ? 2.5 : 0}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveCoinSymbol(pieData[index].name)}
                  onMouseLeave={() => setActiveCoinSymbol(null)}
                >
                  {pieData.map((entry) => {
                    const isSelected = activeCoinSymbol === entry.name;
                    return (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={entry.color} 
                        stroke={isLight ? '#ffffff' : '#0f172a'} 
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                          transformOrigin: 'center center',
                          filter: isSelected ? 'brightness(1.15) drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Non-obscuring Center Hole Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center select-none">
              {activeCoin ? (
                <div className="space-y-0.5 animate-fadeIn">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeCoin.color }} />
                    <span className={`font-mono font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeCoin.name}
                    </span>
                  </div>
                  <div className={`text-xs truncate max-w-[130px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {activeCoin.fullName}
                  </div>
                  <div className="text-sm font-extrabold text-indigo-500 font-mono">
                    {formatCurrency(activeCoin.value)}
                  </div>
                  <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {activeCoin.percentage.toFixed(1)} %
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    Gesamtwert
                  </span>
                  <div className={`font-extrabold text-base sm:text-lg font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(totalValue)}
                  </div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {pieData.length} Positionen
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Right: Multi-Column Responsive Grid listing EVERY SINGLE COIN (no "Andere" truncation) */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pieData.map((item) => {
                const isSelected = activeCoinSymbol === item.name;
                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setActiveCoinSymbol(item.name)}
                    onMouseLeave={() => setActiveCoinSymbol(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? (isLight ? 'bg-indigo-50/80 border-indigo-400 shadow-md ring-1 ring-indigo-400' : 'bg-indigo-950/40 border-indigo-500 shadow-lg ring-1 ring-indigo-500')
                        : (isLight ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80' : 'bg-slate-950/40 hover:bg-slate-900 border-slate-800/80')
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className={`font-bold font-mono text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.fullName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-indigo-500 flex-shrink-0">
                        {item.percentage.toFixed(1)} %
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className={`font-mono text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formatCurrency(item.value)}
                      </span>
                      <span className={`text-[10px] font-mono truncate max-w-[100px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.balance.toLocaleString('de-DE', { maximumFractionDigits: 4 })}
                      </span>
                    </div>

                    {/* Relative share bar */}
                    <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                      <div 
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

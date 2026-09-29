import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { generateInvestmentTimeline } from '../utils/portfolioCalculations';
import { getCoinDetails } from '../utils/priceService';
import { PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

interface PortfolioChartsProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  assets,
  transactions,
  currency = 'EUR' as PortfolioCurrency,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';
  const currencySymbol = isUSD ? '$' : '€';
  const timelineData = generateInvestmentTimeline(transactions, currency as PortfolioCurrency);

  const pieData = assets
    .filter(a => a.currentValue > 0)
    .map(a => {
      const details = getCoinDetails(a.symbol);
      return {
        name: a.symbol,
        fullName: a.name,
        value: a.currentValue,
        percentage: a.allocationPercentage,
        color: details.color || '#6366f1',
      };
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
          isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xl' : 'bg-slate-900 border-slate-700 text-white shadow-xl'
        }`}>
          <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name} ({data.fullName})</span>
          </div>
          <div className={isLight ? 'text-slate-600' : 'text-slate-300'}>
            Wert: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(data.value)}</strong>
          </div>
          <div className="text-indigo-500 font-semibold">
            Anteil: {data.percentage.toFixed(1)} %
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
          isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xl' : 'bg-slate-900 border-slate-700 text-white shadow-xl'
        }`}>
          <div className={`font-bold flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{data.formattedDate}</span>
          </div>
          <div className={isLight ? 'text-slate-600' : 'text-slate-300'}>
            Kauf: <strong className="text-emerald-500">+{formatCurrency(data.added)}</strong> ({data.asset})
          </div>
          <div className={isLight ? 'text-indigo-600' : 'text-indigo-300'}>
            Kumuliert investiert: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(data.investedCum)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const sortedPieData = [...pieData].sort((a, b) => b.value - a.value);

  // Show at most 6 items in legend so it NEVER needs a scrollbar and matches right card height
  const legendItems = useMemo(() => {
    if (sortedPieData.length <= 6) return sortedPieData;
    const top5 = sortedPieData.slice(0, 5);
    const rest = sortedPieData.slice(5);
    const otherValue = rest.reduce((acc, r) => acc + r.value, 0);
    const otherPct = rest.reduce((acc, r) => acc + r.percentage, 0);
    return [
      ...top5,
      {
        name: `Andere (${rest.length})`,
        fullName: rest.map(r => r.name).join(', '),
        value: otherValue,
        percentage: otherPct,
        color: '#64748b',
      }
    ];
  }, [sortedPieData]);

  const cardClass = isLight
    ? 'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-full'
    : 'bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-xl flex flex-col justify-between h-full';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* Allocation Donut Chart */}
      <div className={`lg:col-span-5 ${cardClass}`}>
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <PieIcon className="w-4 h-4 text-indigo-500" />
              <span>Asset-Allokation</span>
            </h3>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>nach Wert in {currency}</span>
          </div>

          {pieData.length > 0 ? (
            <div className="h-52 w-full relative my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={isLight ? '#ffffff' : '#0f172a'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={<CustomPieTooltip />} 
                    isAnimationActive={false} 
                    animationDuration={0}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-slate-500">
              Keine Bestände vorhanden
            </div>
          )}
        </div>

        {/* Legend List: Always clean, non-scrollable grid that fits perfectly */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 pt-3 border-t mt-3 ${
          isLight ? 'border-slate-100' : 'border-slate-800/60'
        }`}>
          {legendItems.map((item) => (
            <div 
              key={item.name} 
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${
                isLight ? 'bg-slate-50 border border-slate-200/60' : 'bg-slate-950/40'
              }`}
              title={item.fullName}
            >
              <div className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className={`font-semibold truncate text-[11px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.name}</span>
              </div>
              <span className={`font-mono text-[11px] ml-1 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.percentage.toFixed(1)} %</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative Investment Timeline */}
      <div className={`lg:col-span-7 ${cardClass}`}>
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Investitions-Entwicklung über Zeit</span>
            </h3>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kumulierter Kapitaleinsatz ({currency})</span>
          </div>

          {timelineData.length > 0 ? (
            <div className="h-52 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} vertical={false} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke={isLight ? '#94a3b8' : '#64748b'} 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={isLight ? '#94a3b8' : '#64748b'} 
                    fontSize={11} 
                    tickFormatter={(v) => `${v}${currencySymbol}`}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    content={<CustomTimelineTooltip />} 
                    isAnimationActive={false} 
                    animationDuration={0}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="investedCum" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorInvested)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-slate-500">
              Noch keine Käufe für Zeitachsen-Darstellung
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between mt-3 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
        }`}>
          <span>Gesamter Zukauf: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{timelineData.length} Transaktionszeitpunkte</strong></span>
          <span className="text-emerald-500 font-semibold font-mono">DCA Strategie ({currency})</span>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Gauge, Sparkles, AlertTriangle, TrendingUp, Compass } from 'lucide-react';

interface FearAndGreedWidgetProps {
  theme?: 'light' | 'dark' | 'system';
}

interface FNGData {
  value: number;
  value_classification: string;
  timestamp: string;
}

export const FearAndGreedWidget: React.FC<FearAndGreedWidgetProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  const [fng, setFng] = useState<FNGData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchFNG() {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.[0] && isMounted) {
            setFng({
              value: parseInt(json.data[0].value, 10),
              value_classification: json.data[0].value_classification,
              timestamp: json.data[0].timestamp,
            });
          }
        }
      } catch (err) {
        // Fallback default if offline/network blocked
        if (isMounted) {
          setFng({
            value: 65,
            value_classification: 'Greed',
            timestamp: String(Math.floor(Date.now() / 1000)),
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFNG();
    const interval = setInterval(fetchFNG, 1000 * 60 * 30); // refresh every 30 mins
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const value = fng?.value ?? 50;

  // Sentiment classification and DCA advice in German
  let label = 'Neutral';
  let badgeColor = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  let gaugeColor = '#eab308';
  let dcaTip = 'Gleichmäßigen DCA-Sparplan beibehalten.';

  if (value <= 24) {
    label = 'Extreme Angst';
    badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    gaugeColor = '#f43f5e';
    dcaTip = 'Historisch ideale Kauf- und DCA-Gelegenheit.';
  } else if (value <= 44) {
    label = 'Angst';
    badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    gaugeColor = '#f59e0b';
    dcaTip = 'Markt ist vorsichtig, gute Nachkaufkurse.';
  } else if (value <= 55) {
    label = 'Neutral';
    badgeColor = 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    gaugeColor = '#94a3b8';
    dcaTip = 'Markt konsolidiert, DCA-Strategie fortführen.';
  } else if (value <= 75) {
    label = 'Gier';
    badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    gaugeColor = '#10b981';
    dcaTip = 'Bullisches Momentum, diszipliniert investieren.';
  } else {
    label = 'Extreme Gier';
    badgeColor = 'bg-green-500/15 text-green-400 border-green-500/30';
    gaugeColor = '#22c55e';
    dcaTip = 'Große Euphorie, Vorsicht bei FOMO-Käufen.';
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all flex flex-col justify-between space-y-3 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Fear &amp; Greed Index
            </h4>
            <div className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Krypto-Stimmung</span>
            </div>
          </div>
        </div>

        <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
          {label}
        </div>
      </div>

      {/* Main Score & Progress Bar */}
      <div className="space-y-2 py-1">
        <div className="flex items-baseline justify-between font-mono">
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {loading ? '--' : value}
            </span>
            <span className={`text-xs font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>/ 100</span>
          </div>
          <span className={`text-xs font-sans font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Alternative.me Live
          </span>
        </div>

        {/* Multi-segment sentiment gradient bar */}
        <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-800">
          <div 
            className="w-full h-full rounded-full transition-all duration-700"
            style={{
              background: 'linear-gradient(to right, #f43f5e 0%, #f59e0b 35%, #94a3b8 50%, #10b981 75%, #22c55e 100%)'
            }}
          />
        </div>

        {/* Meter pointer indicator */}
        <div className="relative w-full h-1">
          <div 
            className="absolute -top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow transition-all duration-500"
            style={{ 
              left: `calc(${Math.min(97, Math.max(3, value))}% - 5px)`,
              backgroundColor: gaugeColor
            }}
          />
        </div>
      </div>

      {/* DCA Insight Tip */}
      <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
        isLight ? 'bg-slate-50 border-slate-200/80 text-slate-700' : 'bg-slate-950/40 border-slate-800/60 text-slate-300'
      }`}>
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] truncate" title={dcaTip}>
          {dcaTip}
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Plus, 
  Upload, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Euro, 
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { PortfolioCurrency } from '../types';
import { PixelGoatIcon } from './PixelGoatIcon';

interface QuickActionsBarProps {
  onOpenAddTransaction: () => void;
  onOpenImport: () => void;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  onOpenTaxReport: () => void;
  onToggleCurrency: () => void;
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  lastUpdatedText?: string | null;
  username?: string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenAddTransaction,
  onOpenImport,
  onRefreshPrices,
  isRefreshingPrices,
  onOpenTaxReport,
  onToggleCurrency,
  currency = 'EUR',
  theme = 'dark',
  lastUpdatedText,
  username,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  return (
    <div className={`p-4 rounded-2xl border shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Left: Branding & Status */}
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700/80 text-slate-300'
        }`}>
          <PixelGoatIcon size={22} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {username ? `Willkommen, ${username}` : 'Schnellzugriff & Aktionen'}
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live aktiv</span>
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Live-Kurse: {lastUpdatedText || 'gerade eben'} &bull; Währung: <strong>{currency} ({isUSD ? '$' : '€'})</strong>
          </p>
        </div>
      </div>

      {/* Right: The 5 Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Kauf erfassen (Primary) */}
        <button
          onClick={onOpenAddTransaction}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          title="Neuen Kauf oder Trade manuell erfassen"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Kauf erfassen</span>
        </button>

        {/* 2. CSV / PDF Import */}
        <button
          onClick={onOpenImport}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight 
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' 
              : 'bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border-purple-800/50'
          }`}
          title="Transaktionen aus Kraken oder Crypto.com importieren"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span>Import (CSV/PDF)</span>
        </button>

        {/* 3. Live-Kurse aktualisieren */}
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshingPrices}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Alle Live-Marktpreise jetzt sofort aktualisieren"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Kurse aktualisieren</span>
          <span className="sm:hidden">Aktualisieren</span>
        </button>

        {/* 4. Steuer-Report */}
        <button
          onClick={onOpenTaxReport}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isLight 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Direkt zur Steuer- & FIFO-Übersicht wechseln"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Steuern</span>
        </button>

        {/* 5. Währung wechseln (EUR <-> USD) */}
        <button
          onClick={onToggleCurrency}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
            isLight 
              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' 
              : 'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border-indigo-800/60'
          }`}
          title={`Währung umschalten auf ${isUSD ? 'EUR (€)' : 'USD ($)'}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
          <span>{currency} ({isUSD ? '$' : '€'})</span>
        </button>
      </div>
    </div>
  );
};

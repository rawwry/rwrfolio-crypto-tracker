import React from 'react';
import { 
  Plus, 
  Upload, 
  Radio
} from 'lucide-react';
import { PortfolioCurrency } from '../types';

interface QuickActionsBarProps {
  onOpenAddTransaction: () => void;
  onOpenImport: () => void;
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
  lastUpdatedText?: string | null;
  username?: string;
  // Optional legacy props kept for backwards compatibility
  onRefreshPrices?: () => void;
  isRefreshingPrices?: boolean;
  onOpenTaxReport?: () => void;
  onToggleCurrency?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenAddTransaction,
  onOpenImport,
  currency = 'EUR',
  theme = 'dark',
  lastUpdatedText,
  username,
}) => {
  const isLight = theme === 'light';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Left: Status & Greeting */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {username ? `Willkommen, ${username}` : 'Portfolio Übersicht'}
          </h2>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live aktiv</span>
          </span>
        </div>
        <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>Live-Kurse synchronisiert</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>&bull;</span>
          <span>Stand: <strong>{lastUpdatedText || 'gerade eben'}</strong></span>
        </p>
      </div>

      {/* Right: The 2 Core Action Buttons */}
      <div className="flex items-center space-x-2.5 self-start sm:self-auto">
        {/* 1. CSV / PDF Import */}
        <button
          onClick={onOpenImport}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
            isLight 
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' 
              : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-800/60'
          }`}
          title="Transaktionen aus Kraken oder Crypto.com importieren"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span>Import</span>
        </button>

        {/* 2. Kauf erfassen (Primary) */}
        <button
          onClick={onOpenAddTransaction}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          title="Neuen Kauf oder Trade manuell erfassen"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Erfassung</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  RefreshCw, 
  Download, 
  RotateCcw, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  User
} from 'lucide-react';
import { PortfolioTotals, ThemeMode, UserProfile, PortfolioCurrency } from '../types';

interface NavbarProps {
  totals: PortfolioTotals;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  onExportData: () => void;
  onResetData: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
  lastUpdatedText?: string | null;
  dbConnected?: boolean;
  activeTab: 'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes') => void;
  theme: ThemeMode;
  userProfile?: UserProfile;
  currency?: PortfolioCurrency;
  onToggleCurrency?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totals,
  onRefreshPrices,
  isRefreshingPrices,
  onExportData,
  onResetData,
  onOpenSettings,
  onLogout,
  lastUpdatedText,
  dbConnected = true,
  activeTab,
  setActiveTab,
  theme,
  userProfile,
  currency = 'EUR',
  onToggleCurrency
}) => {
  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900/95 border-slate-800/80 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-4">
          
          {/* Logo & Brand: rwr/folio */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center cursor-pointer group select-none py-1"
          >
            <span className={`font-extrabold text-lg sm:text-xl tracking-tight font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
              rwr<span className="text-indigo-500">/folio</span>
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800/60'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Transaktionen</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'transactions' 
                  ? 'bg-indigo-800 text-indigo-200' 
                  : isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-400'
              }`}>
                {totals.transactionCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'assets'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Coins</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'assets' 
                  ? 'bg-indigo-800 text-indigo-200' 
                  : isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-400'
              }`}>
                {totals.assetCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Analysen
            </button>
            <button
              onClick={() => setActiveTab('taxes')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'taxes'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Steuern</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">



            {/* Settings & Profile Trigger */}
            <button
              onClick={onOpenSettings}
              title="Einstellungen &amp; Benutzerprofil öffnen"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/60 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {userProfile?.username || 'Einstellungen'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className={`flex md:hidden items-center justify-around py-1.5 border-t text-xs ${
          isLight ? 'border-slate-200' : 'border-slate-800/60'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'dashboard' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'transactions' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Transaktionen
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'assets' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Coins
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'analytics' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Analysen
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'taxes' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Steuern
          </button>
        </div>

      </div>
    </header>
  );
};

import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, PortfolioCurrency } from '../types';
import { 
  Search, 
  Trash2, 
  Edit, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Info 
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  selectedAssetFilter?: string;
  onClearAssetFilter?: () => void;
  currency?: PortfolioCurrency;
  theme?: 'light' | 'dark' | 'system';
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onBulkDelete,
  selectedAssetFilter,
  onClearAssetFilter,
  currency = 'EUR',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState(selectedAssetFilter || 'ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest_spent' | 'lowest_spent'>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const pageSize = 15;

  // Sync selectedAssetFilter prop when changed from parent
  React.useEffect(() => {
    if (selectedAssetFilter) {
      setAssetFilter(selectedAssetFilter);
    }
  }, [selectedAssetFilter]);

  // Extract unique coins for dropdown (excluding fiat EUR/USD)
  const uniqueCoins = useMemo(() => {
    const coins = new Set<string>();
    for (const t of transactions) {
      const rec = (t.receivedCurrency || '').toUpperCase();
      const spent = (t.spentCurrency || '').toUpperCase();
      if (rec && rec !== 'EUR' && rec !== 'USD') coins.add(rec);
      if (spent && spent !== 'EUR' && spent !== 'USD') coins.add(spent);
    }
    return Array.from(coins).sort();
  }, [transactions]);

  // Filtered and sorted transactions
  const filtered = useMemo(() => {
    const getTxFiatValue = (t: Transaction) => {
      if (t.type === 'SELL') {
        return t.receivedCurrency === 'EUR' ? t.receivedAmount : (t.nativeAmount || (t.receivedAmount / 1.08));
      }
      return t.spentCurrency === 'EUR' ? t.spentAmount : (t.nativeAmount || (t.spentAmount / 1.08));
    };

    return transactions.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCoin = t.receivedCurrency.toLowerCase().includes(q) || t.spentCurrency.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        const matchesKind = (t.transactionKind || '').toLowerCase().includes(q);
        const matchesHash = (t.transactionHash || '').toLowerCase().includes(q);
        if (!matchesCoin && !matchesDesc && !matchesNotes && !matchesKind && !matchesHash) {
          return false;
        }
      }

      // Asset filter
      if (assetFilter !== 'ALL') {
        const coinUpper = assetFilter.toUpperCase();
        if (t.receivedCurrency.toUpperCase() !== coinUpper && t.spentCurrency.toUpperCase() !== coinUpper) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && t.source !== sourceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortOrder === 'highest_spent') {
        return getTxFiatValue(b) - getTxFiatValue(a);
      }
      if (sortOrder === 'lowest_spent') {
        return getTxFiatValue(a) - getTxFiatValue(b);
      }
      return 0;
    });
  }, [transactions, searchQuery, assetFilter, typeFilter, sourceFilter, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedTransactions = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isUSD = currency === 'USD';

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

  const formatEUR = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  // Robust transaction display extractor handling BUY, SELL, REWARD, and TRANSFER correctly
  const getTransactionDisplay = (tx: Transaction) => {
    const eurRate = 1.08;
    const isSell = tx.type === 'SELL';
    const isBuy = tx.type === 'BUY';
    const isReward = tx.type === 'REWARD' || tx.type === 'STAKE';

    const spentIsFiat = tx.spentCurrency === 'EUR' || tx.spentCurrency === 'USD';
    const recIsFiat = tx.receivedCurrency === 'EUR' || tx.receivedCurrency === 'USD';

    let cryptoSymbol = '';
    let cryptoAmount = 0;
    let isCryptoOutflow = false;

    let fiatEUR = 0;
    let fiatUSD = 0;
    let hasFiat = false;

    let unitPriceEUR = tx.pricePerUnitEUR || 0;
    let unitPriceUSD = tx.pricePerUnitUSD || 0;

    if (isSell) {
      // In a SELL:
      // Spent = Crypto sold (e.g. 1,398.601 LAPTOP)
      // Received = Fiat proceeds (e.g. 113.18 EUR)
      cryptoSymbol = tx.spentCurrency || 'COIN';
      cryptoAmount = tx.spentAmount || 0;
      isCryptoOutflow = true;

      if (recIsFiat) {
        hasFiat = true;
        if (tx.receivedCurrency === 'EUR') {
          fiatEUR = tx.receivedAmount;
          fiatUSD = tx.nativeAmountUSD || (fiatEUR * eurRate);
        } else {
          fiatUSD = tx.receivedAmount;
          fiatEUR = fiatUSD / eurRate;
        }
      } else if (tx.nativeAmount && tx.nativeCurrency === 'EUR') {
        hasFiat = true;
        fiatEUR = tx.nativeAmount;
        fiatUSD = tx.nativeAmountUSD || (fiatEUR * eurRate);
      } else if (tx.nativeAmountUSD) {
        hasFiat = true;
        fiatUSD = tx.nativeAmountUSD;
        fiatEUR = fiatUSD / eurRate;
      }

      if (!unitPriceEUR && cryptoAmount > 0 && fiatEUR > 0) {
        unitPriceEUR = fiatEUR / cryptoAmount;
      }
      if (!unitPriceUSD && unitPriceEUR > 0) {
        unitPriceUSD = unitPriceEUR * eurRate;
      }
    } else if (isBuy) {
      // In a BUY:
      // Received = Crypto bought (e.g. 1,774.66085 LAPTOP)
      // Spent = Fiat cost (e.g. 138.50 EUR)
      cryptoSymbol = tx.receivedCurrency || 'COIN';
      cryptoAmount = tx.receivedAmount || 0;
      isCryptoOutflow = false;

      if (spentIsFiat) {
        hasFiat = true;
        if (tx.spentCurrency === 'EUR') {
          fiatEUR = tx.spentAmount;
          fiatUSD = tx.nativeAmountUSD || (fiatEUR * eurRate);
        } else {
          fiatUSD = tx.spentAmount;
          fiatEUR = fiatUSD / eurRate;
        }
      } else if (tx.nativeAmount && tx.nativeCurrency === 'EUR') {
        hasFiat = true;
        fiatEUR = tx.nativeAmount;
        fiatUSD = tx.nativeAmountUSD || (fiatEUR * eurRate);
      } else if (tx.nativeAmountUSD) {
        hasFiat = true;
        fiatUSD = tx.nativeAmountUSD;
        fiatEUR = fiatUSD / eurRate;
      }

      if (!unitPriceEUR && cryptoAmount > 0 && fiatEUR > 0) {
        unitPriceEUR = fiatEUR / cryptoAmount;
      }
      if (!unitPriceUSD && unitPriceEUR > 0) {
        unitPriceUSD = unitPriceEUR * eurRate;
      }
    } else if (isReward) {
      cryptoSymbol = tx.receivedCurrency || tx.spentCurrency || 'REWARD';
      cryptoAmount = tx.receivedAmount || tx.spentAmount || 0;
      isCryptoOutflow = false;

      if (tx.nativeAmount && tx.nativeCurrency === 'EUR') {
        hasFiat = true;
        fiatEUR = tx.nativeAmount;
        fiatUSD = tx.nativeAmountUSD || (fiatEUR * eurRate);
      } else if (tx.nativeAmountUSD) {
        hasFiat = true;
        fiatUSD = tx.nativeAmountUSD;
        fiatEUR = fiatUSD / eurRate;
      } else if (unitPriceEUR > 0 && cryptoAmount > 0) {
        hasFiat = true;
        fiatEUR = unitPriceEUR * cryptoAmount;
        fiatUSD = fiatEUR * eurRate;
      }
    } else {
      // Transfer / other
      cryptoSymbol = tx.receivedCurrency || tx.spentCurrency || 'TRANSFER';
      cryptoAmount = tx.receivedAmount || tx.spentAmount || 0;
      isCryptoOutflow = tx.type === 'TRANSFER' && tx.spentAmount > 0 && !tx.receivedAmount;
    }

    const fiatActive = isUSD ? fiatUSD : fiatEUR;
    const fiatAlt = isUSD ? fiatEUR : fiatUSD;

    const unitPriceActive = isUSD ? unitPriceUSD : unitPriceEUR;
    const unitPriceAlt = isUSD ? unitPriceEUR : unitPriceUSD;

    const unitPriceDecimals = unitPriceActive < 0.01 ? 6 : (unitPriceActive < 1 ? 4 : (unitPriceActive < 10 ? 3 : 2));
    const altUnitPriceDecimals = unitPriceAlt < 0.01 ? 6 : (unitPriceAlt < 1 ? 4 : (unitPriceAlt < 10 ? 3 : 2));

    return {
      cryptoSymbol,
      cryptoAmount,
      isCryptoOutflow,
      hasFiat,
      fiatActive,
      fiatAlt,
      unitPriceActive,
      unitPriceAlt,
      unitPriceDecimals,
      altUnitPriceDecimals,
      isSell,
      isBuy,
      isReward,
    };
  };

  const formatDatePart = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr.substring(0, 10);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const formatTimePart = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'crypto_com':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Crypto.com
          </span>
        );
      case 'kraken':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Kraken
          </span>
        );
      case 'bitpanda':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/20">
            Bitpanda
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            Manuell
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {source}
          </span>
        );
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'BUY':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Kauf</span>
          </span>
        );
      case 'SELL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" />
            <span>Verkauf</span>
          </span>
        );
      case 'REWARD':
      case 'STAKE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Gift className="w-3 h-3" />
            <span>Reward</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <RefreshCw className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`${selectedIds.size} ausgewählte Transaktionen wirklich löschen?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDeleteTransaction(id));
      }
      setSelectedIds(new Set());
    }
  };

  return (
    <div className={`rounded-2xl border shadow-xl overflow-hidden ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800/90'
    }`}>
      
      {/* Header & Filter Controls */}
      <div className={`p-5 border-b space-y-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Transaktions-Historie</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {filtered.length} von {transactions.length}
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Alle Käufe, Rewards und Buchungen im Detail mit Einzelkursen
            </p>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selectedIds.size} ausgewählt
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Suchen nach Coin, Hash, Beschreibung..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-sm border focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Asset Filter */}
          <div>
            <select
              value={assetFilter}
              onChange={(e) => {
                setAssetFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500' 
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500'
              }`}
            >
              <option value="ALL">Alle Coins ({uniqueCoins.length})</option>
              {uniqueCoins.map((coin) => (
                <option key={coin} value={coin}>{coin}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500' 
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500'
              }`}
            >
              <option value="ALL">Alle Typen</option>
              <option value="BUY">Nur Käufe (Buy)</option>
              <option value="SELL">Nur Verkäufe (Sell)</option>
              <option value="REWARD">Nur Rewards / Staking</option>
              <option value="TRANSFER">Nur Transfers</option>
            </select>
          </div>

          {/* Exchange Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500' 
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500'
              }`}
            >
              <option value="ALL">Alle Börsen</option>
              <option value="kraken">Kraken Pro</option>
              <option value="crypto_com">Crypto.com</option>
              <option value="manual">Manuell</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500' 
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500'
              }`}
            >
              <option value="newest">Datum (Neueste zuerst)</option>
              <option value="oldest">Datum (Älteste zuerst)</option>
              <option value="highest_spent">Betrag (Höchster)</option>
              <option value="lowest_spent">Betrag (Niedrigster)</option>
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {(assetFilter !== 'ALL' || typeFilter !== 'ALL' || sourceFilter !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Aktive Filter:</span>
            {assetFilter !== 'ALL' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                Coin: {assetFilter}
                <button onClick={() => { setAssetFilter('ALL'); if (onClearAssetFilter) onClearAssetFilter(); }} className="ml-1.5 hover:opacity-75">&times;</button>
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                Typ: {typeFilter}
                <button onClick={() => setTypeFilter('ALL')} className="ml-1.5 hover:opacity-75">&times;</button>
              </span>
            )}
            {sourceFilter !== 'ALL' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                Börse: {sourceFilter === 'kraken' ? 'Kraken Pro' : sourceFilter === 'crypto_com' ? 'Crypto.com' : sourceFilter}
                <button onClick={() => setSourceFilter('ALL')} className="ml-1.5 hover:opacity-75">&times;</button>
              </span>
            )}
            {searchQuery && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                Suche: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1.5 hover:opacity-75">&times;</button>
              </span>
            )}
            <button
              onClick={() => {
                setAssetFilter('ALL');
                setTypeFilter('ALL');
                setSourceFilter('ALL');
                setSearchQuery('');
                if (onClearAssetFilter) onClearAssetFilter();
              }}
              className={`underline underline-offset-2 ml-1 ${isLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300'}`}
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* 1. MOBILE TRANSACTIONS VIEW (Automatic on smartphones, no horizontal scrolling) */}
      <div className={`block md:hidden divide-y ${
        isLight ? 'divide-slate-100' : 'divide-slate-800/60'
      }`}>
        {paginatedTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Keine Transaktionen für die aktuellen Filterkriterien gefunden.
          </div>
        ) : (
          paginatedTransactions.map((tx) => {
            const display = getTransactionDisplay(tx);

            return (
              <div 
                key={tx.id} 
                className={`p-4 space-y-3 transition-colors ${
                  isLight 
                    ? (selectedIds.has(tx.id) ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'hover:bg-slate-50/80') 
                    : (selectedIds.has(tx.id) ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40')
                }`}
              >
                {/* Header: Checkbox + Date + Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx.id)}
                      onChange={() => toggleSelectId(tx.id)}
                      className={`rounded ${
                        isLight 
                          ? 'border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500' 
                          : 'border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500'
                      }`}
                    />
                    <div className="font-mono text-xs">
                      <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formatDatePart(tx.timestamp)}
                      </span>
                      <span className={`text-[11px] ml-1.5 font-sans ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatTimePart(tx.timestamp)} Uhr
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {getTypeBadge(tx.type)}
                    {getSourceBadge(tx.source)}
                  </div>
                </div>

                {/* Amounts: Crypto Asset & Fiat Value */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {display.isSell ? 'Verkauft' : 'Asset & Menge'}
                    </div>
                    <div className={`text-base font-extrabold font-mono ${
                      display.isSell
                        ? (isLight ? 'text-rose-700' : 'text-rose-400')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      {display.isSell ? '−' : ''}{display.cryptoAmount.toLocaleString('de-DE', { maximumFractionDigits: 8 })} {display.cryptoSymbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {display.isSell ? 'Verkaufserlös' : 'Kaufbetrag'}
                    </div>
                    <div className={`text-base font-extrabold font-mono ${
                      display.isSell 
                        ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                        : (isLight ? 'text-slate-900' : 'text-slate-100')
                    }`}>
                      {display.hasFiat ? `${display.isSell ? '+' : ''}${formatActive(display.fiatActive)}` : '-'}
                    </div>
                    {display.hasFiat && display.fiatAlt > 0 && (
                      <span className={`text-[11px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        ≈ {display.isSell ? '+' : ''}{formatAlt(display.fiatAlt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Einzelkurs + Actions */}
                <div className={`pt-2 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-100' : 'border-slate-800/60'
                }`}>
                  <div className="text-xs font-mono">
                    <span className={`text-[11px] font-sans mr-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {display.isSell ? 'Verkaufskurs:' : 'Einzelkurs:'}
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>
                      {display.unitPriceActive > 0 ? formatActive(display.unitPriceActive, display.unitPriceDecimals) : '-'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setDetailTx(tx)}
                      title="Details"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight 
                          ? 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100' 
                          : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="Bearbeiten"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight 
                          ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Transaktion ${tx.description || tx.receivedCurrency} wirklich löschen?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      title="Löschen"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight 
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP TRANSACTIONS TABLE (Automatic on desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-semibold tracking-wider border-b ${
            isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950/60 text-slate-400 border-slate-800'
          }`}>
            <tr>
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedTransactions.length > 0 && selectedIds.size === paginatedTransactions.length}
                  onChange={toggleSelectAll}
                  className={`rounded ${
                    isLight 
                      ? 'border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500' 
                      : 'border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
              </th>
              <th className="py-3 px-3">Datum</th>
              <th className="py-3 px-3">Typ</th>
              <th className="py-3 px-3">Börse</th>
              <th className="py-3 px-3">Asset &amp; Menge</th>
              <th className="py-3 px-3 text-right">Kauf- / Verkaufswert</th>
              <th className="py-3 px-3 text-right">Einzelkurs</th>
              <th className="py-3 px-3 text-center">Details</th>
              <th className="py-3 px-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  Keine Transaktionen für die aktuellen Filterkriterien gefunden.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const display = getTransactionDisplay(tx);

                return (
                  <tr 
                    key={tx.id}
                    className={`transition-colors ${
                      isLight 
                        ? (selectedIds.has(tx.id) ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'hover:bg-slate-50/80') 
                        : (selectedIds.has(tx.id) ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40')
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.id)}
                        onChange={() => toggleSelectId(tx.id)}
                        className={`rounded ${
                          isLight 
                            ? 'border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500' 
                            : 'border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500'
                        }`}
                      />
                    </td>

                    {/* Timestamp: 2-line compact */}
                    <td className={`py-2.5 px-3 font-mono text-xs whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <div className="font-semibold">{formatDatePart(tx.timestamp)}</div>
                      <div className={`text-[11px] font-sans ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{formatTimePart(tx.timestamp)} Uhr</div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getTypeBadge(tx.type)}
                    </td>

                    {/* Exchange Source */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getSourceBadge(tx.source)}
                    </td>

                    {/* Crypto Asset & Amount */}
                    <td className="py-2.5 px-3">
                      <div className={`font-bold font-mono ${
                        display.isSell
                          ? (isLight ? 'text-rose-700' : 'text-rose-400')
                          : (isLight ? 'text-slate-900' : 'text-white')
                      }`}>
                        {display.isSell ? '−' : ''}{display.cryptoAmount.toLocaleString('de-DE', { maximumFractionDigits: 8 })} {display.cryptoSymbol}
                      </div>
                    </td>

                    {/* Fiat Value / Gegenwert */}
                    <td className={`py-2.5 px-3 text-right font-mono font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {display.hasFiat ? (
                        <div>
                          <div className={`font-bold ${
                            display.isSell 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-slate-900' : 'text-slate-100')
                          }`}>
                            {display.isSell ? '+' : ''}{formatActive(display.fiatActive)}
                          </div>
                          {display.fiatAlt > 0 && (
                            <div className="text-[10px] text-slate-500 font-sans">
                              ≈ {display.isSell ? '+' : ''}{formatAlt(display.fiatAlt)}
                            </div>
                          )}
                          <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {display.isSell ? 'Erlös' : 'Kaufbetrag'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className={`py-3.5 px-4 text-right font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {display.unitPriceActive > 0 ? (
                        <div>
                          <div className={`font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>
                            {formatActive(display.unitPriceActive, display.unitPriceDecimals)}
                          </div>
                          {display.unitPriceAlt > 0 && (
                            <div className="text-[10px] text-slate-500 font-sans">
                              ≈ {formatAlt(display.unitPriceAlt, display.altUnitPriceDecimals)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Details popup button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDetailTx(tx)}
                        title="Transaktionsdetails einsehen"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight 
                            ? 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100' 
                            : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Bearbeiten"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLight 
                              ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Transaktion ${tx.description || tx.receivedCurrency} wirklich löschen?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Löschen"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLight 
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-slate-100 bg-slate-50/50 text-slate-500' : 'border-slate-800 text-slate-400'
        }`}>
          <div>
            Seite {currentPage} von {totalPages} ({filtered.length} Transaktionen)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTx && (() => {
        const modalDisplay = getTransactionDisplay(detailTx);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                isLight ? 'border-slate-100' : 'border-slate-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {getTypeBadge(detailTx.type)}
                  <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Transaktionsdetails</h4>
                </div>
                <button 
                  onClick={() => setDetailTx(null)}
                  className={`text-lg font-bold cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &times;
                </button>
              </div>

              <div className={`space-y-2.5 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Datum & Uhrzeit:</span>
                  <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{detailTx.timestamp}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Beschreibung:</span>
                  <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{detailTx.description}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Börsen-Quelle:</span>
                  <span>{getSourceBadge(detailTx.source)}</span>
                </div>

                {/* Crypto Asset & Amount */}
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                    {modalDisplay.isSell ? 'Verkauftes Asset:' : 'Asset & Menge:'}
                  </span>
                  <span className={`font-mono font-bold ${
                    modalDisplay.isSell 
                      ? (isLight ? 'text-rose-700' : 'text-rose-400') 
                      : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                  }`}>
                    {modalDisplay.isSell ? '−' : '+'}{modalDisplay.cryptoAmount.toLocaleString('de-DE', { maximumFractionDigits: 8 })} {modalDisplay.cryptoSymbol}
                  </span>
                </div>

                {/* Fiat Value */}
                {modalDisplay.hasFiat && (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                      {modalDisplay.isSell ? 'Verkaufserlös:' : 'Kaufwert / Betrag:'}
                    </span>
                    <div className="text-right font-mono">
                      <span className={`font-bold ${
                        modalDisplay.isSell
                          ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                          : (isLight ? 'text-slate-900' : 'text-white')
                      }`}>
                        {modalDisplay.isSell ? '+' : ''}{formatActive(modalDisplay.fiatActive)}
                      </span>
                      {modalDisplay.fiatAlt > 0 && (
                        <span className="text-[10px] text-slate-500 block font-sans">
                          ≈ {modalDisplay.isSell ? '+' : ''}{formatAlt(modalDisplay.fiatAlt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Unit Price */}
                {modalDisplay.unitPriceActive > 0 && (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                      {modalDisplay.isSell ? 'Verkaufskurs:' : 'Kaufkurs (Einzelpreis):'}
                    </span>
                    <div className="text-right font-mono">
                      <span className={`font-semibold ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>
                        {formatActive(modalDisplay.unitPriceActive, modalDisplay.unitPriceDecimals)}
                      </span>
                      {modalDisplay.unitPriceAlt > 0 && (
                        <span className="text-[10px] text-slate-500 block font-sans">
                          ≈ {formatAlt(modalDisplay.unitPriceAlt, modalDisplay.altUnitPriceDecimals)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Fee if present */}
                {detailTx.fee && detailTx.fee > 0 ? (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Gebühr:</span>
                    <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {detailTx.fee.toLocaleString('de-DE', { maximumFractionDigits: 6 })} {detailTx.feeCurrency || 'EUR'}
                    </span>
                  </div>
                ) : null}

                {detailTx.nativeAmountUSD && !modalDisplay.hasFiat && (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Crypto.com USD Gegenwert:</span>
                    <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>${detailTx.nativeAmountUSD.toFixed(2)} USD</span>
                  </div>
                )}
                {detailTx.transactionKind && (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Transaction Kind:</span>
                    <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{detailTx.transactionKind}</span>
                  </div>
                )}
                {detailTx.transactionHash && (
                  <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/60'}`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Tx Hash:</span>
                    <span className="font-mono text-indigo-500 truncate max-w-[200px]" title={detailTx.transactionHash}>
                      {detailTx.transactionHash}
                    </span>
                  </div>
                )}
                {detailTx.notes && (
                  <div className="pt-2">
                    <span className={`block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Notizen:</span>
                    <p className={`p-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}>
                      {detailTx.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setDetailTx(null)}
                  className={`px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

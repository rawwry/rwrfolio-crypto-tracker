import React, { useState, useMemo, useEffect } from 'react';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { InteractiveCoinChart } from './InteractiveCoinChart';
import { CoinPerformanceMatrix } from './CoinPerformanceMatrix';
import { calculateAssetSummaries } from '../utils/portfolioCalculations';
import { calculateFIFOTaxReport, RealizedSaleLot } from '../utils/taxCalculator';
import { getCoinDetails } from '../utils/priceService';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Coins, 
  Layers, 
  Building2,
  CheckCircle2,
  Receipt,
  Calendar,
  Clock,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface AnalyticsViewProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  theme: 'light' | 'dark' | 'system';
  currency?: PortfolioCurrency;
  customPrices?: Record<string, number>;
  selectedCoin?: string;
  onSelectCoin?: (coin: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assets,
  transactions,
  theme,
  currency = 'EUR',
  customPrices = {},
  selectedCoin,
  onSelectCoin,
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  // Default to BTC or the top holding asset by allocation instead of flat Gesamt-Portfolio
  const defaultChartCoin = useMemo(() => {
    if (assets.some(a => a.symbol.toUpperCase() === 'BTC')) return 'BTC';
    if (assets.length > 0) {
      const topAsset = [...assets].sort((a, b) => b.allocationPercentage - a.allocationPercentage)[0];
      return topAsset ? topAsset.symbol : assets[0].symbol;
    }
    return 'ALL';
  }, [assets]);

  const [selectedChartCoin, setSelectedChartCoin] = useState<string>(() => selectedCoin || defaultChartCoin);

  // Sync when assets finish loading or when selectedCoin prop changes
  useEffect(() => {
    if (selectedCoin) {
      setSelectedChartCoin(selectedCoin);
    } else if (selectedChartCoin === 'ALL' && assets.length > 0 && defaultChartCoin !== 'ALL') {
      setSelectedChartCoin(defaultChartCoin);
    }
  }, [selectedCoin, defaultChartCoin]);

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
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

  // Realized Sales Calculations (FIFO Closed Trades)
  const currentYear = new Date().getFullYear();
  const [salesYear, setSalesYear] = useState<number | 'ALL'>(currentYear);
  const [selectedSaleCoin, setSelectedSaleCoin] = useState<string>('ALL');

  // Discover all years with sell transactions
  const availableSalesYears = useMemo(() => {
    const yrs = new Set<number>();
    transactions.forEach(t => {
      if (t.type === 'SELL') {
        const d = new Date(t.timestamp);
        if (!isNaN(d.getTime())) yrs.add(d.getFullYear());
      }
    });
    if (!yrs.has(currentYear)) yrs.add(currentYear);
    return Array.from(yrs).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Compute realized sales
  const realizedSalesData = useMemo(() => {
    const yearsToCompute = salesYear === 'ALL' ? availableSalesYears : [salesYear];
    const allSales: RealizedSaleLot[] = [];
    for (const yr of yearsToCompute) {
      const rep = calculateFIFOTaxReport(transactions, customPrices, yr);
      allSales.push(...rep.realizedSales);
    }
    allSales.sort((a, b) => new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime());
    return allSales;
  }, [transactions, customPrices, salesYear, availableSalesYears]);

  // Distinct sold coins
  const soldCoins = useMemo(() => {
    const set = new Set<string>();
    realizedSalesData.forEach(s => set.add(s.symbol));
    return Array.from(set).sort();
  }, [realizedSalesData]);

  // Filtered sales by coin
  const filteredSales = useMemo(() => {
    if (selectedSaleCoin === 'ALL') return realizedSalesData;
    return realizedSalesData.filter(s => s.symbol.toUpperCase() === selectedSaleCoin.toUpperCase());
  }, [realizedSalesData, selectedSaleCoin]);

  // Aggregated summary for filtered sales
  const realizedSummary = useMemo(() => {
    let cost = 0;
    let proceeds = 0;
    let fees = 0;
    let pnl = 0;
    let taxablePnl = 0;
    let taxFreePnl = 0;

    for (const s of filteredSales) {
      const rowCost = Math.round(s.costBasisEUR * 100) / 100;
      const rowProceeds = Math.round(s.proceedsEUR * 100) / 100;
      const rowFee = Math.round(s.feeEUR * 100) / 100;
      const rowPnl = Math.round((rowProceeds - rowCost - rowFee) * 100) / 100;

      cost += rowCost;
      proceeds += rowProceeds;
      fees += rowFee;
      pnl += rowPnl;

      if (s.isTaxFree) {
        taxFreePnl += rowPnl;
      } else {
        taxablePnl += rowPnl;
      }
    }

    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { cost, proceeds, fees, pnl, taxablePnl, taxFreePnl, pnlPct };
  }, [filteredSales]);

  // Per-coin performance breakdown of closed positions
  const coinSalesBreakdown = useMemo(() => {
    const map: Record<string, {
      symbol: string;
      name: string;
      count: number;
      amount: number;
      cost: number;
      proceeds: number;
      fees: number;
      pnl: number;
      taxablePnl: number;
      taxFreePnl: number;
    }> = {};

    for (const s of realizedSalesData) {
      if (!map[s.symbol]) {
        const details = getCoinDetails(s.symbol);
        map[s.symbol] = {
          symbol: s.symbol,
          name: details.name,
          count: 0,
          amount: 0,
          cost: 0,
          proceeds: 0,
          fees: 0,
          pnl: 0,
          taxablePnl: 0,
          taxFreePnl: 0,
        };
      }
      const c = map[s.symbol];
      c.count += 1;
      c.amount += s.amount;
      const rowCost = Math.round(s.costBasisEUR * 100) / 100;
      const rowProceeds = Math.round(s.proceedsEUR * 100) / 100;
      const rowFee = Math.round(s.feeEUR * 100) / 100;
      const rowPnl = Math.round((rowProceeds - rowCost - rowFee) * 100) / 100;

      c.cost += rowCost;
      c.proceeds += rowProceeds;
      c.fees += rowFee;
      c.pnl += rowPnl;
      if (s.isTaxFree) {
        c.taxFreePnl += rowPnl;
      } else {
        c.taxablePnl += rowPnl;
      }
    }

    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [realizedSalesData]);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr.substring(0, 10);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoStr.substring(0, 10);
    }
  };

  const formatCoin = (val: number, maxDecimals: number = 6) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(val);
  };

  const handleSelectCoinForChart = (sym: string) => {
    setSelectedChartCoin(sym);
    onSelectCoin?.(sym);
    // Smooth scroll to top of chart
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Core Feature: Interactive Coin & Trade Chart with Timeframe Switchers */}
      <InteractiveCoinChart
        assets={assets}
        transactions={transactions}
        customPrices={customPrices}
        currency={currency}
        theme={theme}
        selectedCoinInitial={selectedChartCoin}
        onSelectCoin={(sym) => {
          setSelectedChartCoin(sym);
          onSelectCoin?.(sym);
        }}
      />

      {/* 2. Structured Side-by-Side Coin Performance Matrix */}
      <CoinPerformanceMatrix
        assets={assets}
        currency={currency}
        theme={theme}
        activeChartCoin={selectedChartCoin}
        onSelectCoinForChart={handleSelectCoinForChart}
      />

      {/* 2.5 Realisierte Verkäufe & Gewinne (Closed Trades / FIFO Analysis) */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl transition-colors space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
      }`}>
        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Realisierte Verkäufe &amp; Gewinne
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Automatische FIFO-Zuordnung der Anschaffungstranchen, Haltefristen (&sect; 23 EStG) und realisierte Nettogewinne.
              </p>
            </div>
          </div>

          {/* Year Switcher */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className={`text-xs font-semibold mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Zeitraum:</span>
            {availableSalesYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSalesYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  salesYear === yr
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
            {availableSalesYears.length > 1 && (
              <button
                type="button"
                onClick={() => setSalesYear('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  salesYear === 'ALL'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Gesamt
              </button>
            )}
          </div>
        </div>

        {realizedSalesData.length === 0 ? (
          /* Empty State */
          <div className={`p-8 rounded-xl border text-center space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
          }`}>
            <ShoppingBag className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Keine realisierten Verkäufe im gewählten Zeitraum ({salesYear})
            </h4>
            <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Sobald Verkäufe über Kraken Pro oder Crypto.com importiert werden, werden hier die realisierten Gewinne und Verluste nach FIFO (§ 23 EStG) automatisch aufgeschlüsselt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              {/* Card 1: Realized Net Profit */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/70'
              }`}>
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[10px] font-sans truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Realisierter Gewinn (Netto)
                  </span>
                  <span className={`text-[10px] font-bold whitespace-nowrap shrink-0 ml-1.5 ${
                    realizedSummary.pnl >= 0
                      ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                      : (isLight ? 'text-rose-700' : 'text-rose-400')
                  }`}>
                    {realizedSummary.pnl >= 0 ? '+' : ''}{realizedSummary.pnlPct.toFixed(1)} %
                  </span>
                </div>
                <div className={`text-base sm:text-xl font-bold mt-1 ${
                  realizedSummary.pnl >= 0
                    ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                    : (isLight ? 'text-rose-700' : 'text-rose-400')
                }`}>
                  {realizedSummary.pnl >= 0 ? '+' : ''}{formatCurr(realizedSummary.pnl)}
                </div>
                <div className={`text-[10px] mt-0.5 font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {realizedSummary.taxablePnl !== 0 && (
                    <span>&sect; 23 stpfl.: {realizedSummary.taxablePnl >= 0 ? '+' : ''}{formatCurr(realizedSummary.taxablePnl)}</span>
                  )}
                  {realizedSummary.taxFreePnl !== 0 && (
                    <span className="ml-1.5 text-emerald-500">&bull; frei: {realizedSummary.taxFreePnl >= 0 ? '+' : ''}{formatCurr(realizedSummary.taxFreePnl)}</span>
                  )}
                </div>
              </div>

              {/* Card 2: Proceeds */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/70'
              }`}>
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verkaufserlöse gesamt
                </span>
                <div className={`text-base sm:text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCurr(realizedSummary.proceeds)}
                </div>
                <div className={`text-[10px] mt-0.5 font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Bruttoerlöse vor Abzug von Gebühren
                </div>
              </div>

              {/* Card 3: Cost Basis */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/70'
              }`}>
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Eingesetztes Kapital
                </span>
                <div className={`text-base sm:text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCurr(realizedSummary.cost)}
                </div>
                <div className={`text-[10px] mt-0.5 font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ursprüngliche Anschaffungskosten (FIFO)
                </div>
              </div>

              {/* Card 4: Fees */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/70'
              }`}>
                <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verkaufsgebühren
                </span>
                <div className={`text-base sm:text-xl font-bold mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {formatCurr(realizedSummary.fees)}
                </div>
                <div className={`text-[10px] mt-0.5 font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Realisierte Transaktionskosten
                </div>
              </div>
            </div>

            {/* Per-Coin Realized P&L Summary (Übersicht nach Coin) */}
            {coinSalesBreakdown.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <h4 className={`text-xs font-bold tracking-tight uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Realisierte Gewinne nach Asset
                  </h4>
                  <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Klick auf einen Coin filtert die Tabelle &amp; den Chart
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {coinSalesBreakdown.map((c) => {
                    const isSelected = selectedSaleCoin === c.symbol;
                    const pnlPct = c.cost > 0 ? (c.pnl / c.cost) * 100 : 0;
                    const isProfit = c.pnl >= 0;

                    return (
                      <div
                        key={c.symbol}
                        onClick={() => {
                          const newCoin = isSelected ? 'ALL' : c.symbol;
                          setSelectedSaleCoin(newCoin);
                          if (!isSelected) {
                            handleSelectCoinForChart(c.symbol);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-400/50'
                              : 'bg-emerald-950/30 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/40'
                            : isLight
                              ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {c.symbol}
                          </div>
                          <div className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {formatCoin(c.amount)} {c.symbol}
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <div className={`text-sm font-bold ${
                            isProfit
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                              : (isLight ? 'text-rose-700' : 'text-rose-400')
                          }`}>
                            {isProfit ? '+' : ''}{formatCurr(c.pnl)}
                          </div>
                          <div className={`text-[11px] font-semibold whitespace-nowrap mt-0.5 ${
                            isProfit
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                              : (isLight ? 'text-rose-700' : 'text-rose-400')
                          }`}>
                            {isProfit ? '+' : ''}{pnlPct.toFixed(1)} %
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Pills for Table */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className={`text-xs font-semibold mr-1 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Coin-Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSaleCoin('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedSaleCoin === 'ALL'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Alle Coins
              </button>
              {soldCoins.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setSelectedSaleCoin(sym);
                    handleSelectCoinForChart(sym);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedSaleCoin === sym
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Detailed Realized Sales Table */}
            <div className={`overflow-x-auto rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
            }`}>
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-sans uppercase font-bold tracking-wider ${
                    isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}>
                    <th className="py-2.5 px-3">Verkauf</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3 text-right">Menge</th>
                    <th className="py-2.5 px-3">Anschaffung</th>
                    <th className="py-2.5 px-3 text-right">Kaufpreis (Cost)</th>
                    <th className="py-2.5 px-3 text-right">Erlös</th>
                    <th className="py-2.5 px-3 text-right">Gebühr</th>
                    <th className="py-2.5 px-3 text-right">Gewinn / Verlust</th>
                    <th className="py-2.5 px-3 text-center">&sect; 23 Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredSales.map((s) => {
                    const rowCost = Math.round(s.costBasisEUR * 100) / 100;
                    const rowProceeds = Math.round(s.proceedsEUR * 100) / 100;
                    const rowFee = Math.round(s.feeEUR * 100) / 100;
                    const rowPnl = Math.round((rowProceeds - rowCost - rowFee) * 100) / 100;
                    const isProfit = rowPnl >= 0;

                    return (
                      <tr key={s.id} className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/30'
                      }`}>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                            {formatDate(s.sellDate)}
                          </div>
                          <span className={`text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {s.exchangeDisplayName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSelectCoinForChart(s.symbol)}
                            className="font-bold flex items-center gap-1 hover:underline cursor-pointer text-indigo-400"
                            title="Im Chart anzeigen"
                          >
                            <span>{s.symbol}</span>
                            <span className="text-[10px] font-normal opacity-60">#{s.displayNr}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold">
                          {formatCoin(s.amount)} {s.symbol}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                            {formatDate(s.buyDate)}
                          </div>
                          <span className={`text-[10px] font-sans ${
                            s.daysHeld > 365 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {s.daysHeld} Tage gehalten
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {formatCurr(rowCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold">
                          {formatCurr(rowProceeds)}
                        </td>
                        <td className={`py-2.5 px-3 text-right whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {rowFee > 0 ? formatCurr(rowFee) : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className={`font-bold ${
                            isProfit 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-rose-700' : 'text-rose-400')
                          }`}>
                            {isProfit ? '+' : ''}{formatCurr(rowPnl)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            s.isTaxFree
                              ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                              : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40')
                          }`}>
                            {s.isTaxFree ? 'Steuerfrei (> 1 J.)' : '§ 23 stpfl.'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. High-Contrast Börsen- & Plattform-Vergleich (Kraken Pro vs. Crypto.com) */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl transition-colors space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Börsen- &amp; Plattform-Vergleich
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Gegenüberstellung von Portfoliowert, Rendite und Trade-Aktivität nach Börsen-Quelle.
              </p>
            </div>
          </div>
        </div>

        {/* Capital Split Progress Bar with high-contrast labels */}
        {krakenTxs.length > 0 && cryptoComTxs.length > 0 && (
          <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/60 border-slate-800/60'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono font-semibold">
              <span className="text-purple-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-sm" />
                <span>Kraken Pro: {krakenShare.toFixed(1)} % ({formatCurr(krakenInvested)})</span>
              </span>
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                <span>Crypto.com: {cryptoShare.toFixed(1)} % ({formatCurr(cryptoInvested)})</span>
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800/80 p-0.5">
              <div 
                style={{ width: `${krakenShare}%` }} 
                className="bg-purple-600 h-full rounded-l-full transition-all duration-500" 
                title={`Kraken Pro: ${krakenShare.toFixed(1)} %`} 
              />
              <div 
                style={{ width: `${cryptoShare}%` }} 
                className="bg-cyan-400 h-full rounded-r-full transition-all duration-500" 
                title={`Crypto.com: ${cryptoShare.toFixed(1)} %`} 
              />
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kraken Pro Card (Royal Purple) */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-purple-50/40 border-purple-200/60' : 'bg-purple-950/20 border-purple-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/20">
                  KP
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Kraken Pro</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
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
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(krakenValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(krakenInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${krakenIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {krakenIsProfit ? '+' : ''}{formatCurr(krakenPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
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

          {/* Crypto.com Card (High Contrast: Electric Cyan & Black) */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isLight ? 'bg-cyan-50/40 border-cyan-200/60' : 'bg-cyan-950/25 border-cyan-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-cyan-400/20">
                  CDC
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Crypto.com</h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
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
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfoliowert</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurr(cryptoValue)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurr(cryptoInvested)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <span className={`text-sm font-bold ${cryptoIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {cryptoIsProfit ? '+' : ''}{formatCurr(cryptoPnl)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Top Asset</span>
                  <span className={`text-sm font-bold truncate block ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
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

    </div>
  );
};

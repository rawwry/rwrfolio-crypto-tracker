import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Info,
  DollarSign,
  PieChart
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { calculateFIFOTaxReport, exportTaxReportToCSV, PortfolioTaxReport } from '../utils/taxCalculator';
import { exportTaxReportToPDF } from '../utils/taxPdfExport';
import { getCoinDetails } from '../utils/priceService';

interface TaxViewProps {
  transactions: Transaction[];
  customPrices: Record<string, number>;
  theme: 'light' | 'dark' | 'system';
  userProfile?: UserProfile;
}

export const TaxView: React.FC<TaxViewProps> = ({
  transactions,
  customPrices,
  theme,
  userProfile,
}) => {
  const isLight = theme === 'light';
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [unlockPage, setUnlockPage] = useState<number>(0);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const taxReport = useMemo<PortfolioTaxReport>(() => {
    return calculateFIFOTaxReport(transactions, customPrices, selectedYear);
  }, [transactions, customPrices, selectedYear]);

  const handleExportTaxCSV = () => {
    const csv = exportTaxReportToCSV(taxReport, userProfile);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rwrfolio_steuerbericht_fifo_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTaxPDF = () => {
    exportTaxReportToPDF(taxReport, userProfile);
  };

  const exemptionProgress = Math.min(
    100,
    Math.max(0, (taxReport.realizedTaxableNetEUR / taxReport.germanExemptionLimitEUR) * 100)
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header with Year and Export Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Steuern &amp; Haltefristen (§ 23 EStG)
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Automatische 1-Jahres-Frist: Krypto-Bestände sind nach 365 Tagen Haltedauer zu 100 % steuerfrei.
            </p>
          </div>
        </div>

        {/* Compact Right Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* Year selector with properly positioned arrow */}
          <div className="flex items-center space-x-1.5">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Jahr:</span>
            <div className="relative inline-flex items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Steuerjahr auswählen"
                className={`appearance-none text-xs font-semibold pl-3 pr-7 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 shadow-sm' 
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear - 2}>{currentYear - 2}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              title="Steuerbericht exportieren"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportieren</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-30 p-1.5 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    handleExportTaxPDF();
                    setIsExportDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center space-x-2.5 transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-800 text-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div>
                    <div className="font-bold">PDF-Steuerbericht</div>
                    <div className="text-[10px] text-slate-400">Druckansicht mit FIFO-Listen</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportTaxCSV();
                    setIsExportDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center space-x-2.5 transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-800 text-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="font-bold">CSV-Tabelle</div>
                    <div className="text-[10px] text-slate-400">Excel-kompatible Rohdaten</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thematic Tax Summary Cards (Exactly 3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Tax-Free Holdings (> 1 Year) */}
        <div className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between space-y-2 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Steuerfreier Bestand (&gt; 1 Jahr)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-500 font-mono">
            {taxReport.totalTaxFreeValueEUR.toFixed(2)} €
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Anteil am Gesamtbestand</span>
              <span className="font-bold text-emerald-500">{taxReport.taxFreePercentage.toFixed(1)} %</span>
            </div>
            <div className="w-full bg-slate-700/20 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${taxReport.taxFreePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Still Taxable (< 1 Year) */}
        <div className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between space-y-2 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Coins in Haltefrist
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-500 font-mono">
            {taxReport.totalTaxableValueEUR.toFixed(2)} €
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {taxReport.upcomingTaxFreeLots.length} Kauf-Tranche(n) werden sukzessive nach 365 Tagen steuerfrei.
          </p>
        </div>

        {/* Card 3: Realized Profits & Exemption Limit */}
        <div className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between space-y-2 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Realisierter Gewinn {selectedYear}
            </span>
            <span className={`p-1.5 rounded-lg ${taxReport.exemptionExceeded ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-extrabold font-mono ${taxReport.realizedTaxableNetEUR > 0 ? (taxReport.exemptionExceeded ? 'text-rose-500' : 'text-emerald-500') : (isLight ? 'text-slate-800' : 'text-slate-200')}`}>
            {taxReport.realizedTaxableNetEUR.toFixed(2)} €
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Freigrenze: {taxReport.germanExemptionLimitEUR} €</span>
              <span className={`font-bold text-xs ${taxReport.exemptionExceeded ? 'text-rose-500' : 'text-emerald-500'}`}>
                {taxReport.exemptionExceeded ? 'Steuerpflichtig' : 'Steuerfrei'}
              </span>
            </div>
            <div className="w-full bg-slate-700/20 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${taxReport.exemptionExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, exemptionProgress)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Asset-by-Asset Holding Status */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/80 bg-slate-950/40'
        }`}>
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Coin Haltedauern &amp; FIFO Bestände
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detaillierte Aufteilung aller Positionen nach steuerfreiem (&gt; 365 Tage) und steuerpflichtigem Anteil.
            </p>
          </div>
        </div>

        {taxReport.assets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Keine aktiven Bestände vorhanden. Importiere eine CSV oder erfasse Transaktionen, um die Haltedauer-Analyse zu sehen.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {taxReport.assets.map((asset) => {
              const details = getCoinDetails(asset.symbol);
              const isExpanded = expandedAsset === asset.symbol;

              return (
                <div key={asset.symbol} className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                    {/* Left: Asset info (fixed 4 columns) */}
                    <div className="md:col-span-4 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.symbol}</span>
                        <span className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{asset.name}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 truncate mt-0.5">
                        Gesamt: {asset.totalBalance.toFixed(4)} {asset.symbol} &bull; Wert: {asset.totalCurrentValueEUR.toFixed(2)} €
                      </div>
                    </div>

                    {/* Center: Progress visual (fixed 5 columns, perfectly aligned across all rows) */}
                    <div className="md:col-span-5 w-full">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                        <span className="text-emerald-500 font-semibold">{asset.taxFreePercentage.toFixed(1)} % Steuerfrei</span>
                        <span className="text-amber-500 font-semibold">{(100 - asset.taxFreePercentage).toFixed(1)} % &lt; 1 Jahr</span>
                      </div>
                      <div className="w-full bg-slate-700/20 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-2 transition-all duration-300"
                          style={{ width: `${asset.taxFreePercentage}%` }}
                          title={`Steuerfrei: ${asset.taxFreeBalance.toFixed(6)} ${asset.symbol}`}
                        />
                        <div 
                          className="bg-amber-500 h-2 transition-all duration-300"
                          style={{ width: `${100 - asset.taxFreePercentage}%` }}
                          title={`Steuerpflichtig: ${asset.taxableBalance.toFixed(6)} ${asset.symbol}`}
                        />
                      </div>
                    </div>

                    {/* Right: Values & Expand button (fixed 3 columns) */}
                    <div className="md:col-span-3 flex items-center justify-between md:justify-end space-x-3">
                      <div className="text-right font-mono text-xs">
                        <div className="text-emerald-500 font-bold whitespace-nowrap">{asset.taxFreeValueEUR.toFixed(2)} € frei</div>
                        <div className="text-amber-500 whitespace-nowrap">{asset.taxableValueEUR.toFixed(2)} € Frist</div>
                      </div>

                      <button
                        onClick={() => setExpandedAsset(isExpanded ? null : asset.symbol)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex-shrink-0 ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="Einzelne Kauf-Tranchen anzeigen"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Purchase Lots */}
                  {isExpanded && (
                    <div className={`mt-3 p-3 rounded-xl border text-xs font-mono space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}>
                      <div className="font-sans font-bold text-xs text-slate-500 mb-1">
                        Kauf-Tranchen (FIFO) für {asset.symbol}:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-slate-400 text-[10px] uppercase font-sans border-b border-slate-200 dark:border-slate-800">
                              <th className="pb-1">Kaufdatum</th>
                              <th className="pb-1">Menge</th>
                              <th className="pb-1">Kaufkurs</th>
                              <th className="pb-1">Investiert</th>
                              <th className="pb-1">Haltedauer</th>
                              <th className="pb-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40">
                            {asset.lots.map((lot, idx) => (
                              <tr key={idx} className="py-1">
                                <td className="py-1.5">{lot.buyDate.substring(0, 10)}</td>
                                <td className="py-1.5 font-bold">{lot.amount.toFixed(6)} {lot.symbol}</td>
                                <td className="py-1.5">{lot.costPerUnitEUR.toFixed(2)} €</td>
                                <td className="py-1.5">{lot.totalCostEUR.toFixed(2)} €</td>
                                <td className="py-1.5">{lot.daysHeld} Tage</td>
                                <td className="py-1.5">
                                  {lot.isTaxFree ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Steuerfrei</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-semibold">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>Frei am {lot.taxFreeDate} ({lot.daysRemainingToTaxFree} Tage)</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Tax-Free Unlocks & Realized Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Unlocks */}
        <div className={`p-5 rounded-2xl border transition-colors space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          {/* Header with Title, Count badge and Pagination Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Nächste Steuerfreigaben
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {taxReport.upcomingTaxFreeLots.length}
              </span>
            </div>

            {/* Pagination Controls */}
            {Math.ceil(taxReport.upcomingTaxFreeLots.length / 4) > 1 && (
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                <span className="text-[11px] text-slate-500 mr-0.5">
                  {unlockPage + 1} / {Math.ceil(taxReport.upcomingTaxFreeLots.length / 4)}
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockPage(p => Math.max(0, p - 1))}
                  disabled={unlockPage === 0}
                  className={`p-1 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Vorherige Seite"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setUnlockPage(p => Math.min(Math.ceil(taxReport.upcomingTaxFreeLots.length / 4) - 1, p + 1))}
                  disabled={unlockPage >= Math.ceil(taxReport.upcomingTaxFreeLots.length / 4) - 1}
                  className={`p-1 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Nächste Seite"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {taxReport.upcomingTaxFreeLots.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-500 font-semibold bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              🎉 100 % deiner aktuellen Bestände haben bereits die 1-Jahres-Frist überschritten und sind steuerfrei!
            </div>
          ) : (
            <div className="space-y-2.5">
              {taxReport.upcomingTaxFreeLots
                .slice(unlockPage * 4, (unlockPage + 1) * 4)
                .map((lot, i) => {
                  const heldDays = Math.max(0, Math.min(365, lot.daysHeld));
                  const progressPct = Math.min(100, Math.max(0, Math.round((heldDays / 365) * 100)));
                  const isVerySoon = lot.daysRemainingToTaxFree <= 30;

                  return (
                    <div 
                      key={lot.id || i}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        isLight 
                          ? 'bg-slate-50 hover:bg-slate-100/60 border-slate-200 shadow-sm' 
                          : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Top Row: Coin Symbol, Amount, EUR Value & Countdown Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-indigo-500 font-mono">
                            {lot.symbol}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            {lot.amount < 1 ? lot.amount.toFixed(4) : lot.amount.toLocaleString('de-DE', { maximumFractionDigits: 4 })}
                          </span>
                          {lot.currentValueEUR > 0 && (
                            <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                              &bull; {lot.currentValueEUR.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                            isVerySoon
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse'
                              : isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                          }`}>
                            in {lot.daysRemainingToTaxFree} {lot.daysRemainingToTaxFree === 1 ? 'Tag' : 'Tagen'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar of 365 Days Holding Period */}
                      <div className="space-y-1">
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <div 
                            style={{ width: `${progressPct}%` }}
                            className={`h-full transition-all duration-500 rounded-full ${
                              progressPct >= 90 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{heldDays} von 365 Tagen ({progressPct} %)</span>
                          <span>Frei am {lot.taxFreeDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Realized Sales in Year */}
        <div className={`p-5 rounded-2xl border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Realisierte Verkäufe {selectedYear} (FIFO)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {taxReport.realizedSales.length} Transaktionen
            </span>
          </div>

          {taxReport.realizedSales.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-500/5 rounded-xl border border-slate-500/10">
              Im Steuerjahr {selectedYear} wurden keine Verkäufe getätigt.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {taxReport.realizedSales.map((sale, i) => {
                const isGain = sale.realizedPnlEUR >= 0;
                return (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>{sale.symbol}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${sale.isTaxFree ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sale.isTaxFree ? 'Steuerfrei' : 'Steuerpflichtig'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Verkauf: {sale.sellDate.substring(0, 10)} &bull; {sale.daysHeld} Tage gehalten
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isGain ? '+' : ''}{sale.realizedPnlEUR.toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-slate-500">Erlös: {sale.proceedsEUR.toFixed(2)} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

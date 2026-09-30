import { PortfolioTaxReport } from './taxCalculator';
import { UserProfile, Transaction } from '../types';

export function exportTaxReportToPDF(
  report: PortfolioTaxReport,
  userProfile?: UserProfile,
  allTransactions?: Transaction[]
): void {
  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatEuro = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatCoin = (val: number, maxDecimals: number = 8) => {
    if (val === 0) return '0';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(val);
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr.substring(0, 10);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr.substring(0, 10);
    }
  };

  const statusText = report.isInterim
    ? `Zwischenstand ${report.reportDate}`
    : `Endstand 31.12.${report.taxYear}`;

  const fullName = userProfile?.fullName || userProfile?.username || 'Vor- und Nachname';
  const taxId = userProfile?.taxId || '__ ___ ___ ___';

  // --- 1. SECTION 1 BUILDERS ---
  const isNetProfit = report.realizedTaxableNetEUR >= 0;
  const isExceeded = report.exemptionExceeded;
  
  let sec23StatusText = '';
  if (report.realizedSalesCount === 0) {
    sec23StatusText = `Keine steuerpflichtigen Veräußerungsvorgänge im Veranlagungszeitraum ${report.taxYear} erfasst.`;
  } else if (report.realizedTaxableNetEUR > report.germanExemptionLimitEUR) {
    sec23StatusText = `Gesamtergebnis <strong>+${formatEuro(report.realizedTaxableNetEUR)}</strong> übersteigt die Freigrenze von <strong>${formatEuro(report.germanExemptionLimitEUR)}</strong> &rarr; <strong>voll steuerpflichtig</strong> nach persönlichem Einkommensteuersatz.`;
  } else if (report.realizedTaxableNetEUR >= 0) {
    sec23StatusText = `Gesamtergebnis <strong>+${formatEuro(report.realizedTaxableNetEUR)}</strong> liegt unter der Freigrenze von <strong>${formatEuro(report.germanExemptionLimitEUR)}</strong> &rarr; <strong>nicht steuerpflichtig</strong>, sofern keine weiteren privaten Veräußerungsgeschäfte (z. B. Gold, Kunst) im Jahr vorliegen.`;
  } else {
    sec23StatusText = `Gesamtergebnis <strong>${formatEuro(report.realizedTaxableNetEUR)}</strong> (Verlust) &rarr; verrechenbar mit Gewinnen aus privaten Veräußerungsgeschäften desselben Jahres oder vortrags-/rücktragsfähig (§ 23 Abs. 3 Satz 8 EStG).`;
  }

  let sec22StatusText = '';
  if (report.totalStakingRewardsEUR === 0) {
    sec22StatusText = `Keine Einkünfte nach § 22 Nr. 3 EStG im Veranlagungszeitraum ${report.taxYear} angefallen.`;
  } else if (report.totalStakingRewardsEUR < 256) {
    sec22StatusText = `Unter der Freigrenze von <strong>256,00 €</strong> &rarr; <strong>nicht steuerpflichtig</strong>, sofern keine weiteren Einkünfte nach § 22 Nr. 3 EStG vorliegen.`;
  } else {
    sec22StatusText = `Erreicht oder übersteigt die Freigrenze von <strong>256,00 €</strong> &rarr; <strong>voll steuerpflichtig</strong> als sonstige Einkünfte.`;
  }

  const exchangeSummaryRows = report.exchanges.map((ex) => `
    <tr>
      <td class="font-bold">${ex.displayName}</td>
      <td class="text-right font-mono">${ex.salesCount}</td>
      <td class="text-right font-mono ${ex.taxablePnlEUR > 0 ? 'text-success' : ex.taxablePnlEUR < 0 ? 'text-danger' : ''}">
        ${ex.taxablePnlEUR > 0 ? '+' : ''}${formatEuro(ex.taxablePnlEUR)}
      </td>
      <td class="text-right font-mono text-muted">
        ${ex.taxFreePnlEUR > 0 ? '+' : ''}${formatEuro(ex.taxFreePnlEUR)}
      </td>
      <td class="text-right font-mono">${formatEuro(ex.rewardsEUR)}</td>
      <td class="text-right font-mono">${ex.openTranchesCount}</td>
      <td class="text-right font-mono font-bold">${formatEuro(ex.currentValueEUR)}</td>
    </tr>
  `).join('');

  // --- 2. SECTION 2 BUILDERS (Einzelnachweis Veräußerungen) ---
  // Group sales by exchange
  const salesBySource: Record<string, typeof report.realizedSales> = {};
  for (const s of report.realizedSales) {
    if (!salesBySource[s.source]) salesBySource[s.source] = [];
    salesBySource[s.source].push(s);
  }

  let salesTableHtml = '';
  if (report.realizedSales.length === 0) {
    salesTableHtml = `
      <tr>
        <td colspan="11" class="text-center py-6 text-muted">
          Im Steuerjahr ${report.taxYear} wurden keine Krypto-Veräußerungen getätigt.
        </td>
      </tr>
    `;
  } else {
    for (const [source, list] of Object.entries(salesBySource)) {
      const exchangeName = list[0]?.exchangeDisplayName || source;
      
      // Subtotals for this exchange (taxable only)
      const taxableList = list.filter(l => !l.isTaxFree);
      const subCost = taxableList.reduce((acc, s) => acc + s.costBasisEUR, 0);
      const subProceeds = taxableList.reduce((acc, s) => acc + s.proceedsEUR, 0);
      const subFees = taxableList.reduce((acc, s) => acc + s.feeEUR, 0);
      const subPnl = taxableList.reduce((acc, s) => acc + s.realizedPnlEUR, 0);

      salesTableHtml += `
        <tr class="group-header">
          <td colspan="11"><strong>${exchangeName}</strong></td>
        </tr>
      `;

      for (const s of list) {
        const isGain = s.realizedPnlEUR >= 0;
        salesTableHtml += `
          <tr>
            <td class="font-mono text-muted">${s.displayNr}</td>
            <td class="font-mono">${formatDate(s.sellDate)}</td>
            <td class="font-mono">${formatDate(s.buyDate)}</td>
            <td class="text-right font-mono">${s.daysHeld}</td>
            <td class="font-bold">${s.symbol}</td>
            <td class="text-right font-mono">${formatCoin(s.amount)}</td>
            <td class="text-right font-mono">${formatEuro(s.costBasisEUR)}</td>
            <td class="text-right font-mono">${formatEuro(s.proceedsEUR)}</td>
            <td class="text-right font-mono text-muted">${s.feeEUR > 0 ? formatEuro(s.feeEUR) : '–'}</td>
            <td class="text-right font-mono font-bold ${isGain ? 'text-success' : 'text-danger'}">
              ${isGain ? '+' : ''}${formatEuro(s.realizedPnlEUR)}
            </td>
            <td class="text-center">
              <span class="badge ${s.isTaxFree ? 'badge-frei' : 'badge-stpfl'}">
                ${s.isTaxFree ? 'frei' : 'stpfl.'}
              </span>
            </td>
          </tr>
        `;
      }

      salesTableHtml += `
        <tr class="subtotal-row">
          <td colspan="6" class="text-muted italic">Zwischensumme ${exchangeName} – nur steuerpflichtige Vorgänge</td>
          <td class="text-right font-mono font-bold">${formatEuro(subCost)}</td>
          <td class="text-right font-mono font-bold">${formatEuro(subProceeds)}</td>
          <td class="text-right font-mono font-bold text-muted">${formatEuro(subFees)}</td>
          <td class="text-right font-mono font-bold ${subPnl >= 0 ? 'text-success' : 'text-danger'}">
            ${subPnl >= 0 ? '+' : ''}${formatEuro(subPnl)}
          </td>
          <td></td>
        </tr>
      `;
    }

    // Grand sum of taxable events
    salesTableHtml += `
      <tr class="grandtotal-row">
        <td colspan="6"><strong>Summe steuerpflichtige Vorgänge (&rarr; Anlage SO)</strong></td>
        <td class="text-right font-mono font-bold">${formatEuro(report.taxableCostBasisEUR)}</td>
        <td class="text-right font-mono font-bold">${formatEuro(report.taxableProceedsEUR)}</td>
        <td class="text-right font-mono font-bold text-muted">${formatEuro(report.taxableFeesEUR)}</td>
        <td class="text-right font-mono font-bold ${report.realizedTaxableNetEUR >= 0 ? 'text-success' : 'text-danger'}">
          ${report.realizedTaxableNetEUR >= 0 ? '+' : ''}${formatEuro(report.realizedTaxableNetEUR)}
        </td>
        <td></td>
      </tr>
    `;
  }

  // --- 3. SECTION 3 BUILDERS (Staking & Rewards) ---
  let rewardsTableHtml = '';
  if (report.rewards.length === 0) {
    rewardsTableHtml = `
      <tr>
        <td colspan="6" class="text-center py-5 text-muted">
          Im Steuerjahr ${report.taxYear} wurden keine Staking- oder Reward-Zuflüsse erfasst.
        </td>
      </tr>
    `;
  } else {
    for (const r of report.rewards) {
      rewardsTableHtml += `
        <tr>
          <td class="font-mono">${formatDate(r.date)}</td>
          <td>${r.exchangeDisplayName}</td>
          <td class="font-bold">${r.symbol}</td>
          <td>${r.kind}</td>
          <td class="text-right font-mono">${formatCoin(r.amount)}</td>
          <td class="text-right font-mono font-bold">${formatEuro(r.valueEUR)}</td>
        </tr>
      `;
    }
    rewardsTableHtml += `
      <tr class="grandtotal-row">
        <td colspan="5"><strong>Summe (&rarr; Anlage SO, Leistungen § 22 Nr. 3 EStG)</strong></td>
        <td class="text-right font-mono font-bold">${formatEuro(report.totalStakingRewardsEUR)}</td>
      </tr>
    `;
  }

  // --- 4. SECTION 4 BUILDERS (Bestand zum Stichtag) ---
  const distinctSources = report.exchanges.map(e => e.source);
  const showKrakenCol = distinctSources.includes('kraken') || true;
  const showCdcCol = distinctSources.includes('crypto_com') || true;

  const assetHoldingRows = report.assets.map((a) => {
    const krakenBal = a.balanceBySource['kraken'];
    const cdcBal = a.balanceBySource['crypto_com'];

    return `
      <tr>
        <td class="font-bold">${a.symbol}</td>
        <td>${a.name}</td>
        <td class="text-right font-mono">${formatCoin(a.totalBalance)}</td>
        ${showKrakenCol ? `<td class="text-right font-mono text-muted">${krakenBal ? formatCoin(krakenBal) : '–'}</td>` : ''}
        ${showCdcCol ? `<td class="text-right font-mono text-muted">${cdcBal ? formatCoin(cdcBal) : '–'}</td>` : ''}
        <td class="text-right font-mono text-success">${formatCoin(a.taxFreeBalance)}</td>
        <td class="text-center font-mono ${a.earliestTaxFreeDate === 'steuerfrei' ? 'text-success font-semibold' : ''}">
          ${a.earliestTaxFreeDate || '–'}
        </td>
        <td class="text-right font-mono font-bold">${formatEuro(a.totalCurrentValueEUR)}</td>
      </tr>
    `;
  }).join('');

  // --- 5. SECTION 5 BUILDERS (Anhang A: Offene Anschaffungstranchen) ---
  const tranchesBySource: Record<string, typeof report.openTranches> = {};
  for (const t of report.openTranches) {
    if (!tranchesBySource[t.source]) tranchesBySource[t.source] = [];
    tranchesBySource[t.source].push(t);
  }

  let tranchesTableHtml = '';
  if (report.openTranches.length === 0) {
    tranchesTableHtml = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          Keine offenen Anschaffungstranchen vorhanden.
        </td>
      </tr>
    `;
  } else {
    for (const [source, list] of Object.entries(tranchesBySource)) {
      const exchangeName = list[0]?.exchangeDisplayName || source;
      tranchesTableHtml += `
        <tr class="group-header">
          <td colspan="7"><strong>${exchangeName}</strong></td>
        </tr>
      `;

      for (const t of list) {
        tranchesTableHtml += `
          <tr>
            <td class="font-mono text-muted font-bold">${t.trancheId}</td>
            <td class="font-bold">${t.symbol}</td>
            <td class="font-mono">${formatDate(t.buyDate)}</td>
            <td class="text-right font-mono">${formatCoin(t.amount)}</td>
            <td class="text-right font-mono">${formatEuro(t.costBasisEUR)}</td>
            <td class="text-right font-mono">${t.daysHeld}</td>
            <td class="text-center font-mono">${t.taxFreeDate}</td>
          </tr>
        `;
      }
    }
  }

  // --- 6. ATTACHMENT BUILDERS (Anhang B & C: Belegnachweise der Börsen) ---
  const allTxs = (allTransactions && allTransactions.length > 0)
    ? allTransactions
    : (report.yearTransactions || []);

  // Filter all transactions for this exchange up to the end of the tax year
  const filterExchangeTxs = (source: string) => {
    return allTxs
      .filter(t => {
        const s = (t.source || '').toLowerCase();
        if (s !== source) return false;
        const d = new Date(t.timestamp);
        return !isNaN(d.getTime()) && d.getFullYear() <= report.taxYear;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const krakenTxs = filterExchangeTxs('kraken');
  const cryptoComTxs = filterExchangeTxs('crypto_com');

  const paginateRows = (txs: Transaction[], pageSize = 28) => {
    if (txs.length === 0) return [];
    const pages: Transaction[][] = [];
    for (let i = 0; i < txs.length; i += pageSize) {
      pages.push(txs.slice(i, i + pageSize));
    }
    return pages;
  };

  const krakenPages = paginateRows(krakenTxs, 28);
  const cdcPages = paginateRows(cryptoComTxs, 28);

  const totalPages = 4 + krakenPages.length + cdcPages.length;

  const buildBelegRows = (txs: Transaction[], startIndex = 0) => {
    return txs.map((tx, idx) => {
      const dt = new Date(tx.timestamp);
      const dateFormatted = !isNaN(dt.getTime()) ? formatDate(tx.timestamp) : tx.timestamp;
      const timeFormatted = !isNaN(dt.getTime()) ? dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
      
      let badgeClass = 'badge-secondary';
      let typeName = tx.type as string;
      if (tx.type === 'BUY') {
        badgeClass = 'badge-frei';
        typeName = 'Kauf';
      } else if (tx.type === 'SELL') {
        badgeClass = 'badge-stpfl';
        typeName = 'Verkauf';
      } else if (tx.type === 'REWARD' || tx.type === 'STAKE') {
        badgeClass = 'badge-info';
        typeName = 'Reward';
      } else if (tx.type === 'TRANSFER') {
        typeName = 'Transfer';
      }

      const recStr = tx.receivedAmount && tx.receivedAmount > 0 
        ? `${formatCoin(tx.receivedAmount)} ${tx.receivedCurrency}` 
        : '–';
      const spentStr = tx.spentAmount && tx.spentAmount > 0 
        ? (tx.spentCurrency === 'EUR' ? formatEuro(tx.spentAmount) : `${formatCoin(tx.spentAmount)} ${tx.spentCurrency}`)
        : '–';

      const txRef = tx.transactionHash || tx.id || '';
      const shortRef = txRef.length > 16 ? txRef.substring(0, 14) + '…' : txRef;

      return `
        <tr>
          <td class="font-mono text-muted">${startIndex + idx + 1}</td>
          <td class="font-mono">${dateFormatted} <span class="text-muted" style="font-size: 6.5pt;">${timeFormatted}</span></td>
          <td><span class="badge ${badgeClass}">${typeName}</span></td>
          <td class="text-right font-mono font-bold">${recStr}</td>
          <td class="text-right font-mono">${spentStr}</td>
          <td class="text-right font-mono">${tx.pricePerUnitEUR ? formatEuro(tx.pricePerUnitEUR) : '–'}</td>
          <td class="text-right font-mono text-muted">${tx.fee ? formatEuro(tx.fee) : '–'}</td>
          <td class="font-mono text-muted" style="font-size: 6.5pt;" title="${txRef}">${shortRef || '–'}</td>
        </tr>
      `;
    }).join('');
  };

  let runningPageCounter = 4;
  let krakenPagesHtml = '';
  if (krakenPages.length > 0) {
    krakenPagesHtml = krakenPages.map((pageTxs, pageIdx) => {
      runningPageCounter++;
      const currentGlobalPage = runningPageCounter;
      const rowsHtml = buildBelegRows(pageTxs, pageIdx * 28);
      const isMulti = krakenPages.length > 1;
      const pageTitleSuffix = isMulti ? ` &bull; Teil ${pageIdx + 1} von ${krakenPages.length}` : '';

      return `
  <!-- ==================== ANHANG B (Seite ${pageIdx + 1}) ==================== -->
  <div class="page page-break">
    <div>
      <div class="section-badge-header" style="margin-top: 8px; margin-bottom: 6px;">
        <span class="section-num">B</span>
        <h2>Anhang B &bull; Belegnachweis: Kraken Ledger-Export${pageTitleSuffix}</h2>
      </div>
      <div class="section-subtitle">
        Vollständiges Transaktions- und Buchungsprotokoll bis 31.12.${report.taxYear} &bull; Datenquelle: Kraken Import &bull; ${krakenTxs.length} Vorgänge gesamt
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 26px;">Nr.</th>
            <th>Datum &amp; Zeit</th>
            <th>Typ</th>
            <th class="text-right">Erhalten</th>
            <th class="text-right">Ausgegeben</th>
            <th class="text-right">Kurs €</th>
            <th class="text-right">Gebühr</th>
            <th>Transaktions-ID / Info</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; Kraken Ledger-Export</span>
      <span>Seite ${currentGlobalPage} von ${totalPages}</span>
    </div>
  </div>
      `;
    }).join('\n');
  }

  let cdcPagesHtml = '';
  if (cdcPages.length > 0) {
    cdcPagesHtml = cdcPages.map((pageTxs, pageIdx) => {
      runningPageCounter++;
      const currentGlobalPage = runningPageCounter;
      const rowsHtml = buildBelegRows(pageTxs, pageIdx * 28);
      const isMulti = cdcPages.length > 1;
      const pageTitleSuffix = isMulti ? ` &bull; Teil ${pageIdx + 1} von ${cdcPages.length}` : '';

      return `
  <!-- ==================== ANHANG C (Seite ${pageIdx + 1}) ==================== -->
  <div class="page page-break">
    <div>
      <div class="section-badge-header" style="margin-top: 8px; margin-bottom: 6px;">
        <span class="section-num">C</span>
        <h2>Anhang C &bull; Belegnachweis: Crypto.com Transaktionshistorie${pageTitleSuffix}</h2>
      </div>
      <div class="section-subtitle">
        Vollständiges Transaktions- und Buchungsprotokoll bis 31.12.${report.taxYear} &bull; Datenquelle: Crypto.com Import &bull; ${cryptoComTxs.length} Vorgänge gesamt
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 26px;">Nr.</th>
            <th>Datum &amp; Zeit</th>
            <th>Typ</th>
            <th class="text-right">Erhalten</th>
            <th class="text-right">Ausgegeben</th>
            <th class="text-right">Kurs €</th>
            <th class="text-right">Gebühr</th>
            <th>Transaktions-ID / Info</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; Crypto.com Transaktionshistorie</span>
      <span>Seite ${currentGlobalPage} von ${totalPages}</span>
    </div>
  </div>
      `;
    }).join('\n');
  }

  // --- HTML DOCUMENT TEMPLATE ---
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>rwrfolio_Steuerbericht_${report.taxYear}_FIFO</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.4;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Print Break Utilities */
    .page {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 270mm;
      padding-bottom: 8mm;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Running Page Footers */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      font-size: 7.5pt;
      color: #64748b;
      margin-top: auto;
    }

    /* Header Component */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header-pretitle {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 2px;
    }
    .header-title {
      font-size: 15pt;
      font-weight: 800;
      line-height: 1.2;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .header-cite {
      font-size: 7.5pt;
      color: #64748b;
    }
    .meta-box {
      font-size: 8pt;
      text-align: right;
      line-height: 1.5;
    }
    .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .meta-label {
      color: #64748b;
    }
    .meta-value {
      font-weight: 600;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* Warning / Info Banner */
    .banner {
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 8pt;
      line-height: 1.4;
      margin-bottom: 14px;
    }
    .banner-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    /* Section Headers & Badges */
    .section-badge-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .section-num {
      width: 22px;
      height: 22px;
      background: #0f172a;
      color: #ffffff;
      font-size: 8.5pt;
      font-weight: 800;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }
    .section-badge-header h2 {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .section-subtitle {
      font-size: 7.5pt;
      color: #64748b;
      margin: -2px 0 14px 32px;
      line-height: 1.35;
    }
    .section-divider {
      border-top: 1px solid #e2e8f0;
      margin: 28px 0 22px 0;
    }

    /* Section 1 Dual Cards */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1px;
    }
    .card-subtitle {
      font-size: 7.5pt;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 2.5px 0;
      font-size: 8pt;
    }
    .calc-total {
      font-weight: 800;
      font-size: 9pt;
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
      margin-top: 3px;
    }
    .note-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      margin-top: 8px;
      font-size: 7.5pt;
      color: #334155;
      line-height: 1.35;
    }
    .note-box-secondary {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.35;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 10px;
    }
    th {
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      padding: 4.5px 5px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #475569;
      text-align: left;
      white-space: nowrap;
      vertical-align: middle;
      line-height: 1.2;
    }
    td {
      padding: 3.5px 5px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .group-header td {
      background: #f1f5f9;
      font-size: 8pt;
      font-weight: 700;
      color: #0f172a;
      padding: 5px 6px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
    }
    .subtotal-row td {
      background: #fafafa;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 7.5pt;
    }
    .grandtotal-row td {
      background: #f8fafc;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-weight: 800;
      font-size: 8.5pt;
      padding: 5px 6px;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-frei {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-stpfl {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-info {
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
    .badge-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    /* Section 6 Two Columns */
    .cols-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 8px;
    }
    .col-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 8pt;
      margin-bottom: 6px;
      color: #1e293b;
    }
    .check-box {
      font-size: 9pt;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .methodology-item {
      font-size: 7.5pt;
      color: #334155;
      margin-bottom: 6px;
      line-height: 1.35;
    }
    .methodology-item strong {
      color: #0f172a;
    }

    .disclaimer-bar {
      margin-top: 14px;
      padding: 7px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 7.5pt;
      color: #64748b;
      font-style: italic;
      text-align: justify;
      line-height: 1.3;
    }

    /* Print Screen Helper Banner */
    @media screen {
      body {
        background: #0f172a;
        padding: 20px 0;
      }
      .screen-toolbar {
        max-width: 210mm;
        margin: 0 auto 15px auto;
        background: #1e293b;
        padding: 10px 16px;
        border-radius: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .print-btn {
        background: #4f46e5;
        color: #ffffff;
        border: none;
        padding: 7px 14px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        font-size: 12px;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 20px auto;
        padding: 16mm 14mm 14mm 14mm;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      }
    }
    @media print {
      .screen-toolbar {
        display: none !important;
      }
      body {
        background: #ffffff;
      }
      .page {
        width: 100%;
        min-height: 265mm;
        padding: 0;
        margin: 0;
      }
    }

    /* Utility Text Colors */
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .text-muted { color: #64748b; }
    .italic { font-style: italic; }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="screen-toolbar">
    <div>
      <strong>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear}</strong>
      <span style="opacity: 0.7; font-size: 11px; margin-left: 10px;">Druckversion / PDF-Export</span>
    </div>
    <button class="print-btn" onclick="window.print()">Drucken / Als PDF speichern</button>
  </div>

  <!-- ==================== SEITE 1 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header-container">
        <div>
          <div class="header-pretitle">STEUERBERICHT KRYPTOWERTE &bull; VERANLAGUNGSZEITRAUM ${report.taxYear}</div>
          <h1 class="header-title">Private Veräußerungsgeschäfte und<br>sonstige Einkünfte aus Kryptowerten</h1>
          <div class="header-cite">§ 23 Abs. 1 Satz 1 Nr. 2 EStG &bull; § 22 Nr. 3 EStG &bull; BMF-Schreiben vom 06.03.2025</div>
        </div>
        <div class="meta-box">
          <div class="meta-row"><span class="meta-label">Steuerpflichtige/r</span><span class="meta-value">${fullName}</span></div>
          <div class="meta-row"><span class="meta-label">Steuer-ID</span><span class="meta-value">${taxId}</span></div>
          <div class="meta-row"><span class="meta-label">Börsen</span><span class="meta-value">${report.exchangesList}</span></div>
          <div class="meta-row"><span class="meta-label">Zeitraum</span><span class="meta-value">01.01.${report.taxYear} &ndash; ${report.isInterim ? report.reportDate : '31.12.' + report.taxYear}</span></div>
          <div class="meta-row"><span class="meta-label">Methode</span><span class="meta-value">FIFO, je Börse getrennt</span></div>
          <div class="meta-row"><span class="meta-label">Erstellt</span><span class="meta-value">${currentDate}, ${currentTime} &bull; rwrfolio</span></div>
        </div>
      </div>

      <!-- Interim / Final Banner -->
      ${report.isInterim ? `
        <div class="banner banner-warning">
          <strong>Zwischenstand.</strong> Das Steuerjahr endet am 31.12.${report.taxYear}. Für die Steuererklärung den Bericht nach Jahresende erneut erzeugen.
        </div>
      ` : `
        <div class="banner banner-warning" style="background:#f0fdf4; border-color:#bbf7d0; color:#166534;">
          <strong>Endstand.</strong> Veranlagungszeitraum ${report.taxYear} abgeschlossen.
        </div>
      `}

      <!-- SECTION 1: Übersicht für die Anlage SO -->
      <div class="section-badge-header">
        <span class="section-num">1</span>
        <h2>Übersicht für die Anlage SO</h2>
      </div>

      <div class="cards-grid">
        <!-- Card 1: § 23 EStG -->
        <div class="card">
          <div class="card-title">Private Veräußerungsgeschäfte &bull; § 23 EStG</div>
          <div class="card-subtitle">Andere Wirtschaftsgüter &ndash; nur Vorgänge mit Haltedauer &le; 1 Jahr</div>

          <div class="calc-row">
            <span>Veräußerungserlöse</span>
            <span class="font-mono">${formatEuro(report.taxableProceedsEUR)}</span>
          </div>
          <div class="calc-row">
            <span>&minus; Anschaffungskosten (inkl. Kaufgebühren)</span>
            <span class="font-mono">${formatEuro(report.taxableCostBasisEUR)}</span>
          </div>
          <div class="calc-row">
            <span>&minus; Werbungskosten (Verkaufsgebühren)</span>
            <span class="font-mono">${formatEuro(report.taxableFeesEUR)}</span>
          </div>
          <div class="calc-row calc-total">
            <span>= Gewinn / Verlust</span>
            <span class="font-mono ${isNetProfit ? 'text-success' : 'text-danger'}">
              ${isNetProfit ? '+' : ''}${formatEuro(report.realizedTaxableNetEUR)}
            </span>
          </div>

          <div class="note-box">
            ${sec23StatusText}
          </div>

          <div class="note-box-secondary">
            Nachrichtlich steuerfrei (Haltedauer &gt; 1 Jahr)<br>Erlöse ${formatEuro(report.taxFreeProceedsEUR)}, Gewinn ${report.realizedTaxFreeProfitEUR >= 0 ? '+' : ''}${formatEuro(report.realizedTaxFreeProfitEUR)}.
          </div>
        </div>

        <!-- Card 2: § 22 Nr. 3 EStG -->
        <div class="card">
          <div class="card-title">Sonstige Einkünfte &bull; § 22 Nr. 3 EStG</div>
          <div class="card-subtitle">Staking, Earn/Zinsen, Rewards, Airdrops &ndash; Wert bei Zufluss</div>

          <div class="calc-row">
            <span>Einnahmen</span>
            <span class="font-mono">${formatEuro(report.totalStakingRewardsEUR)}</span>
          </div>
          <div class="calc-row">
            <span>&minus; Werbungskosten</span>
            <span class="font-mono">0,00 €</span>
          </div>
          <div class="calc-row calc-total">
            <span>= Einkünfte</span>
            <span class="font-mono font-bold">${formatEuro(report.totalStakingRewardsEUR)}</span>
          </div>

          <div class="note-box">
            ${sec22StatusText}
          </div>

          <div class="note-box-secondary">
            Die zugeflossenen Einheiten gelten als angeschafft am Tag des Zuflusses (neue FIFO-Tranche).
          </div>
        </div>
      </div>

      <!-- Subtable: Aufteilung nach Börse -->
      <div style="font-weight: 700; font-size: 8.5pt; margin-bottom: 5px;">Aufteilung nach Börse</div>
      <table>
        <thead>
          <tr>
            <th>Börse</th>
            <th class="text-right">Verkäufe</th>
            <th class="text-right">Ergebnis stpfl.</th>
            <th class="text-right">Ergebnis steuerfrei</th>
            <th class="text-right">Rewards § 22</th>
            <th class="text-right">Offene Tranchen</th>
            <th class="text-right">Bestandswert €</th>
          </tr>
        </thead>
        <tbody>
          ${exchangeSummaryRows}
          <tr class="grandtotal-row">
            <td>Gesamt</td>
            <td class="text-right font-mono">${report.realizedSalesCount}</td>
            <td class="text-right font-mono ${report.realizedTaxableNetEUR >= 0 ? 'text-success' : 'text-danger'}">
              ${report.realizedTaxableNetEUR >= 0 ? '+' : ''}${formatEuro(report.realizedTaxableNetEUR)}
            </td>
            <td class="text-right font-mono text-muted">
              ${report.realizedTaxFreeProfitEUR >= 0 ? '+' : ''}${formatEuro(report.realizedTaxFreeProfitEUR)}
            </td>
            <td class="text-right font-mono">${formatEuro(report.totalStakingRewardsEUR)}</td>
            <td class="text-right font-mono">${report.openTranches.length}</td>
            <td class="text-right font-mono">${formatEuro(report.totalPortfolioValueEUR)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; ${report.exchangesList}</span>
      <span>Seite 1 von ${totalPages}</span>
    </div>
  </div>


  <!-- ==================== SEITE 2 ==================== -->
  <div class="page page-break">
    <div>
      <!-- SECTION 2: Einzelnachweis Veräußerungen (FIFO) -->
      <div class="section-badge-header">
        <span class="section-num">2</span>
        <h2>Einzelnachweis Veräußerungen (FIFO)</h2>
      </div>
      <div class="section-subtitle">
        Alle Verkäufe gegen EUR. Verkäufe, die mehrere Anschaffungstranchen verbrauchen, sind in Teilzeilen (a, b &hellip;) aufgeteilt; Erlös und Gebühr werden mengenanteilig zugeordnet. Beträge in €.
      </div>

      <table>
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Verkauf</th>
            <th>Anschaffung</th>
            <th class="text-right">Tage</th>
            <th>Asset</th>
            <th class="text-right">Menge</th>
            <th class="text-right">Anschaffungskosten</th>
            <th class="text-right">Erlös</th>
            <th class="text-right">Gebühr</th>
            <th class="text-right">Gewinn/Verlust</th>
            <th class="text-center">§ 23</th>
          </tr>
        </thead>
        <tbody>
          ${salesTableHtml}
        </tbody>
      </table>
      <div style="font-size: 7pt; color: #64748b; margin-top: -4px; margin-bottom: 20px;">
        Tage = Kalendertage zwischen Anschaffung und Veräußerung. Steuerfrei, wenn die Veräußerung nach Ablauf eines Jahres ab Anschaffung erfolgt (§ 23 Abs. 1 Satz 1 Nr. 2 EStG).
      </div>

      <div class="section-divider"></div>

      <!-- SECTION 3: Sonstige Einkünfte · Staking & Rewards -->
      <div class="section-badge-header" style="margin-top: 0; margin-bottom: 12px;">
        <span class="section-num">3</span>
        <h2>Sonstige Einkünfte &bull; Staking &amp; Rewards</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Zufluss</th>
            <th>Börse</th>
            <th>Asset</th>
            <th>Art</th>
            <th class="text-right">Menge</th>
            <th class="text-right">Wert bei Zufluss €</th>
          </tr>
        </thead>
        <tbody>
          ${rewardsTableHtml}
        </tbody>
      </table>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; ${report.exchangesList}</span>
      <span>Seite 2 von ${totalPages}</span>
    </div>
  </div>


  <!-- ==================== SEITE 3 ==================== -->
  <div class="page page-break">
    <div>
      <!-- SECTION 4: Coin-Bestand zum Stichtag -->
      <div class="section-badge-header">
        <span class="section-num">4</span>
        <h2>Coin-Bestand zum ${report.reportDate}</h2>
      </div>
      <div class="section-subtitle">
        Nachrichtlich, nicht erklärungspflichtig. Relevant für künftige Haltedauern. Kurswerte zum Stichtag.
      </div>

      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Bezeichnung</th>
            <th class="text-right">Bestand</th>
            ${showKrakenCol ? '<th class="text-right">Davon Kraken</th>' : ''}
            ${showCdcCol ? '<th class="text-right">Davon Crypto.com</th>' : ''}
            <th class="text-right">Steuerfrei</th>
            <th class="text-center">Steuerfrei ab</th>
            <th class="text-right">Wert €</th>
          </tr>
        </thead>
        <tbody>
          ${assetHoldingRows}
          <tr class="grandtotal-row">
            <td colspan="${3 + (showKrakenCol ? 1 : 0) + (showCdcCol ? 1 : 0) + 1}">
              Gesamt &bull; davon steuerfrei ${formatEuro(report.totalTaxFreeValueEUR)} (${report.taxFreePercentage.toFixed(1)} %) &bull; Anschaffungskosten der offenen Tranchen ${formatEuro(report.totalOpenTranchesCostEUR)}
            </td>
            <td class="text-center font-mono"></td>
            <td class="text-right font-mono">${formatEuro(report.totalPortfolioValueEUR)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-divider"></div>

      <!-- SECTION 5: Anhang A · Offene Anschaffungstranchen -->
      <div class="section-badge-header" style="margin-top: 0; margin-bottom: 12px;">
        <span class="section-num">5</span>
        <h2>Anhang A &bull; Offene Anschaffungstranchen</h2>
      </div>
      <div class="section-subtitle">
        Grundlage der FIFO-Zuordnung. Mengen je Asset ergeben den Bestand aus Abschnitt 4.
      </div>

      <table>
        <thead>
          <tr>
            <th>Tranche</th>
            <th>Asset</th>
            <th>Anschaffung</th>
            <th class="text-right">Menge</th>
            <th class="text-right">Anschaffungskosten €</th>
            <th class="text-right">Tage gehalten</th>
            <th class="text-center">Steuerfrei ab</th>
          </tr>
        </thead>
        <tbody>
          ${tranchesTableHtml}
        </tbody>
      </table>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; ${report.exchangesList}</span>
      <span>Seite 3 von ${totalPages}</span>
    </div>
  </div>


  <!-- ==================== SEITE 4 ==================== -->
  <div class="page page-break">
    <div>
      <!-- SECTION 6: Angaben, Belege und Methodik -->
      <div class="section-badge-header">
        <span class="section-num">6</span>
        <h2>Angaben, Belege und Methodik</h2>
      </div>

      <div class="cols-2">
        <!-- Left: Angaben & Belege -->
        <div>
          <div class="col-title">Angaben der/des Steuerpflichtigen</div>
          <div class="check-item">
            <span class="check-box" style="color: #16a34a;">&#x2611;</span>
            <span>Keine Tauschgeschäfte Kryptowert gegen Kryptowert.</span>
          </div>
          <div class="check-item">
            <span class="check-box" style="color: #16a34a;">&#x2611;</span>
            <span>Käufe und Verkäufe ausschließlich gegen EUR.</span>
          </div>
          <div class="check-item">
            <span class="check-box">&#x2610;</span>
            <span>Transfers zwischen Börsen oder in eigene Wallets: <strong>nein</strong> &nbsp; &#x2610; <strong>ja (Anlage beifügen)</strong></span>
          </div>
          <div class="check-item">
            <span class="check-box">&#x2610;</span>
            <span>Weitere Börsen, Wallets oder DeFi-Nutzung: <strong>nein</strong> &nbsp; &#x2610; <strong>ja</strong></span>
          </div>
          <div class="check-item">
            <span class="check-box">&#x2610;</span>
            <span>Weitere private Veräußerungsgeschäfte außerhalb Krypto (z. B. Gold): <strong>nein</strong> &nbsp; &#x2610; <strong>ja</strong></span>
          </div>

          <div class="col-title" style="margin-top: 14px;">Beigefügte Belege</div>
          ${krakenPages.length > 0 ? `
            <div class="check-item">
              <span class="check-box" style="color: #16a34a;">&#x2611;</span>
              <span>Kraken &ndash; Ledger-Export (vollständig aufbereitet &bull; Anhang B)</span>
            </div>
          ` : ''}
          ${cdcPages.length > 0 ? `
            <div class="check-item">
              <span class="check-box" style="color: #16a34a;">&#x2611;</span>
              <span>Crypto.com &ndash; Transaktionshistorie (vollständig aufbereitet &bull; Anhang C)</span>
            </div>
          ` : ''}
        </div>

        <!-- Right: Methodik -->
        <div>
          <div class="col-title">Methodik</div>
          <div class="methodology-item">
            <strong>FIFO je Börse:</strong> Verkaufte Einheiten werden der jeweils ältesten offenen Tranche derselben Börse zugeordnet.
          </div>
          <div class="methodology-item">
            <strong>Haltedauer:</strong> Fristberechnung nach Kalenderdaten. Steuerfrei ab dem Tag nach Ablauf eines Jahres seit Anschaffung.
          </div>
          <div class="methodology-item">
            <strong>Anschaffungskosten</strong> enthalten Kaufgebühren. <strong>Verkaufsgebühren</strong> sind Werbungskosten.
          </div>
          <div class="methodology-item">
            <strong>Freigrenze § 23 EStG:</strong> Gesamtgewinn aller privaten Veräußerungsgeschäfte unter 1.000 € im Jahr bleibt steuerfrei (ab VZ 2024, vorher 600 €).
          </div>
          <div class="methodology-item">
            <strong>Verluste:</strong> aus § 23 EStG nur mit Gewinnen derselben Einkunftsart verrechenbar; Rück- und Vortrag möglich.
          </div>
          <div class="methodology-item">
            <strong>Freigrenze § 22 Nr. 3 EStG:</strong> Einkünfte unter 256 € im Jahr bleiben steuerfrei.
          </div>
          <div class="methodology-item">
            <strong>Bewertung:</strong> Kurs in EUR zum Zeitpunkt des Vorgangs laut Börse.
          </div>
        </div>
      </div>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>rwrfolio &bull; Krypto-Steuerbericht VZ ${report.taxYear} &bull; ${statusText} &bull; ${report.exchangesList}</span>
      <span>Seite 4 von ${totalPages}</span>
    </div>
  </div>

  ${krakenPagesHtml}
  ${cdcPagesHtml}

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // If pop-ups are blocked, create hidden iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 500);
    }
  }
}

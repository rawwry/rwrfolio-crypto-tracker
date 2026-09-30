import { PortfolioTaxReport } from './taxCalculator';
import { UserProfile } from '../types';

export function exportTaxReportToPDF(
  report: PortfolioTaxReport,
  userProfile?: UserProfile
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

  const assetRows = report.assets
    .map(
      (a) => `
      <tr>
        <td class="font-bold">${a.symbol}</td>
        <td>${a.name}</td>
        <td class="text-right font-mono">${a.totalBalance.toLocaleString('de-DE', { maximumFractionDigits: 6 })} ${a.symbol}</td>
        <td class="text-right font-mono text-success">${a.taxFreeBalance.toLocaleString('de-DE', { maximumFractionDigits: 6 })}</td>
        <td class="text-right font-mono text-warning">${a.taxableBalance.toLocaleString('de-DE', { maximumFractionDigits: 6 })}</td>
        <td class="text-right font-mono font-bold">${a.taxFreePercentage.toFixed(1)} %</td>
        <td class="text-right font-mono">${formatEuro(a.totalCurrentValueEUR)}</td>
      </tr>
    `
    )
    .join('');

  const salesRows =
    report.realizedSales.length === 0
      ? `<tr><td colspan="9" class="text-center py-4 text-muted">Im Steuerjahr ${report.taxYear} wurden keine steuerrelevanten Krypto-Verkäufe getätigt.</td></tr>`
      : report.realizedSales
          .map((s) => {
            const isGain = s.realizedPnlEUR >= 0;
            return `
        <tr>
          <td class="font-bold">${s.symbol}</td>
          <td class="font-mono text-xs">${s.sellDate.substring(0, 10)}</td>
          <td class="font-mono text-xs">${s.buyDate.substring(0, 10)}</td>
          <td class="text-right font-mono">${s.amount.toLocaleString('de-DE', { maximumFractionDigits: 6 })}</td>
          <td class="text-right font-mono">${formatEuro(s.costBasisEUR)}</td>
          <td class="text-right font-mono">${formatEuro(s.proceedsEUR)}</td>
          <td class="text-right font-mono font-bold ${isGain ? 'text-success' : 'text-danger'}">
            ${isGain ? '+' : ''}${formatEuro(s.realizedPnlEUR)}
          </td>
          <td class="text-right font-mono">${s.daysHeld} T.</td>
          <td class="text-center">
            <span class="badge ${s.isTaxFree ? 'badge-success' : 'badge-warning'}">
              ${s.isTaxFree ? 'Steuerfrei (> 365 T.)' : 'Steuerpflichtig (< 1 J.)'}
            </span>
          </td>
        </tr>
      `;
          })
          .join('');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>rwrfolio_Steuerbericht_${report.taxYear}_FIFO</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .title p {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .meta strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px;
    }
    .kpi-title {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 3px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin: 18px 0 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .section-title span.count {
      font-size: 10px;
      color: #64748b;
      font-weight: normal;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 14px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 6px 8px;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 5.5px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .text-xs { font-size: 9px; }
    .text-muted { color: #64748b; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 600;
    }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .disclaimer-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 9.5px;
      color: #475569;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .disclaimer-box strong { color: #0f172a; }
    .footer {
      margin-top: 18px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="title">
      <h1>rwrfolio – Steuer- &amp; Haltedauerbericht</h1>
      <p>Nachweis privater Veräußerungsgeschäfte nach § 23 Abs. 1 Satz 1 Nr. 2 EStG (FIFO-Verfahren)</p>
    </div>
    <div class="meta">
      <div>Steuerjahr: <strong>${report.taxYear}</strong></div>
      <div>Erstellt am: <strong>${currentDate} ${currentTime}</strong></div>
      ${(userProfile?.fullName || userProfile?.username) ? `<div>Steuerpflichtiger: <strong>${userProfile.fullName || userProfile.username}</strong></div>` : ''}
      ${userProfile?.taxId ? `<div>Steuer-Identifikationsnummer (IdNr): <strong>${userProfile.taxId}</strong></div>` : ''}
      <div>Bewertungsmethode: <strong>FIFO (First-In, First-Out)</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Steuerfreier Bestand (> 1 J.)</div>
      <div class="kpi-value text-success">${formatEuro(report.totalTaxFreeValueEUR)}</div>
      <div class="kpi-sub font-mono font-bold">${report.taxFreePercentage.toFixed(1)} % des Portfolios</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Steuerfreier Gewinn</div>
      <div class="kpi-value" style="color: #4f46e5;">
        ${report.totalTaxFreeUnrealizedPnlEUR >= 0 ? '+' : ''}${formatEuro(report.totalTaxFreeUnrealizedPnlEUR)}
      </div>
      <div class="kpi-sub">Haltedauer > 365 Tage erreicht</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Noch steuerpflichtig (&lt; 1 J.)</div>
      <div class="kpi-value text-warning">${formatEuro(report.totalTaxableValueEUR)}</div>
      <div class="kpi-sub font-mono">${report.upcomingTaxFreeLots.length} Tranche(n) in Frist</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Realisierte Gewinne ${report.taxYear}</div>
      <div class="kpi-value ${report.exemptionExceeded ? 'text-danger' : 'text-success'}">
        ${report.realizedTaxableNetEUR >= 0 ? '+' : ''}${formatEuro(report.realizedTaxableNetEUR)}
      </div>
      <div class="kpi-sub">
        Freigrenze: ${report.germanExemptionLimitEUR} € &bull; 
        <strong>${report.exemptionExceeded ? 'Überschritten' : 'Steuerfrei'}</strong>
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>1. Vermögensaufstellung &amp; Haltedauern (Stichtag: ${currentDate})</span>
    <span class="count">${report.assets.length} Assets erfasst</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Asset</th>
        <th>Bezeichnung</th>
        <th class="text-right">Gesamtbestand</th>
        <th class="text-right">Steuerfrei (> 365 T.)</th>
        <th class="text-right">Steuerpflichtig (< 1 J.)</th>
        <th class="text-right">Steuerfrei %</th>
        <th class="text-right">Aktueller Wert</th>
      </tr>
    </thead>
    <tbody>
      ${assetRows}
    </tbody>
  </table>

  <div class="section-title">
    <span>2. Anlage Veräußerungsgeschäfte im Steuerjahr ${report.taxYear} (FIFO-Zuordnung)</span>
    <span class="count">${report.realizedSales.length} Verkaufstranchen</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Asset</th>
        <th>Verkauf</th>
        <th>Anschaffung</th>
        <th class="text-right">Menge</th>
        <th class="text-right">Kaufpreis</th>
        <th class="text-right">Verkaufserlös</th>
        <th class="text-right">Gewinn / Verlust</th>
        <th class="text-right">Haltedauer</th>
        <th class="text-center">Status (§ 23 EStG)</th>
      </tr>
    </thead>
    <tbody>
      ${salesRows}
    </tbody>
  </table>

  <div class="disclaimer-box">
    <strong>Steuerrechtlicher Hinweis (§ 23 EStG &amp; BMF-Schreiben vom 10.05.2022):</strong><br>
    Gewinne aus der Veräußerung von Kryptowährungen sind gemäß § 23 Abs. 1 Satz 1 Nr. 2 EStG vollkommen steuerfrei, 
    sofern zwischen Anschaffung und Veräußerung mehr als ein Jahr (365 Tage) vergangen ist. Die Zuordnung der verkauften 
    Einheiten zu den Anschaffungstranchen erfolgt strikt nach der gesetzlich anerkannten FIFO-Methode (First In, First Out). 
    Für private Veräußerungsgeschäfte gilt ab dem Veranlagungszeitraum 2024 eine jährliche Freigrenze von 1.000 € (bis 2023: 600 €). 
    Dieser Bericht dient als Dokumentation zur Vorlage bei Ihrem Steuerberater oder dem zuständigen Finanzamt.
  </div>

  <div class="footer">
    <span>Generiert durch rwrfolio Crypto Portfolio Tracker</span>
    <span>FIFO Steuerbericht VZ ${report.taxYear}</span>
    <span>Seite 1 von 1</span>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 300);
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
        }, 1000);
      }, 500);
    }
  }
}

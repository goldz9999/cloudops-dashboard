export interface ReportSection {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ReportData {
  /** Título del reporte, p. ej. "Reporte de costos" */
  title: string;
  /** Parte fija del nombre de archivo, p. ej. "costos" */
  slug: string;
  regionId: string;
  regionText: string;
  kpis?: { label: string; value: string }[];
  sections: ReportSection[];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local en formato AAAA-MM-DD */
function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function generatedAt() {
  return new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function buildFileName(report: ReportData, ext: 'csv' | 'pdf') {
  return `${report.slug}-${report.regionId}-${todayStamp()}.${ext}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csvLine = (cells: (string | number)[]) => cells.map(csvCell).join(',');

export function exportCsv(report: ReportData): string {
  const lines: string[] = [
    csvLine([report.title]),
    csvLine(['Región', `${report.regionId} — ${report.regionText}`]),
    csvLine(['Generado', generatedAt()]),
    '',
  ];

  if (report.kpis?.length) {
    lines.push(csvLine(['Indicadores']), csvLine(['Indicador', 'Valor']));
    report.kpis.forEach((k) => lines.push(csvLine([k.label, k.value])));
    lines.push('');
  }

  report.sections.forEach((section) => {
    lines.push(csvLine([section.title]), csvLine(section.columns));
    section.rows.forEach((row) => lines.push(csvLine(row)));
    lines.push('');
  });

  // BOM para que Excel abra bien las tildes y la ñ
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const fileName = buildFileName(report, 'csv');
  downloadBlob(blob, fileName);
  return fileName;
}

export async function exportPdf(report: ReportData): Promise<string> {
  // Carga diferida: las librerías solo se descargan al exportar
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  type DocWithTable = InstanceType<typeof jsPDF> & { lastAutoTable?: { finalY: number } };
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }) as DocWithTable;
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const headStyles = { fillColor: [37, 99, 235] as [number, number, number], textColor: 255 };
  const finalY = () => doc.lastAutoTable?.finalY ?? 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(report.title, margin, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Región: ${report.regionId} — ${report.regionText}`, margin, 70);
  doc.text(`Generado: ${generatedAt()}`, margin, 84);

  let y = 104;

  if (report.kpis?.length) {
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: report.kpis.map((k) => [k.label, k.value]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles,
    });
    y = finalY() + 24;
  }

  report.sections.forEach((section) => {
    // Si el título quedaría solo al final de la página, se pasa a la siguiente
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 50;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(section.title, margin, y);

    autoTable(doc, {
      startY: y + 8,
      head: [section.columns],
      body: section.rows.map((r) => r.map(String)),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles,
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = finalY() + 24;
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CloudOps Dashboard', margin, pageHeight - 24);
    doc.text(`Página ${i} de ${pages}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
  }

  const fileName = buildFileName(report, 'pdf');
  doc.save(fileName);
  return fileName;
}
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useNotifications } from '../../context/useNotifications';
import { exportCsv, exportPdf, type ReportData } from '../../utils/exportReport';

interface Props {
  /** Se llama al exportar, así el reporte siempre usa los datos actuales */
  getReport: () => ReportData;
}

export default function ExportMenu({ getReport }: Props) {
  const { notify } = useNotifications();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const run = async (format: 'csv' | 'pdf') => {
    setOpen(false);
    setBusy(true);
    try {
      const report = getReport();
      const fileName = format === 'csv' ? exportCsv(report) : await exportPdf(report);
      notify({ type: 'success', title: 'Reporte generado', message: fileName });
    } catch {
      notify({ type: 'error', title: 'No se pudo generar el reporte', message: 'Inténtalo de nuevo.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {busy ? 'Generando…' : 'Exportar'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden origin-top-right animate-pop-in"
        >
          <button
            role="menuitem"
            onClick={() => run('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-security" />
            Descargar CSV
          </button>
          <button
            role="menuitem"
            onClick={() => run('pdf')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
          >
            <FileText className="w-4 h-4 text-alerts" />
            Descargar PDF
          </button>
        </div>
      )}
    </div>
  );
}
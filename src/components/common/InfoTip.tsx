import { useId, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface Props {
  /** Texto visible (la etiqueta del elemento) */
  children: ReactNode;
  /** Título del tooltip; por defecto no se muestra */
  title?: string;
  /** Explicación del concepto */
  description: string;
  /** Sugerencia opcional (p. ej. qué hacer cuando el estado es "Revisión") */
  recommendation?: string;
  className?: string;
}

/**
 * Etiqueta con un pequeño icono ⓘ que muestra una explicación al pasar el cursor,
 * al enfocar con teclado o al tocar en móvil. Usa los tokens de color del tema,
 * por lo que respeta el modo oscuro.
 */
export default function InfoTip({ children, title, description, recommendation, className = '' }: Props) {
  const id = useId();

  return (
    <span
      tabIndex={0}
      aria-describedby={id}
      className={`group relative inline-flex items-center gap-1.5 cursor-help rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      {children}
      <Info className="w-3.5 h-3.5 shrink-0 text-text-secondary/60 transition-colors group-hover:text-primary group-focus-within:text-primary" />

      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-0 bottom-full mb-2 z-30 block w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-card p-3 text-left font-normal shadow-lg shadow-black/10 dark:shadow-black/50 opacity-0 translate-y-1 transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
      >
        {title && <span className="block text-xs font-semibold text-text-main mb-1">{title}</span>}
        <span className="block text-[11px] leading-snug text-text-secondary">{description}</span>
        {recommendation && (
          <span className="block mt-2 pt-2 border-t border-border text-[11px] leading-snug text-text-main">
            <span className="font-semibold text-[#F59E0B]">Recomendación: </span>
            {recommendation}
          </span>
        )}
      </span>
    </span>
  );
}
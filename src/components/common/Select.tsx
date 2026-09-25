import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
  /** "field": caja completa con borde (formularios). "inline": sin borde, para barras. */
  variant?: 'field' | 'inline';
  className?: string;
}

interface PanelPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const MAX_PANEL_HEIGHT = 288;
const GAP = 6;

/**
 * Selector personalizado. El desplegable nativo de <select> lo dibuja el sistema
 * operativo y no se puede estilizar, así que aquí el panel es HTML propio que usa
 * los tokens de color (bg-card, text-text-main, border-border...) y por tanto
 * responde solo al modo oscuro.
 */
export default function Select({
  value,
  onChange,
  options,
  ariaLabel,
  variant = 'field',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const commit = (index: number) => {
    const opt = options[index];
    if (opt) onChange(opt.value);
    close();
  };

  // Calcula la posición del panel (fixed) y lo abre hacia arriba si abajo no hay espacio
  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const openUp = below < 160 && above > below;
    const room = openUp ? above : below;
    // En modo inline el panel puede ser más ancho que el botón para que no se corten las etiquetas
    const minW = variant === 'inline' ? Math.max(r.width, 260) : r.width;
    const width = Math.min(minW, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({
      left,
      width,
      maxHeight: Math.min(MAX_PANEL_HEIGHT, room),
      ...(openUp ? { bottom: window.innerHeight - r.top + GAP } : { top: r.bottom + GAP }),
    });
  }, [variant]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close(false);
    };
    const onScrollResize = (e: Event) => {
      // No cerrar si el scroll ocurre dentro del propio panel
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      updatePos();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onScrollResize);
    window.addEventListener('scroll', onScrollResize, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onScrollResize);
      window.removeEventListener('scroll', onScrollResize, true);
    };
  }, [open, close, updatePos]);

  // Mantiene visible la opción activa
  useEffect(() => {
    if (!open || !pos) return;
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  const openPanel = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(active);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  const triggerCls =
    variant === 'field'
      ? 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30'
      : 'text-xs font-medium text-text-main rounded focus-visible:ring-2 focus-visible:ring-primary/40';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openPanel())}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 min-w-0 text-left cursor-pointer focus:outline-none transition-colors ${triggerCls} ${className}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <ul
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
            }}
            className="z-[100] overflow-y-auto py-1 rounded-lg border border-border bg-card text-text-main shadow-lg shadow-black/10 dark:shadow-black/50 animate-pop-in"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  data-index={i}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer ${
                    i === active ? 'bg-primary/10 dark:bg-primary/20' : ''
                  } ${isSelected ? 'font-semibold text-primary' : 'text-text-main'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}
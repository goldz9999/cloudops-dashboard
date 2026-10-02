/** Formatos y colores compartidos por la vista de Costos. */
export const COST_COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#0EA5E9', '#EF4444', '#64748B', '#EC4899'];

export const usd = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Tarifas pequeñas con 4 decimales ($0.0528) y grandes con 2 ($17.12). */
export const rate = (n: number) => `$${n < 1 ? n.toFixed(4) : n.toFixed(2)}`;

export interface CostSlice {
    name: string;
    value: number;
    percentage: number;
    color: string;
}
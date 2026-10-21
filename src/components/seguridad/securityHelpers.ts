import { useEffect, useState } from 'react';
import type { ControlState } from '../../api/erpSecurity';

export const stateLabel: Record<ControlState, string> = { measured: 'Medido', declared: 'Declarado', gap: 'Brecha' };
export const stateBadge: Record<ControlState, string> = {
    measured: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
    declared: 'bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border-blue-200 dark:border-blue-500/30',
    gap: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
};
export const stateDot: Record<ControlState, string> = { measured: 'bg-[#16A34A]', declared: 'bg-[#2563EB]', gap: 'bg-[#F59E0B]' };

export const scoreColor = (n: number) => (n >= 90 ? 'text-[#16A34A]' : n >= 75 ? 'text-[#F59E0B]' : 'text-[#DC2626]');
export const barColor = (n: number) => (n >= 90 ? 'bg-[#16A34A]' : n >= 75 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]');
export const ringHex = (n: number) => (n >= 90 ? '#16A34A' : n >= 75 ? '#F59E0B' : '#DC2626');
/** Fondo suave + texto del mismo tono, según el puntaje. */
export const tint = (n: number) =>
    n >= 90
        ? 'bg-green-50 dark:bg-green-500/10 text-[#16A34A]'
        : n >= 75
            ? 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706]'
            : 'bg-red-50 dark:bg-red-500/10 text-[#DC2626]';
export const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const iconTile = 'grid place-items-center w-10 h-10 rounded-xl shrink-0';

/** Valor que parte de 0 y sube a su destino tras el primer pintado (para animar barras y anillos). */
export function useGrow(target: number) {
    const [v, setV] = useState(0);
    useEffect(() => {
        const id = requestAnimationFrame(() => setV(target));
        return () => cancelAnimationFrame(id);
    }, [target]);
    return v;
}
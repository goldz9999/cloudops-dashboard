import type { Proposal } from '../components/planificacion/planTypes';
import { SERVICE_OPTIONS } from '../components/costos/costoData';

/** Id de servicio (planificación) → nombre en la tabla de costos. */
const ID_TO_SERVICE_NAME: Record<string, string> = {
    ec2: 'EC2',
    rds: 'RDS',
    s3: 'S3',
    cloudfront: 'CloudFront',
    route53: 'Route 53',
    iam: 'IAM',
    vpc: 'VPC',
};

/** Costo mensual de un servicio seleccionado (misma tarifa que "Aplicar a costos": cantidad 1). */
export function serviceCost(selected: string): { service: string; monthly: number } | null {
    const name = ID_TO_SERVICE_NAME[selected.toLowerCase()] ?? selected;
    const opt = SERVICE_OPTIONS.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!opt) return null;
    return { service: opt.name, monthly: +(opt.rate * opt.hours).toFixed(2) };
}

export interface RegionPlanning {
    /** Cantidad de propuestas de planificación de la región */
    plans: number;
    /** Servicios distintos usados en esas propuestas */
    services: string[];
    /** Suma del costo mensual de todas las propuestas */
    monthly: number;
}

/** Agrupa las propuestas por región: cuántas hay, qué servicios usan y cuánto cuestan. */
export function planningByRegion(proposals: Proposal[]): Record<string, RegionPlanning> {
    const acc: Record<string, { plans: number; services: Set<string>; monthly: number }> = {};
    for (const p of proposals) {
        if (!p.regionId) continue;
        const cur = (acc[p.regionId] ??= { plans: 0, services: new Set<string>(), monthly: 0 });
        cur.plans += 1;
        for (const sel of p.selected ?? []) {
            const c = serviceCost(sel);
            if (!c) continue;
            cur.services.add(c.service);
            cur.monthly = +(cur.monthly + c.monthly).toFixed(2);
        }
    }
    return Object.fromEntries(
        Object.entries(acc).map(([id, v]) => [id, { plans: v.plans, services: [...v.services], monthly: v.monthly }]),
    );
}
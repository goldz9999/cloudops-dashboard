import type { Proposal } from '../components/planificacion/planTypes';
import { regionsData } from './regionData';

/**
 * Eventos de auditoría estilo CloudTrail.
 * - Los de planificación (crear planificación, agregar recursos) salen de las
 *   planificaciones REALES guardadas en el backend.
 * - El resto (inicios de sesión, alertas, políticas, revisiones…) son SIMULADOS.
 * No hay CloudTrail real ni conexión con AWS. Las IP son de rangos de documentación (RFC 5737).
 */

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'REVIEW' | 'ALERT';
export type AuditResult = 'Success' | 'Warning' | 'Failed';

export interface AuditEvent {
    id: string;
    time: string; // ISO
    user: string;
    action: AuditAction;
    eventName: string;
    description: string;
    service: string;
    resource: string;
    region: string;
    ip: string;
    result: AuditResult;
    origin: 'Planificación' | 'Simulado';
    details: Record<string, string | number | boolean>;
}

const IPS = ['203.0.113.24', '203.0.113.57', '198.51.100.12', '198.51.100.88', '192.0.2.41', '192.0.2.150'];
const USERS = ['admin', 'devops', 'analista', 'ci-deploy', 'seguridad'];

function rng(seed: number) {
    let h = seed >>> 0;
    return () => {
        h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
        return (h % 10000) / 10000;
    };
}

const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

/** Eventos derivados de las planificaciones guardadas. */
function planningEvents(plannings: Proposal[]): AuditEvent[] {
    const out: AuditEvent[] = [];
    for (const p of plannings) {
        const base = p.createdAtIso ? new Date(p.createdAtIso).getTime() : Date.now();
        const ip = IPS[p.id % IPS.length];
        out.push({
            id: `p${p.id}-create`,
            time: new Date(base).toISOString(),
            user: 'admin',
            action: 'CREATE',
            eventName: 'CreatePlanning',
            description: 'Usuario creó una planificación',
            service: 'Planificación',
            resource: p.name,
            region: p.regionId,
            ip,
            result: 'Success',
            origin: 'Planificación',
            details: { tipo: p.type, usuariosEstimados: p.users, disponibilidad: p.availability, servicios: p.selected.length },
        });
        p.selected.forEach((svc, i) => {
            out.push({
                id: `p${p.id}-add-${i}`,
                time: new Date(base + (i + 1) * 1000).toISOString(),
                user: 'admin',
                action: 'CREATE',
                eventName: 'AddResource',
                description: `Recurso ${svc} agregado a la arquitectura`,
                service: svc,
                resource: `${svc} · ${p.name}`,
                region: p.regionId,
                ip,
                result: 'Success',
                origin: 'Planificación',
                details: { planificacion: p.name, planificacionId: p.id },
            });
        });
    }
    return out;
}

interface Template {
    action: AuditAction;
    eventName: string;
    description: string;
    service: string;
    resource: (r: () => number) => string;
    result: (r: () => number) => AuditResult;
    details: (r: () => number) => AuditEvent['details'];
}

const ok = () => 'Success' as const;

const TEMPLATES: Template[] = [
    {
        action: 'LOGIN', eventName: 'ConsoleLogin', description: 'Inicio de sesión en el panel', service: 'IAM',
        resource: (r) => `usuario: ${pick(r, USERS)}`, result: (r) => (r() < 0.12 ? 'Failed' : 'Success'),
        details: (r) => ({ mfaUsado: r() > 0.1, navegador: pick(r, ['Chrome', 'Firefox', 'Edge']) })
    },
    {
        action: 'UPDATE', eventName: 'ModifyPlanning', description: 'Usuario modificó una planificación', service: 'Planificación',
        resource: (r) => pick(r, ['Web Producción', 'API Backend', 'Portal clientes']), result: ok,
        details: (r) => ({ campo: pick(r, ['Disponibilidad', 'Usuarios estimados', 'Objetivo de migración']) })
    },
    {
        action: 'UPDATE', eventName: 'ModifyInstanceCount', description: 'Cambio de cantidad de instancias', service: 'EC2',
        resource: (r) => `EC2-Web-0${1 + Math.floor(r() * 4)}`, result: ok,
        details: (r) => { const a = 1 + Math.floor(r() * 3); return { antes: a, despues: a + 1 + Math.floor(r() * 2) }; }
    },
    {
        action: 'DELETE', eventName: 'RemoveResource', description: 'Recurso RDS eliminado de la planificación', service: 'RDS',
        resource: (r) => `RDS-db-0${1 + Math.floor(r() * 3)}`, result: (r) => (r() < 0.15 ? 'Warning' : 'Success'),
        details: () => ({ snapshotFinal: true })
    },
    {
        action: 'UPDATE', eventName: 'ChangeRegion', description: 'Cambio de región de una planificación', service: 'Planificación',
        resource: (r) => pick(r, ['Web Producción', 'Data Lake', 'API Backend']), result: ok,
        details: (r) => ({ desde: pick(r, regionsData).id, hacia: pick(r, regionsData).id })
    },
    {
        action: 'UPDATE', eventName: 'UpdateCostEstimate', description: 'Cambio de costos estimados', service: 'Costos',
        resource: () => 'Calculadora de costos', result: ok,
        details: (r) => { const a = 80 + Math.round(r() * 300); return { mensualAntes: a, mensualDespues: a + Math.round((r() - 0.4) * 90) }; }
    },
    {
        action: 'UPDATE', eventName: 'PutConfigurationRecorder', description: 'Cambio de configuración', service: 'AWS Config',
        resource: () => 'default-recorder', result: ok, details: () => ({ todosLosRecursos: true })
    },
    {
        action: 'REVIEW', eventName: 'SecurityReview', description: 'Revisión de seguridad ejecutada', service: 'Security Hub',
        resource: () => 'AWS Foundational Best Practices', result: (r) => (r() < 0.4 ? 'Warning' : 'Success'),
        details: (r) => ({ controlesEvaluados: 120 + Math.floor(r() * 30), fallidos: Math.floor(r() * 6) })
    },
    {
        action: 'ALERT', eventName: 'GuardDutyFinding', description: 'Alerta generada por GuardDuty', service: 'GuardDuty',
        resource: (r) => pick(r, ['i-0b91e2f4', 'deploy-ci', 'sg-0a7f3c21']), result: () => 'Warning',
        details: (r) => ({ tipo: pick(r, ['Recon:EC2/PortProbeUnprotectedPort', 'UnauthorizedAccess:IAMUser/ConsoleLogin', 'Discovery:S3/AnomalousBehavior']), severidad: pick(r, ['Media', 'Alta']) })
    },
    {
        action: 'UPDATE', eventName: 'PutUserPolicy', description: 'Política IAM modificada', service: 'IAM',
        resource: (r) => `política: ${pick(r, ['ReadOnlyAccess-Analistas', 'DeployPipeline', 'S3-Backups'])}`, result: (r) => (r() < 0.1 ? 'Failed' : 'Success'),
        details: (r) => ({ accion: pick(r, ['Permiso agregado', 'Permiso retirado']) })
    },
    {
        action: 'UPDATE', eventName: 'AuthorizeSecurityGroupIngress', description: 'Regla de Security Group modificada', service: 'VPC',
        resource: (r) => `sg-${Math.floor(r() * 0xffffff).toString(16).padStart(6, '0')}`, result: (r) => (r() < 0.3 ? 'Warning' : 'Success'),
        details: (r) => ({ puerto: pick(r, [22, 443, 5432, 3389]), origen: pick(r, ['10.0.0.0/16', '0.0.0.0/0']) })
    },
    {
        action: 'CREATE', eventName: 'CreateBucket', description: 'Bucket S3 creado', service: 'S3',
        resource: (r) => `cloudops-${pick(r, ['logs', 'assets', 'backups'])}-${Math.floor(r() * 900 + 100)}`, result: ok,
        details: () => ({ cifrado: 'SSE-KMS', bloqueoPublico: true })
    },
];

/** Eventos simulados de los últimos `days` días (estables: mismos eventos en cada carga del día). */
function simulatedEvents(count: number, days: number): AuditEvent[] {
    const now = Date.now();
    const r = rng(Math.floor(now / 86_400_000)); // semilla por día
    return Array.from({ length: count }, (_, i) => {
        const t = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
        const time = new Date(now - r() * days * 86_400_000).toISOString();
        return {
            id: `sim-${i}`,
            time,
            user: t.action === 'ALERT' || t.action === 'REVIEW' ? 'sistema' : pick(r, USERS),
            action: t.action,
            eventName: t.eventName,
            description: t.description,
            service: t.service,
            resource: t.resource(r),
            region: pick(r, regionsData).id,
            ip: pick(r, IPS),
            result: t.result(r),
            origin: 'Simulado',
            details: t.details(r),
        };
    });
}

export function buildAuditEvents(plannings: Proposal[]): AuditEvent[] {
    return [...planningEvents(plannings), ...simulatedEvents(70, 14)].sort((a, b) => b.time.localeCompare(a.time));
}
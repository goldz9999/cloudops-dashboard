import type { HealthStatus } from './regionData';
import type { SecurityReport } from '../api/security';

/**
 * Seguridad SIMULADA (mock) inspirada en servicios reales de AWS.
 * No hay ninguna conexión con AWS ni con el backend: todos los valores son de ejemplo.
 * Varían un poco según la región para que el cambio de región se note.
 */

export type Severity = 'Alta' | 'Media' | 'Baja';
export type FindingState = 'Abierto' | 'En revisión' | 'Resuelto';

export interface SecurityControl {
    label: string;
    status: HealthStatus;
    detail: string;
}

export interface SecurityArea {
    id: 'iam' | 'network' | 'detection' | 'data';
    label: string;
    score: number;
    controls: SecurityControl[];
}

export interface ResourceSecurity {
    service: 'S3' | 'RDS' | 'EC2';
    total: number;
    compliant: number;
    controls: SecurityControl[];
}

export interface SecurityFinding {
    id: string;
    severity: Severity;
    title: string;
    service: string;
    resource: string;
    source: 'GuardDuty' | 'AWS Config' | 'Security Hub' | 'IAM Access Analyzer';
    detectedAt: string;
    state: FindingState;
    recommendation: string;
}

export interface MockSecurity {
    regionId: string;
    score: number;
    metrics: {
        mfa: number;
        iam: number;
        securityGroups: number;
        cloudTrail: number;
        config: number;
        guardDuty: 'Activo' | 'Inactivo';
    };
    iam: { users: number; usersWithMfa: number; roles: number; policies: number; oldAccessKeys: number; rootMfa: boolean };
    network: { vpcs: number; securityGroups: number; openSecurityGroups: number; nacls: number; flowLogs: boolean };
    areas: SecurityArea[];
    resources: ResourceSecurity[];
    findings: SecurityFinding[];
}

/** Número pseudoaleatorio estable a partir de un texto (misma región → mismos valores). */
function seeded(text: string) {
    let h = 2166136261;
    for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return (n: number) => {
        h = Math.imul(h ^ (h >>> 15), 2246822507) ^ n;
        return ((h >>> 0) % 1000) / 1000;
    };
}

const level = (pct: number): HealthStatus => (pct >= 90 ? 'healthy' : pct >= 75 ? 'review' : 'issue');
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export function getMockSecurity(regionId: string): MockSecurity {
    const rnd = seeded(regionId);
    const vary = (base: number, spread: number, i: number) => Math.round(base + (rnd(i) - 0.5) * spread);

    const users = vary(24, 8, 1);
    const usersWithMfa = Math.max(users - vary(2, 3, 2), 0);
    const mfa = Math.round((usersWithMfa / users) * 100);
    const oldAccessKeys = Math.max(vary(3, 3, 3), 0);
    const securityGroups = vary(26, 10, 4);
    const openSecurityGroups = Math.max(vary(5, 4, 5), 1);
    const sgPct = Math.round(((securityGroups - openSecurityGroups) / securityGroups) * 100);
    const iamPct = Math.min(100, vary(94, 6, 6));
    const configPct = Math.min(100, vary(95, 6, 7));
    const s3Total = vary(14, 6, 8);
    const rdsTotal = vary(4, 3, 9);
    const ec2Total = vary(12, 6, 10);

    const areas: SecurityArea[] = [
        {
            id: 'iam',
            label: 'Identidad y acceso (IAM)',
            score: Math.round((iamPct + mfa) / 2),
            controls: [
                { label: 'MFA en la cuenta raíz', status: 'healthy', detail: 'La cuenta raíz tiene MFA de hardware.' },
                { label: 'MFA en usuarios IAM', status: level(mfa), detail: `${usersWithMfa} de ${users} usuarios con MFA.` },
                {
                    label: 'Rotación de claves de acceso',
                    status: oldAccessKeys === 0 ? 'healthy' : 'review',
                    detail: oldAccessKeys === 0 ? 'Todas las claves tienen menos de 90 días.' : `${oldAccessKeys} claves con más de 90 días.`,
                },
                { label: 'Política de contraseñas', status: 'healthy', detail: 'Mínimo 14 caracteres, caducidad de 90 días.' },
                { label: 'Privilegio mínimo', status: level(iamPct), detail: `${100 - iamPct}% de políticas con permisos "*".` },
            ],
        },
        {
            id: 'network',
            label: 'Red (VPC)',
            score: Math.round((sgPct + 96) / 2),
            controls: [
                {
                    label: 'Security Groups sin 0.0.0.0/0 en SSH/RDP',
                    status: level(sgPct),
                    detail: `${openSecurityGroups} de ${securityGroups} grupos permiten acceso abierto.`,
                },
                { label: 'Network ACL', status: 'healthy', detail: 'Las subredes privadas bloquean tráfico entrante de Internet.' },
                { label: 'VPC Flow Logs', status: 'healthy', detail: 'Activos en todas las VPC (retención 30 días).' },
                { label: 'Subredes privadas para bases de datos', status: 'healthy', detail: 'Las instancias RDS no tienen IP pública.' },
            ],
        },
        {
            id: 'detection',
            label: 'Detección y registro',
            score: Math.round((100 + configPct + 100) / 3),
            controls: [
                { label: 'CloudTrail multirregión', status: 'healthy', detail: 'Registro activo con validación de integridad.' },
                { label: 'GuardDuty', status: 'healthy', detail: 'Activo; analiza CloudTrail, VPC Flow Logs y DNS.' },
                { label: 'AWS Config', status: level(configPct), detail: `${configPct}% de las reglas en cumplimiento.` },
                { label: 'Alarmas de CloudWatch', status: 'review', detail: 'Falta alarma para cambios en Security Groups.' },
            ],
        },
        {
            id: 'data',
            label: 'Protección de datos',
            score: vary(88, 8, 11),
            controls: [
                { label: 'Cifrado en reposo (KMS)', status: 'healthy', detail: 'S3, RDS y EBS cifrados con claves KMS.' },
                { label: 'Cifrado en tránsito (TLS)', status: 'healthy', detail: 'Los endpoints públicos exigen TLS 1.2+.' },
                { label: 'Bloqueo de acceso público en S3', status: 'review', detail: '1 bucket sin bloqueo a nivel de cuenta.' },
                { label: 'Copias de seguridad automáticas', status: 'healthy', detail: 'Retención de 7 días en RDS.' },
            ],
        },
    ];

    const resources: ResourceSecurity[] = [
        {
            service: 'S3',
            total: s3Total,
            compliant: s3Total - 1,
            controls: [
                { label: 'Cifrado por defecto', status: 'healthy', detail: `${s3Total} de ${s3Total} buckets.` },
                { label: 'Bloqueo de acceso público', status: 'review', detail: `${s3Total - 1} de ${s3Total} buckets.` },
                { label: 'Versionado', status: 'review', detail: `${s3Total - 3} de ${s3Total} buckets.` },
            ],
        },
        {
            service: 'RDS',
            total: rdsTotal,
            compliant: rdsTotal,
            controls: [
                { label: 'Sin acceso público', status: 'healthy', detail: `${rdsTotal} de ${rdsTotal} instancias.` },
                { label: 'Cifrado de almacenamiento', status: 'healthy', detail: `${rdsTotal} de ${rdsTotal} instancias.` },
                { label: 'Multi-AZ', status: rdsTotal > 2 ? 'review' : 'healthy', detail: `${Math.min(rdsTotal, 2)} de ${rdsTotal} instancias.` },
            ],
        },
        {
            service: 'EC2',
            total: ec2Total,
            compliant: ec2Total - 2,
            controls: [
                { label: 'IMDSv2 obligatorio', status: 'review', detail: `${ec2Total - 2} de ${ec2Total} instancias.` },
                { label: 'Volúmenes EBS cifrados', status: 'healthy', detail: `${ec2Total} de ${ec2Total} instancias.` },
                { label: 'Sin IP pública innecesaria', status: 'healthy', detail: 'Solo los bastiones tienen IP pública.' },
            ],
        },
    ];

    const findings: SecurityFinding[] = [
        {
            id: 'F-1042',
            severity: 'Alta',
            title: 'Security Group con SSH (22) abierto a 0.0.0.0/0',
            service: 'EC2',
            resource: 'sg-0a7f3c21 (web-bastion)',
            source: 'AWS Config',
            detectedAt: hoursAgo(3),
            state: 'Abierto',
            recommendation: 'Restringir el puerto 22 a la IP corporativa o usar Session Manager.',
        },
        {
            id: 'F-1039',
            severity: 'Alta',
            title: 'Bucket S3 sin bloqueo de acceso público',
            service: 'S3',
            resource: `cloudops-assets-${regionId}`,
            source: 'Security Hub',
            detectedAt: hoursAgo(9),
            state: 'En revisión',
            recommendation: 'Activar "Block Public Access" y servir el contenido mediante CloudFront (OAC).',
        },
        {
            id: 'F-1035',
            severity: 'Media',
            title: 'Llamadas a la API desde una IP inusual',
            service: 'IAM',
            resource: 'usuario: deploy-ci',
            source: 'GuardDuty',
            detectedAt: hoursAgo(20),
            state: 'En revisión',
            recommendation: 'Verificar la actividad y rotar las claves del usuario si no es reconocida.',
        },
        {
            id: 'F-1031',
            severity: 'Media',
            title: `${oldAccessKeys || 1} claves de acceso con más de 90 días`,
            service: 'IAM',
            resource: 'usuarios: analytics, backup-job',
            source: 'IAM Access Analyzer',
            detectedAt: hoursAgo(30),
            state: 'Abierto',
            recommendation: 'Rotar las claves y preferir roles IAM temporales.',
        },
        {
            id: 'F-1027',
            severity: 'Media',
            title: 'Instancia EC2 sin IMDSv2 obligatorio',
            service: 'EC2',
            resource: 'i-0b91e2f4 (app-worker-02)',
            source: 'AWS Config',
            detectedAt: hoursAgo(52),
            state: 'Abierto',
            recommendation: 'Configurar HttpTokens=required en los metadatos de la instancia.',
        },
        {
            id: 'F-1019',
            severity: 'Baja',
            title: 'RDS sin despliegue Multi-AZ',
            service: 'RDS',
            resource: 'db-reporting',
            source: 'Security Hub',
            detectedAt: hoursAgo(80),
            state: 'Abierto',
            recommendation: 'Activar Multi-AZ para alta disponibilidad.',
        },
        {
            id: 'F-1012',
            severity: 'Baja',
            title: 'Falta alarma de CloudWatch para cambios en Security Groups',
            service: 'CloudWatch',
            resource: 'cuenta',
            source: 'Security Hub',
            detectedAt: hoursAgo(120),
            state: 'Resuelto',
            recommendation: 'Crear un filtro de métricas sobre CloudTrail y una alarma con SNS.',
        },
    ];

    const score = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);

    return {
        regionId,
        score,
        metrics: { mfa, iam: iamPct, securityGroups: sgPct, cloudTrail: 100, config: configPct, guardDuty: 'Activo' },
        iam: { users, usersWithMfa, roles: vary(18, 6, 12), policies: vary(42, 10, 13), oldAccessKeys, rootMfa: true },
        network: { vpcs: vary(3, 2, 14), securityGroups, openSecurityGroups, nacls: vary(8, 4, 15), flowLogs: true },
        areas,
        resources,
        findings,
    };
}

/** Resumen con la forma que ya usa el Dashboard (tarjeta "Estado de seguridad"). */
export function getMockSecurityReport(regionId: string): SecurityReport {
    const m = getMockSecurity(regionId);
    const area = (id: SecurityArea['id']) => m.areas.find((a) => a.id === id)!;
    return {
        regionId,
        score: m.score,
        awsConnected: true,
        summary: {
            iam: level(m.metrics.iam),
            mfa: level(m.metrics.mfa),
            dataProtection: level(area('data').score),
            accountProtection: level(area('detection').score),
            compliance: 'review',
        },
        compliance: [
            { name: 'ISO 27001', status: 'healthy', note: 'Controles simulados', source: 'mock' },
            { name: 'SOC 2', status: 'review', note: 'Controles simulados', source: 'mock' },
            { name: 'GDPR', status: 'healthy', note: 'Controles simulados', source: 'mock' },
            { name: 'HIPAA', status: 'review', note: 'Controles simulados', source: 'mock' },
        ],
        groups: m.areas.map((a) => ({
            id: a.id,
            label: a.label,
            status: level(a.score),
            checks: a.controls.map((c, i) => ({
                id: `${a.id}-${i}`,
                label: c.label,
                status: c.status,
                detail: c.detail,
                source: 'mock',
                weight: 1,
                recommendation: null,
            })),
        })),
        generatedAt: new Date().toISOString(),
    };
}
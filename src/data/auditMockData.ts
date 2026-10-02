/** Datos mockeados de CloudTrail para la sección de Auditoría */

export type AuditCategory = 'security' | 'infra' | 'user' | 'cost' | 'access';
export type AuditSeverity = 'critical' | 'warning' | 'info' | 'ok';

export interface AuditEvent {
    id: number;
    category: AuditCategory;
    severity: AuditSeverity;
    action: string;
    detail: string;
    resource: string;
    user: string;
    ip: string;
    timestamp: string; // ISO
}

export const AUDIT_MOCK_EVENTS: AuditEvent[] = [
    {
        id: 1, category: 'security', severity: 'critical',
        action: 'AuthorizeSecurityGroupIngress',
        detail: 'Puerto 22 (SSH) abierto a 0.0.0.0/0 en sg-0abc123',
        resource: 'sg-0abc123', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-10-01T07:14:00Z',
    },
    {
        id: 2, category: 'infra', severity: 'info',
        action: 'RebootInstances',
        detail: 'EC2 i-0a1b2c3d (t3.medium) reiniciada en us-west-2a',
        resource: 'i-0a1b2c3d', user: 'ops@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-10-01T06:58:00Z',
    },
    {
        id: 3, category: 'user', severity: 'warning',
        action: 'AttachUserPolicy',
        detail: 'AmazonRDSFullAccess adjuntada a deploy-bot-01 (privilegio excesivo)',
        resource: 'deploy-bot-01', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-10-01T06:32:00Z',
    },
    {
        id: 4, category: 'infra', severity: 'ok',
        action: 'CreateDBSnapshot',
        detail: 'Snapshot automático prod-mysql-01 (4.2 GB) completado',
        resource: 'prod-mysql-01', user: 'aws-backup',
        ip: 'internal', timestamp: '2026-10-01T05:00:00Z',
    },
    {
        id: 5, category: 'cost', severity: 'info',
        action: 'PutMetricAlarm',
        detail: 'Alerta de costo configurada: umbral $120/mes → SNS billing-alerts',
        resource: 'billing-alerts', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-10-01T04:18:00Z',
    },
    {
        id: 6, category: 'security', severity: 'warning',
        action: 'DeleteAccessKey',
        detail: 'Clave AKIA... de deploy-bot-01 rotada (>90 días sin rotar)',
        resource: 'deploy-bot-01', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T23:45:00Z',
    },
    {
        id: 7, category: 'infra', severity: 'info',
        action: 'UpdateAutoScalingGroup',
        detail: 'ASG prod-backend ajustado: min=2, max=6, desired=4',
        resource: 'prod-backend-asg', user: 'aws-autoscaling',
        ip: 'internal', timestamp: '2026-09-30T22:10:00Z',
    },
    {
        id: 8, category: 'user', severity: 'warning',
        action: 'CreateUser',
        detail: 'Usuario dev-user-04 creado sin MFA habilitado',
        resource: 'dev-user-04', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T21:03:00Z',
    },
    {
        id: 9, category: 'infra', severity: 'ok',
        action: 'RequestCertificate',
        detail: '*.cloudops.io renovado vía ACM — válido hasta Dic 2026',
        resource: 'arn:aws:acm:us-east-1:cert/xxx', user: 'aws-acm',
        ip: 'internal', timestamp: '2026-09-30T19:42:00Z',
    },
    {
        id: 10, category: 'security', severity: 'critical',
        action: 'ConsoleLogin (FAILED)',
        detail: '3 intentos fallidos de login para dev-user-04 desde 185.220.101.x (Tor exit node)',
        resource: 'dev-user-04', user: 'dev-user-04',
        ip: '185.220.101.42', timestamp: '2026-09-30T18:29:00Z',
    },
    {
        id: 11, category: 'cost', severity: 'warning',
        action: 'ReservedInstancesExpired',
        detail: 'Reserva EC2 t3.medium (1 año) expirada sin renovar — costo on-demand activo',
        resource: 'ri-0xxxxxxxx', user: 'aws-billing',
        ip: 'internal', timestamp: '2026-09-30T17:00:00Z',
    },
    {
        id: 12, category: 'infra', severity: 'ok',
        action: 'CreateInvalidation',
        detail: 'CloudFront /assets/* invalidado — 342 archivos purgados en d1a2b3.cf.net',
        resource: 'd1a2b3', user: 'deploy-bot',
        ip: '34.120.0.0', timestamp: '2026-09-30T15:55:00Z',
    },
    {
        id: 13, category: 'access', severity: 'info',
        action: 'ConsoleLogin',
        detail: 'Acceso a consola AWS desde Lima, PE — MFA verificado ✓',
        resource: 'us-east-1', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T14:02:00Z',
    },
    {
        id: 14, category: 'infra', severity: 'warning',
        action: 'CloudWatch Alarm: CPUUtilization',
        detail: 'prod-mysql-01 CPU=82% > umbral 75% durante 8 min',
        resource: 'prod-mysql-01', user: 'cloudwatch',
        ip: 'internal', timestamp: '2026-09-30T12:14:00Z',
    },
    {
        id: 15, category: 'infra', severity: 'info',
        action: 'DeleteObject',
        detail: 'prod-assets/uploads/old-backup.tar.gz eliminado (2.1 GB)',
        resource: 'prod-assets', user: 'deploy-bot',
        ip: '34.120.0.0', timestamp: '2026-09-30T11:20:00Z',
    },
    {
        id: 16, category: 'security', severity: 'warning',
        action: 'StopFlowLogs',
        detail: 'VPC Flow Logs desactivados en vpc-0main — tráfico sin registrar',
        resource: 'vpc-0main', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T10:33:00Z',
    },
    {
        id: 17, category: 'cost', severity: 'info',
        action: 'UpdateBudget',
        detail: 'Presupuesto Q4 2026 actualizado: límite $1,500 anual + SNS',
        resource: 'budget-q4-2026', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T09:15:00Z',
    },
    {
        id: 18, category: 'user', severity: 'ok',
        action: 'EnableMFADevice',
        detail: 'MFA habilitado para ops@cloudops.io — Google Authenticator',
        resource: 'ops@cloudops.io', user: 'ops@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T08:44:00Z',
    },
    {
        id: 19, category: 'infra', severity: 'ok',
        action: 'UpdateService (ECS)',
        detail: 'cloudops-dashboard v2.3.1 desplegado en ECS Fargate — 0 errores',
        resource: 'cloudops-dashboard', user: 'deploy-bot',
        ip: '34.120.0.0', timestamp: '2026-09-30T07:30:00Z',
    },
    {
        id: 20, category: 'infra', severity: 'info',
        action: 'ChangeResourceRecordSets',
        detail: 'CNAME api.cloudops.io → backencito.onrender.com creado en Route 53',
        resource: 'cloudops.io', user: 'admin@cloudops.io',
        ip: '190.234.12.88', timestamp: '2026-09-30T06:00:00Z',
    },
];

export const SEVERITY_META: Record<AuditSeverity, { label: string; color: string; bg: string; border: string }> = {
    critical: { label: 'Crítico', color: '#DC2626', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30' },
    warning: { label: 'Aviso', color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' },
    info: { label: 'Info', color: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30' },
    ok: { label: 'OK', color: '#16A34A', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30' },
};

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
    security: 'Seguridad',
    infra: 'Infraestructura',
    user: 'Usuario / IAM',
    cost: 'Costos',
    access: 'Acceso a consola',
};
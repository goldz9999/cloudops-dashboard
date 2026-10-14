import type { HealthStatus } from '../data/regionData';
import { getMockSecurityReport } from '../data/securityMock';

/**
 * Seguridad: datos SIMULADOS (mock). No hay conexión con AWS ni con el backend.
 * Los tipos se mantienen para que el Dashboard y los reportes sigan funcionando igual.
 */

export interface ComplianceItem {
    name: string;
    status: HealthStatus;
    note: string;
    source: string;
}

/** 'unknown' = no hay datos suficientes para medir (no se inventa un estado). */
export type CheckStatus = HealthStatus | 'unknown';

export interface SecurityCheck {
    id: string;
    label: string;
    status: CheckStatus;
    detail: string;
    source: string;
    weight: number;
    recommendation: string | null;
}

export interface SecurityGroup {
    id: string;
    label: string;
    status: CheckStatus;
    checks: SecurityCheck[];
}

export interface AccessStats {
    total: number;
    last24h: number;
    last7d: number;
    uniqueIps: number;
    uniqueDevices: number;
    uniquePlaces: number;
    lastAccess: string | null;
}

export interface AccessEvent {
    type: 'impossible_travel' | 'new_ip' | 'new_device';
    severity: HealthStatus;
    at: string;
    title: string;
    detail: string;
    ip: string | null;
}

export interface SecurityReport {
    regionId: string;
    /** Puntaje calculado con datos reales (0 = nada medible todavía) */
    score: number;
    /** true solo cuando hay cuenta AWS conectada (IAM, MFA, S3, CloudTrail…) */
    awsConnected?: boolean;
    summary: {
        iam: HealthStatus;
        mfa: HealthStatus;
        dataProtection: HealthStatus;
        accountProtection: HealthStatus;
        compliance: HealthStatus;
    };
    compliance: ComplianceItem[];
    groups?: SecurityGroup[];
    accessStats?: AccessStats | null;
    accessEvents?: AccessEvent[];
    generatedAt?: string;
}

export async function fetchSecurityReport(regionId: string): Promise<SecurityReport> {
    return getMockSecurityReport(regionId);
}
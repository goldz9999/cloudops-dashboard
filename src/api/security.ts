import { api } from './client';
import type { HealthStatus } from '../data/regionData';

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
    source: 'platform' | 'access' | 'planning' | 'compliance';
    weight: number;
    recommendation: string | null;
}

export interface SecurityGroup {
    id: 'platform' | 'access' | 'planning' | 'compliance';
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
    const data = await api<{ report: SecurityReport }>(`/security/${encodeURIComponent(regionId)}`);
    return data.report;
}
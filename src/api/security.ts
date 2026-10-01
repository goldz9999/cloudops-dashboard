import { api } from './client';
import type { HealthStatus } from '../data/regionData';

export interface ComplianceItem {
    name: string;
    status: HealthStatus;
    note: string;
    source: string;
}

export interface SecurityReport {
    regionId: string;
    /** 0 = sin medir (no hay cuenta AWS conectada) */
    score: number;
    summary: {
        iam: HealthStatus;
        mfa: HealthStatus;
        dataProtection: HealthStatus;
        accountProtection: HealthStatus;
        compliance: HealthStatus;
    };
    compliance: ComplianceItem[];
}

export async function fetchSecurityReport(regionId: string): Promise<SecurityReport> {
    const data = await api<{ report: SecurityReport }>(`/security/${encodeURIComponent(regionId)}`);
    return data.report;
}
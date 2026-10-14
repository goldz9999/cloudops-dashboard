import { api } from './client';
import type { SecurityGroup, CheckStatus } from './security';

/** Informe de seguridad del ERP EnterpriseCloud, medido por Backencito (GET /api/erp-security). */
export interface ErpSecurityReport {
    configured: boolean;
    reachable: boolean;
    erpUrl: string;
    checkedAt: string | null;
    score: number;
    status: CheckStatus;
    groups: SecurityGroup[];
}

export const fetchErpSecurity = (refresh = false) =>
    api<ErpSecurityReport>(`/erp-security${refresh ? '?refresh=true' : ''}`);
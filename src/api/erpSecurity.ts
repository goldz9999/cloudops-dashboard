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

/* ── Seguridad por módulo (GET /api/erp-security/modules) ─────────────── */

/** measured = comprobado en vivo · declared = según el código del ERP · gap = lo que cubriría AWS */
export type ControlState = 'measured' | 'declared' | 'gap';

export interface ModuleControl {
    id: string;
    label: string;
    state: ControlState;
    value: number | null;
    weight: number;
    detail: string;
    service: string | null;
}

export interface ModuleSecurity {
    id: string;
    label: string;
    criticality: number;
    score: number;
    scoreWithAws: number;
    priority: number;
    rank: number;
    controls: ModuleControl[];
}

export interface AwsServiceCost {
    id: string;
    label: string;
    monthlyUsd: number | null;
    assumption: string;
    coverage: number;
    sideEffect: string;
    covers: string[];
}

export interface ErpModulesReport {
    configured: boolean;
    reachable: boolean;
    erpUrl: string;
    checkedAt: string | null;
    summary?: {
        score: number;
        scoreWithAws: number;
        mostNeeded: { id: string; label: string; score: number };
        planCostUsd: number;
        planCostPending: boolean;
    };
    iam?: { score: number; scoreWithAws: number; controls: ModuleControl[] };
    modules?: ModuleSecurity[];
    services?: AwsServiceCost[];
    notes?: string[];
}

export const fetchErpModules = (refresh = false) =>
    api<ErpModulesReport>(`/erp-security/modules${refresh ? '?refresh=true' : ''}`);
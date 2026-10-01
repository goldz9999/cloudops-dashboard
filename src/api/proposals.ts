import { api } from './client';
import type { Proposal } from '../components/planificacion/planTypes';

export interface ProposalCreate {
    name: string;
    type: string;
    description?: string;
    regionId: string;
    users: string;
    availability: string;
    migration: string;
    selected: string[];
}

export async function fetchProposals(): Promise<Proposal[]> {
    const data = await api<{ proposals: Proposal[] }>('/proposals');
    return data.proposals ?? [];
}

export async function createProposal(body: ProposalCreate): Promise<Proposal> {
    return api<Proposal>('/proposals', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function deleteProposal(id: number): Promise<void> {
    await api<void>(`/proposals/${id}`, { method: 'DELETE' });
}

export async function applyProposalToCostsApi(id: number): Promise<{ regionId: string; rows: unknown[] }> {
    return api(`/proposals/${id}/apply-to-costs`, { method: 'POST' });
}

export interface CostsResponse {
    regionId: string;
    source: string;
    rows: { id: number; service: string; quantity: number; hours: number; rate: number; monthly: number }[];
    totals: { monthly: number; annual: number };
}

export async function fetchRegionCosts(regionId: string): Promise<CostsResponse> {
    return api<CostsResponse>(`/costs/${regionId}`);
}
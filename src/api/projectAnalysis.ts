import { API, ApiError, api } from './client';

/** Análisis de un proyecto subido, hecho con Gemini desde Backencito (POST /api/project-analysis). */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';
export type FindingCategory = 'security' | 'scalability';

export interface AwsServiceRef {
    service: string;
    reason: string;
}

export interface AnalysisFinding {
    id: string;
    title: string;
    category: FindingCategory;
    severity: FindingSeverity;
    description: string;
    files: string[];
    evidence: string;
    fix: string;
    awsServices: AwsServiceRef[];
}

export interface RecommendedService {
    service: string;
    findingIds: string[];
    reasons: string[];
    maxSeverity: FindingSeverity;
}

export interface ProjectAnalysisReport {
    analyzedAt: string;
    model: string;
    summary: string;
    stack: string[];
    security: { score: number; risk: number; findings: number };
    scalability: { score: number; risk: number; findings: number };
    overall: { score: number; risk: number; testsRequired: boolean; testsReasons: string[]; testsThreshold: number };
    findings: AnalysisFinding[];
    recommendedServices: RecommendedService[];
    positives: string[];
    suggestedTests: { type: string; why: string }[];
    files: {
        analyzed: number;
        skipped: number;
        skippedByReason: Record<string, number>;
        totalKb: number;
        truncated: boolean;
        list: string[];
    };
    warnings: string[];
}

export interface AnalysisStatus {
    configured: boolean;
    model: string;
    maxFiles: number;
    maxFileKb: number;
    maxTotalKb: number;
    maxZipMb: number;
    testsRiskThreshold: number;
}

export const fetchAnalysisStatus = () => api<AnalysisStatus>('/project-analysis/status');

export interface UploadItem {
    file: File;
    /** Ruta relativa dentro del proyecto (p. ej. src/App.tsx). */
    path: string;
}

/** Envía el .zip del proyecto (o archivos sueltos) por multipart. No usa api() porque el navegador debe fijar el Content-Type. */
export async function analyzeProject(items: UploadItem[], signal?: AbortSignal): Promise<ProjectAnalysisReport> {
    const form = new FormData();
    for (const it of items) {
        form.append('files', it.file, it.file.name);
        form.append('paths', it.path);
    }

    const res = await fetch(`${API}/project-analysis`, { method: 'POST', body: form, signal });
    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const body = await res.json();
            if (typeof body?.detail === 'string') message = body.detail;
            else if (Array.isArray(body?.detail)) {
                message = body.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
            }
        } catch {
            /* ignore */
        }
        throw new ApiError(res.status, message);
    }
    return res.json() as Promise<ProjectAnalysisReport>;
}
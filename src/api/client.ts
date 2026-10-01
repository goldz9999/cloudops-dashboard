/** Cliente HTTP hacia Backencito (FastAPI). */

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:4000/api';

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API}${path.startsWith('/') ? path : `/${path}`}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });

    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const body = await res.json();
            message = body?.error?.message || body?.detail || message;
            if (Array.isArray(body?.detail)) {
                message = body.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
            }
        } catch {
            /* ignore */
        }
        throw new ApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export { API };
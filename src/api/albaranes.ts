import api from './axios';
import { getSessionKey } from '../utils/sessionKey';

export type AlbaranType = 'incoming' | 'outgoing';
export type AlbaranStatus = 'pending' | 'completed';

export type AlbaranLine = {
    id?: number;
    sku: string;
    qty: number;
    unit: string;
    note?: string | null;
};

export type Albaran = {
    id: number;
    type: AlbaranType;
    origin?: string | null;
    source_image_name?: string | null;
    status: AlbaranStatus;
    created_at: string;
    completed_at?: string | null;
    lines: AlbaranLine[];
};

export type AlbaranPending = {
    id: number;
    type: AlbaranType;
    origin?: string | null;
    sourceImageName?: string | null;   // Normalizamos a camelCase
    created_at: string;                // Lo dejamos tal cual espera el panel
    lines: AlbaranLine[];
};

export type AlbaranDetail = AlbaranPending;

// ──────────────────────────────────────────────────────────────────────────────
// Normalizadores: convierten snake_case del backend a camelCase donde haga falta
// ──────────────────────────────────────────────────────────────────────────────
function normalizeLine(raw: any): AlbaranLine {
    return {
        sku: raw.sku,
        qty: Number(raw.qty),
        unit: raw.unit,
        note: raw.note ?? null,
    };
}

function normalizeAlbaran(raw: any): AlbaranPending {
    // El backend probablemente devuelve source_image_name y created_at
    return {
        id: Number(raw.id),
        type: raw.type as AlbaranType,
        origin: raw.origin ?? null,
        sourceImageName: raw.sourceImageName ?? raw.source_image_name ?? null,
        created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
        lines: Array.isArray(raw.lines) ? raw.lines.map(normalizeLine) : [],
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Lista albaranes pendientes por tipo (incoming/outgoing).
 * GET /albaranes/pending?type=incoming|outgoing
 */
export async function fetchPending(type: AlbaranType): Promise<AlbaranPending[]> {
    const r = await api.get(`/albaranes/pending`, {
        params: { type, session_key: getSessionKey() }   // <-- filtra por sesión
    });
    return r.data as AlbaranPending[];
}

/**
 * Detalle de un albarán.
 * GET /albaranes/:id
 */
export async function fetchAlbaran(id: number): Promise<AlbaranDetail> {
    const r = await api.get(`/albaranes/${id}`);
    return normalizeAlbaran(r.data);
}

/**
 * Marca un albarán como completado.
 * POST /albaranes/:id/complete
 */
export async function completeAlbaran(id: number) {
    const r = await api.post<{ ok: boolean; id: number; status: AlbaranStatus }>(`/albaranes/${id}/complete`);
    return r.data;
}

// Confirmación desde OCR Review
export async function commitOCRAlbaran(payload: {
    type: AlbaranType;
    origin?: string;
    source_image_name?: string;
    lines: { sku: string; qty: number; unit: string; note?: string | null }[];
}) {
    const r = await api.post<Albaran>(`/albaranes/commit`, payload);
    return r.data;
}

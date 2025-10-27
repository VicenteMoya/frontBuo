import api from './axios';

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
    sourceImageName?: string | null;
    created_at: string;
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

export interface CommitPayload {
    type: AlbaranType;
    origin?: string;
    sourceImageName?: string;
    items: {
        sku: string;
        qty: number;
        unit: string;
        note?: string | null;
    }[];
}

export async function fetchPending(type: AlbaranType): Promise<AlbaranPending[]> {
    const r = await api.get(`/albaranes/pending`, {
        params: { type }
    });
    return (r.data as any[]).map(normalizeAlbaran);
}

export async function fetchAlbaran(id: number): Promise<AlbaranDetail> {
    const r = await api.get(`/albaranes/${id}`);
    return normalizeAlbaran(r.data);
}

export async function completeAlbaran(id: number) {
    const r = await api.post<{ ok: boolean; id: number; status: AlbaranStatus }>(
        `/albaranes/${id}/complete`
    );
    return r.data;
}

export async function commitOCRAlbaran(payload: CommitPayload) {
    const r = await api.post<Albaran>(`/albaranes/commit`, payload);
    return r.data;
}

export interface AssignPayload {
    type: AlbaranType;
    items: {
        sku: string;
        qty: number;
        unit: string;
        note?: string | null;
    }[];
}

export function assignOCRAlbaran(
    albaranId: number,
    payload: AssignPayload
) {
    return api.patch(
        `/albaranes/${albaranId}/complete`,
        payload,
        { validateStatus: (status) => status >= 200 && status < 300 }
    );
}

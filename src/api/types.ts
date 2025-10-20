// src/api/types.ts
export type OcrItem = {
    sku?: string;
    name: string;
    qty: number;
    score?: number;
    source?: string;
    unit?: 'unidad'|'kg'|'caja'|'litro'; // extiende según tus unidades
    note?: string;
};

export type OcrResult = { items: OcrItem[] };

export type MovementInput = {
    type: 'incoming' | 'outgoing';
    items: { sku: string; qty: number; unit: string; note?: string }[];
    origin?: 'ocr';
    sourceImageName?: string;
};

export type OutgoingCreate = {
    sku: string;
    qty: number;
    unit: string;
    note?: string;
    allocations?: { lot_id: number; qty: number }[];
    order_ref?: string;
};

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/axios";
import { useScanner } from "../hooks/useScanner";

import TicketEditor from "../components/TicketEditor";
import type { TicketLine } from "../components/TicketEditor";


type TicketType = "incoming" | "outgoing";

const normalizeSku = (s: string) => (s || "").trim().toUpperCase();

export default function BarcodeTicket() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const type = (params.get("type") as TicketType) || "incoming";
    const title =
        type === "incoming"
            ? "Entrada por código de barras"
            : "Salida por código de barras";

    const [lines, setLines] = useState<TicketLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const onScan = useCallback(
        async (rawCode: string) => {
            const sku = normalizeSku(rawCode);
            if (!sku) return;

            if (busy) return;
            setError(null);

            try {
                setBusy(true);

                const res = await api.get(`/products/by-sku/${encodeURIComponent(sku)}`);
                const prod = res.data as { sku: string; name: string; unit: string };

                setLines((prev) => {
                    const idx = prev.findIndex((l) => l.sku === prod.sku);
                    if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
                        return copy;
                    }
                    return [...prev, { sku: prod.sku, name: prod.name, unit: prod.unit, qty: 1 }];
                });
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ||
                    e?.response?.data?.message ||
                    "SKU no reconocido";
                setError(String(msg));
            } finally {
                setBusy(false);
            }
        },
        [busy]
    );

    // lector “teclado”
    useScanner(onScan);

    const inc = (sku: string) => {
        setLines((prev) =>
            prev.map((l) => (l.sku === sku ? { ...l, qty: l.qty + 1 } : l))
        );
    };

    const dec = (sku: string) => {
        setLines((prev) =>
            prev
                .map((l) => (l.sku === sku ? { ...l, qty: l.qty - 1 } : l))
                .filter((l) => l.qty > 0)
        );
    };

    const removeLine = (sku: string) => {
        setLines((prev) => prev.filter((l) => l.sku !== sku));
    };

    const clearAll = () => {
        setLines([]);
        setError(null);
    };

    const confirmTicket = async () => {
        if (lines.length === 0) {
            setError("El ticket está vacío");
            return;
        }

        try {
            setBusy(true);
            setError(null);

            const commitRes = await api.post("/albaranes/commit", {
                type,
                origin: "barcode",
                items: lines.map((l) => ({
                    sku: l.sku,
                    qty: l.qty,
                    unit: l.unit,
                })),
            });

            const albaranId = commitRes.data?.id;
            if (!albaranId) throw new Error("No se pudo crear el albarán");

            await api.post(`/albaranes/${albaranId}/apply`);

            navigate(-1);
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.message ||
                "Error confirmando ticket";
            setError(String(msg));
        } finally {
            setBusy(false);
        }
    };

    return (
        <TicketEditor
            title={title}
            subtitle="Escáner tipo teclado (flujo actual)"
            lines={lines}
            busy={busy}
            error={error}
            onBack={() => navigate(-1)}
            onClear={clearAll}
            onInc={inc}
            onDec={dec}
            onRemove={removeLine}
            onConfirm={confirmTicket}
            confirmLabel="Confirmar y aplicar"
        />
    );
}

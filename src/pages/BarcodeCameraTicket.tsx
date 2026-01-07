import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Typography, Alert } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/axios";
import TicketEditor from "../components/TicketEditor";
import type { TicketLine } from "../components/TicketEditor";


import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";


type TicketType = "incoming" | "outgoing";

const normalizeSku = (s: string) => (s || "").trim().toUpperCase();

export default function BarcodeCameraTicket() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const type = (params.get("type") as TicketType) || "incoming";
    const title =
        type === "incoming"
            ? "Entrada con cámara"
            : "Salida con cámara";

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    const [lines, setLines] = useState<TicketLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [cameraOn, setCameraOn] = useState(false);
    const [lastCode, setLastCode] = useState<string>("");
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Para evitar que lea el mismo código 20 veces seguidas:
    const lastScanAtRef = useRef<number>(0);
    const lastScanCodeRef = useRef<string>("");

    const addSku = useCallback(
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

    const startCamera = useCallback(async () => {
        setCameraError(null);

        try {
            if (!videoRef.current) return;

            // crea lector si no existe
            if (!readerRef.current) {
                readerRef.current = new BrowserMultiFormatReader();
            }

            setCameraOn(true);

            // intenta usar cámara trasera
            const constraints: MediaStreamConstraints = {
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            };

            // ZXing se encarga de pedir permisos y conectar el stream
            const reader = readerRef.current;

            await reader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const code = result.getText();
                        const now = Date.now();

                        // throttle: mismo código en <1200ms => ignorar
                        if (
                            code === lastScanCodeRef.current &&
                            now - lastScanAtRef.current < 1200
                        ) {
                            return;
                        }

                        lastScanCodeRef.current = code;
                        lastScanAtRef.current = now;

                        setLastCode(code);
                        addSku(code);
                    } else if (err) {
                        // NotFoundException es normal cuando no hay código en el frame
                        if (!(err instanceof NotFoundException)) {
                            // otros errores sí nos interesan
                            // console.debug(err);
                        }
                    }
                }
            );
        } catch (e: any) {
            setCameraOn(false);
            setCameraError(
                e?.message ||
                "No se pudo iniciar la cámara (¿permisos? ¿HTTPS?)"
            );
        }
    }, [addSku]);

    const stopCamera = useCallback(() => {
        try {
            readerRef.current?.reset();
        } catch {}
        setCameraOn(false);
    }, []);

    useEffect(() => {
        // Apaga cámara al salir de la pantalla
        return () => {
            try {
                readerRef.current?.reset();
            } catch {}
        };
    }, []);

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
                origin: "camera",
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
        <Box>
            {/* Bloque cámara arriba */}
            <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
                <Stack spacing={1.5}>
                    {cameraError && <Alert severity="warning">{cameraError}</Alert>}

                    <Stack direction="row" spacing={1}>
                        {!cameraOn ? (
                            <Button variant="contained" onClick={startCamera} disabled={busy}>
                                Iniciar cámara
                            </Button>
                        ) : (
                            <Button variant="outlined" color="error" onClick={stopCamera}>
                                Parar cámara
                            </Button>
                        )}

                        <Box flex={1} />

                        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                            Último: {lastCode || "—"}
                        </Typography>
                    </Stack>

                    {/* Video */}
                    <Box
                        sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "black",
                        }}
                    >
                        <video
                            ref={videoRef}
                            style={{ width: "100%", height: "260px", objectFit: "cover" }}
                            muted
                            playsInline
                        />
                    </Box>
                </Stack>
            </Box>

            {/* Ticket (reutilizado) */}
            <TicketEditor
                title={title}
                subtitle="Escanea con cámara. (Si no inicia: luego resolvemos HTTPS/permisos)"
                lines={lines}
                busy={busy}
                error={error}
                onBack={() => {
                    stopCamera();
                    navigate(-1);
                }}
                onClear={clearAll}
                onInc={inc}
                onDec={dec}
                onRemove={removeLine}
                onConfirm={confirmTicket}
                confirmLabel="Confirmar y aplicar"
            />
        </Box>
    );
}

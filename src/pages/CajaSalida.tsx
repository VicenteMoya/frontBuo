import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Typography,
    Alert,
    Snackbar,
    Switch,
    FormControlLabel,
    Paper,
    Chip,
    FormControl,
    InputLabel,
    Select
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import api from "../api/axios";
import { getSessionKey } from "../utils/sessionKey";

const PendingAlbaranesPanel = React.lazy(
    () => import("../components/PendingAlbaranesPanel")
);

type Product = { sku: string; name: string; unit?: string };

const UNITS = ["unidad", "kg"];

export default function CajaSalida() {
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [sku, setSku] = useState<string>("");
    const [unit, setUnit] = useState<string>("unidad");
    const [qty, setQty] = useState<number>(1);
    const [note, setNote] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );
    const [snackOpen, setSnackOpen] = useState(false);
    const [useScale, setUseScale] = useState(false);

    useEffect(() => {
        (async () => {
            const r = await api.get<Product[]>("/products");
            setCatalog(r.data || []);
        })();
    }, []);

    const selected = useMemo(
        () => catalog.find((p) => p.sku === sku) ?? null,
        [catalog, sku]
    );

    const step = unit === "unidad" ? 1 : 0.01;
    const isInteger = unit === "unidad";

    const normalizeQty = (v: number) => {
        if (Number.isNaN(v) || v <= 0) return 1;
        if (isInteger) return Math.floor(v);
        return Number(v.toFixed(2));
    };

    const readScale = async () => {
        try {
            setBusy(true);
            await new Promise((r) => setTimeout(r, 350));
            setQty((prev) => normalizeQty(prev));
            setMsg({ type: "success", text: "Lectura simulada de báscula." });
            setSnackOpen(true);
        } catch (err) {
            setMsg({
                type: "error",
                text: "No se pudo leer la báscula"
            });
            setSnackOpen(true);
        } finally {
            setBusy(false);
        }
    };

    const send = async () => {
        try {
            setBusy(true);
            const body = {
                sku,
                qty: normalizeQty(qty),
                unit,
                order_ref: note || undefined
            };
            await api.post("/outgoing", body);

            setMsg({ type: "success", text: "Salida registrada correctamente." });
            setSnackOpen(true);
            setQty(1);
            setNote("");
        } catch (e: any) {
            setMsg({
                type: "error",
                text: e?.response?.data?.detail || "Error al registrar salida"
            });
            setSnackOpen(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {msg && (
                <Box mb={2}>
                    <Alert
                        severity={msg.type}
                        onClose={() => {
                            setMsg(null);
                        }}
                    >
                        {msg.text}
                    </Alert>
                </Box>
            )}

            {/* CARD PRINCIPAL — Igual que ENTRADA */}
            <Card>
                <CardContent>
                    {/* === GRID PRINCIPAL === */}
                    <Box
                        display="grid"
                        gridTemplateColumns="1.8fr 0.8fr 0.8fr 1.8fr"
                        gap={2}
                        alignItems="center"
                    >
                        {/* PRODUCTO */}
                        <Autocomplete
                            options={catalog}
                            value={selected}
                            onChange={(_, val) => {
                                if (val) {
                                    setSku(val.sku);
                                    if (val.unit) setUnit(val.unit);
                                } else {
                                    setSku("");
                                }
                            }}
                            isOptionEqualToValue={(o, v) => o?.sku === v?.sku}
                            getOptionLabel={(o) => (o ? `${o.sku} — ${o.name}` : "")}
                            renderInput={(params) => (
                                <TextField {...params} label="Producto (buscar)" />
                            )}
                        />

                        {/* CANTIDAD */}
                        <TextField
                            label="Cantidad"
                            type="number"
                            inputProps={{ step, min: 0 }}
                            value={qty}
                            onChange={(e) => setQty(normalizeQty(Number(e.target.value)))}
                        />

                        {/* UNIDAD */}
                        <FormControl>
                            <InputLabel id="unit-label">Unidad</InputLabel>
                            <Select
                                labelId="unit-label"
                                label="Unidad"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as string)}
                            >
                                {UNITS.map((u) => (
                                    <MenuItem key={u} value={u}>
                                        {u}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* NOTA */}
                        <TextField
                            label="Nota"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Observaciones"
                        />
                    </Box>

                    {/* === FILA SECUNDARIA === */}
                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={useScale}
                                    onChange={(e) => setUseScale(e.target.checked)}
                                />
                            }
                            label="Usar báscula"
                        />

                        <Button
                            variant="outlined"
                            disabled={!useScale || busy}
                            onClick={readScale}
                        >
                            Leer báscula
                        </Button>

                        <Box flex={1} />

                        <Button
                            variant="contained"
                            disabled={!sku || busy}
                            onClick={send}
                            sx={{ minWidth: 200 }}
                        >
                            Registrar salida
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* === BLOQUE INFERIOR — Albaranes de VENTA pendientes a lo ancho === */}
            <Box mt={3}>
                <Suspense fallback={<Paper sx={{ p: 2 }}>Cargando albaranes…</Paper>}>
                    <PendingAlbaranesPanel
                        type="outgoing"
                        sessionKey={getSessionKey()}
                    />
                </Suspense>
            </Box>

            <Snackbar
                open={snackOpen}
                autoHideDuration={2400}
                onClose={() => setSnackOpen(false)}
            >
                <Alert onClose={() => setSnackOpen(false)} severity={msg?.type}>
                    {msg?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}


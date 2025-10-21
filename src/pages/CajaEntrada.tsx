import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert, Box, Button, Card, CardContent, Chip, Grid, Typography,
    Autocomplete, Paper, ToggleButton, ToggleButtonGroup, FormControl,
    InputLabel, Select, MenuItem, TextField
} from "@mui/material";
import api from "../api/axios";
import { useScanner } from "../hooks/useScanner";
import { useScale } from "../hooks/useScale";
const PendingAlbaranesPanel = React.lazy(() => import('../components/PendingAlbaranesPanel'));

type Product = { sku: string; name: string; unit: string };
type Msg = { type: "success" | "error"; text: string } | null;
type Mode = "scale" | "manual";

// lista de unidades visibles en el selector
const UNIT_OPTIONS = ["unidad", "kg", "g", "l", "ml", "caja"];

export default function CajaEntrada() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sku, setSku] = useState<string>("");
    const [qty, setQty] = useState<number>(0);
    const [unit, setUnit] = useState<string>("kg");
    const [note, setNote] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<Msg>(null);

    const scaleWs = import.meta.env.VITE_SCALE_WS_URL || null;
    const scale = useScale(scaleWs);
    const [mode, setMode] = useState<Mode>(() => (scaleWs ? "scale" : "manual"));

    // cargar productos
    useEffect(() => {
        api.get<Product[]>("/products").then(r => setProducts(r.data)).catch(() => {});
    }, []);

    // si la báscula se desconecta y estamos en modo scale → pasamos a manual
    useEffect(() => {
        if (mode === "scale" && !scale.connected) setMode("manual");
    }, [mode, scale.connected]);

    // si estamos en modo báscula y conectada → qty = peso; unidad de la báscula si viene
    useEffect(() => {
        if (mode === "scale" && scale.connected) {
            setQty(Number(scale.weight.toFixed(3)));
            if (scale.unit) setUnit(scale.unit);
        }
    }, [mode, scale.connected, scale.weight, scale.unit]);

    // si la unidad es "unidad", forzamos modo manual (no tiene sentido leer peso)
    useEffect(() => {
        if (unit === "unidad" && mode === "scale") setMode("manual");
    }, [unit, mode]);

    // scanner: si lee un SKU válido, lo selecciona y pone su unidad canónica
    const onScan = useCallback((code: string) => {
        const p = products.find(x => x.sku === code) || null;
        if (p) { setSku(p.sku); setUnit(p.unit); setMsg({ type: "success", text: `SKU ${code} leído` }); }
        else setMsg({ type: "error", text: `Código ${code} no corresponde a un SKU` });
    }, [products]);
    useScanner(onScan);

    const productOptions = useMemo(
        () => products.map(p => ({ label: `${p.sku} — ${p.name}`, sku: p.sku, unit: p.unit })),
        [products]
    );
    const selectedProduct = useMemo(() => products.find(p => p.sku === sku) || null, [products, sku]);

    // helper: ¿la cantidad es válida según unidad?
    const isIntegerUnit = unit === "unidad";
    const qtyIsInteger = Number.isInteger(qty);
    const qtyValid = qty > 0 && (!isIntegerUnit || qtyIsInteger);

    const submit = async () => {
        if (!selectedProduct) { setMsg({ type: "error", text: "Selecciona un producto" }); return; }
        if (!qtyValid) {
            setMsg({
                type: "error",
                text: isIntegerUnit ? "Cantidad debe ser un entero mayor que 0" : "Cantidad debe ser > 0"
            });
            return;
        }
        // comprobación de unidad canónica del producto (política acordada)
        if (unit !== selectedProduct.unit) {
            setMsg({ type: "error", text: `Unidad inválida. Esperado: ${selectedProduct.unit}` });
            return;
        }

        setBusy(true);
        try {
            const body = { sku: selectedProduct.sku, qty, unit, note };
            const resp = await api.post("/incoming", body);
            setMsg({ type: "success", text: `Entrada registrada. Lote ${resp.data?.lot?.lot_code || ""}` });
            setQty(isIntegerUnit ? 0 : 0); // resetea
            setNote("");
        } catch (e: any) {
            setMsg({ type: "error", text: e?.response?.data?.detail || "Error al registrar" });
        } finally {
            setBusy(false);
        }
    };

    // cuando cambia el producto, fijamos la unidad a su canónica
    useEffect(() => {
        if (selectedProduct) setUnit(selectedProduct.unit);
    }, [selectedProduct]);

    return (
        <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid item xs={12}><Typography variant="h5">Groupymes · Caja Entrada</Typography></Grid>

            {msg && <Grid item xs={12}><Alert severity={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert></Grid>}

            <Grid item xs={12} md={8}>
                <Card>
                    <CardContent>
                        <Box display="grid" gap={2}>
                            <Autocomplete
                                options={productOptions}
                                isOptionEqualToValue={(o, v) => o?.sku === v?.sku}
                                getOptionLabel={(o:any)=> o?.label ?? ''}
                                onChange={(_, val) => { setSku(val?.sku || ""); if (val?.unit) setUnit(val.unit); }}
                                renderInput={(params) => <TextField {...params} label="Producto (SKU — Nombre)" />}
                                value={productOptions.find(o => o.sku === sku) || null}
                            />

                            {/* Selector de modo: Báscula / Manual */}
                            <Box display="flex" alignItems="center" gap={2}>
                                <ToggleButtonGroup
                                    exclusive
                                    size="small"
                                    value={mode}
                                    onChange={(_, v: Mode | null) => { if (v) setMode(v); }}
                                >
                                    <ToggleButton value="scale" disabled={!scaleWs || unit === "unidad"}>
                                        Báscula
                                    </ToggleButton>
                                    <ToggleButton value="manual">Manual</ToggleButton>
                                </ToggleButtonGroup>

                                <Chip
                                    label={mode === "scale"
                                        ? (scale.connected ? "Báscula conectada" : "Báscula desconectada")
                                        : "Entrada manual"}
                                    color={mode === "scale" && scale.connected ? "success" : "default"}
                                    variant="outlined"
                                />
                            </Box>

                            {/* Cantidad + Unidad (select) */}
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Cantidad"
                                    type="number"
                                    value={Number.isFinite(qty) ? qty : 0}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        // si la unidad es "unidad" solo permitimos enteros
                                        setQty(isIntegerUnit ? Math.trunc(v) : v);
                                    }}
                                    // spinner: siempre de 1 en 1; permitir decimales cuando no es "unidad"
                                    inputProps={{ step: isIntegerUnit ? 1 : "any" }}
                                    sx={{ flex: 1 }}
                                    disabled={mode === "scale"} // bloqueado si pesa la báscula
                                    error={!qtyValid && qty > 0}
                                    helperText={!qtyValid && qty > 0 ? "Para 'unidad' la cantidad debe ser entera" : undefined}
                                />

                                <FormControl sx={{ width: 180 }}>
                                    <InputLabel id="unit-label">Unidad</InputLabel>
                                    <Select
                                        labelId="unit-label"
                                        label="Unidad"
                                        value={unit}
                                        onChange={(e) => setUnit(String(e.target.value))}
                                    >
                                        {UNIT_OPTIONS.map(u => (
                                            <MenuItem key={u} value={u}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <TextField
                                label="Nota"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                multiline
                                minRows={2}
                            />

                            <Button disabled={busy} variant="contained" onClick={submit}>Registrar entrada</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Báscula</Typography>
                    <Box mt={1} display="flex" gap={1} alignItems="center">
                        <Chip label={scale.connected ? "Conectada" : "Desconectada"} color={scale.connected ? "success" : "default"} />
                        <Chip label={`${scale.weight?.toFixed(3) || "0.000"} ${scale.unit || ""}`} />
                    </Box>
                    <Box p={2} display="grid" gridTemplateColumns="1fr 380px" gap={2}>
                        {/* Columna izquierda: formulario existente de entrada (suma stock) */}
                        <Paper sx={{ p:2 }}>
                            {/* ...tu UI actual para registrar ENTRADA manual (que suma stock)... */}
                        </Paper>

                        {/* Columna derecha: albaranes de COMPRA pendientes */}
                        <Suspense fallback={<Paper sx={{ p:2 }}>Cargando albaranes…</Paper>}>
                            <PendingAlbaranesPanel type="incoming" />
                        </Suspense>
                    </Box>
                    <Typography variant="caption">WS: {scaleWs || "manual"}</Typography>
                </Paper>
            </Grid>
        </Grid>
    );
}

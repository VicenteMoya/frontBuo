import React, { Suspense, useEffect, useMemo, useState } from "react";
import {Box, Button, Card, CardContent, TextField, MenuItem, Typography, Alert, Snackbar, Switch, FormControlLabel, Paper} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import api from "../api/axios";
const PendingAlbaranesPanel = React.lazy(() => import('../components/PendingAlbaranesPanel'));

type Product = { sku: string; name: string; unit?: string };

const UNITS = ['unidad','kg','caja'];

export default function CajaSalida() {
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [sku, setSku] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [unit, setUnit] = useState<string>('unidad');
    const [qty, setQty] = useState<number>(1);
    const [note, setNote] = useState<string>('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{type:"success"|"error", text:string}|null>(null);
    const [snackOpen, setSnackOpen] = useState(false);
    const [useScale, setUseScale] = useState(false); // igual que entrada: permitir báscula o manual

    useEffect(() => {
        (async () => {
            const r = await api.get<Product[]>('/products');
            setCatalog(r.data || []);
        })();
    }, []);

    // si elige producto del catálogo, fijamos sku y name
    const selected = useMemo(() => catalog.find(p => p.sku === sku) ?? null, [catalog, sku]);

    const step = unit === 'unidad' ? 1 : 0.01;
    const isIntegerOnly = unit === 'unidad';

    const canSend = sku && qty > 0 && unit;

    const normalizeQty = (value: number) => {
        if (Number.isNaN(value) || value <= 0) return 1;
        if (isIntegerOnly) return Math.floor(value);
        return Number(value.toFixed(2));
    };

    const handleSnackClose = (_e?: unknown, reason?: string) => {
        // ignore clickaway to avoid double-close
        if (reason === 'clickaway') return;
        setSnackOpen(false);
    };

    const readScale = async () => {
        try {
            setBusy(true);
            // si ya tienes endpoint de báscula, úsalo; mientras, simular lectura:
            // const r = await api.get('/scale/read');
            // setQty(normalizeQty(r.data.weight));
            await new Promise(r => setTimeout(r, 400));
            // demo: valor simulado
            setQty(prev => normalizeQty(prev)); // deja lo que hay (o pon un número de ejemplo)
            setMsg({type:"success", text:"Lectura de báscula simulada (ajusta cuando conectemos la real)."});
            setSnackOpen(true);
        } catch (e:any) {
            setMsg({type:"error", text: e?.response?.data?.detail || "No se pudo leer la báscula"});
        } finally {
            setBusy(false);
        }
    };

    const send = async () => {
        try {
            setBusy(true); setMsg(null);
            const body = {
                sku,
                qty: normalizeQty(qty),
                unit,
                order_ref: note || undefined,
                // allocations: undefined -> FIFO en backend
            };
            await api.post('/outgoing', body);
            setMsg({type:"success", text:"Salida registrada correctamente."});
            setSnackOpen(true);
            // reset suave dejando el producto seleccionado
            setQty(1);
            setNote('');
        } catch (e:any) {
            console.error(e);
            setMsg({ type: "error", text: (e?.response?.data?.detail ?? e?.message ?? "Error al registrar la salida") });
            setSnackOpen(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ p:2 }}>
            <Card>
                <CardContent />
                <Box display="grid" gridTemplateColumns="1.8fr 0.8fr 0.8fr 1.8fr" gap={2} alignItems="center">
                    <Autocomplete
                        options={catalog}
                        value={selected}
                        onChange={(_, val) => {
                            if (val) { setSku(val.sku); setName(val.name); if (val.unit) setUnit(val.unit); }
                        }}
                        isOptionEqualToValue={(o, v) => o?.sku === v?.sku}
                        getOptionLabel={(o) => (o ? `${o.sku} — ${o.name}` : "")}
                        renderInput={(params) =>
                            <TextField {...params} label="Producto (buscar)" placeholder="SKU / nombre"
                                       onChange={(e)=> { setSku(''); setName(e.target.value); }} />
                        }
                    />

                    <TextField
                        label="Cantidad" type="number"
                        inputProps={{ step: isIntegerOnly ? 1 : 0.01, min: 0 }}
                        value={qty}
                        onChange={e=> setQty(normalizeQty(Number(e.target.value)))}
                    />

                    <TextField select label="Unidad" value={unit} onChange={e=> setUnit(e.target.value)}>
                        {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>

                    <TextField label="Nota" value={note} onChange={e=> setNote(e.target.value)} placeholder="Observaciones" />
                </Box>

                <Box display="flex" alignItems="center" gap={2} mt={2}>
                    <FormControlLabel
                        control={<Switch checked={useScale} onChange={(e)=> setUseScale(e.target.checked)} />}
                        label="Usar báscula"
                    />
                    <Button variant="outlined" disabled={!useScale || busy} onClick={readScale}>
                        Leer báscula
                    </Button>
                    <Box flex={1} />
                    <Button variant="contained" disabled={!canSend || busy || !sku} onClick={send}>
                        Registrar salida
                    </Button>
                </Box>
            </Card>

            <Snackbar
                open={snackOpen}
                autoHideDuration={2600}
                onClose={handleSnackClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transitionDuration={{ enter: 200, exit: 150 }}
                onExited={() => setSnackOpen(false)}
            >
                <Alert onClose={handleSnackClose} severity={msg?.type || 'success'}>
                    {msg?.text ?? ''}
                </Alert>
            </Snackbar>
            <Box p={2} display="grid" gridTemplateColumns="1fr 380px" gap={2}>
                {/* Columna izquierda: formulario existente de salida (resta stock) */}
                <Paper sx={{ p:2 }}>
                    {/* ...tu UI actual para registrar SALIDA manual... */}
                </Paper>

                {/* Columna derecha: albaranes de VENTA pendientes */}
                <Suspense fallback={<Paper sx={{ p:2 }}>Cargando albaranes…</Paper>}>
                    <PendingAlbaranesPanel type="outgoing" />
                </Suspense>
            </Box>
        </Box>
    );
}

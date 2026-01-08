import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Alert,
    Snackbar,
    Switch,
    FormControlLabel,
    Paper,
    FormControl,
    InputLabel,
    Select,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getSessionKey } from "../utils/sessionKey";

const PendingAlbaranesPanel = React.lazy(
    () => import("../components/PendingAlbaranesPanel")
);

type Product = { sku: string; name: string; unit?: string };

const UNITS = ["unidad", "kg"];

export default function CajaSalida() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
                text: "No se pudo leer la báscula",
            });
            setSnackOpen(true);
        } finally {
            setBusy(false);
        }
    };

    const send = async () => {
        try {
            if (!sku) {
                setMsg({ type: "error", text: "Selecciona un producto" });
                setSnackOpen(true);
                return;
            }

            setBusy(true);
            const body = {
                sku,
                qty: normalizeQty(qty),
                unit,
                order_ref: note || undefined,
            };
            await api.post("/outgoing", body);

            setMsg({ type: "success", text: "Salida registrada correctamente." });
            setSnackOpen(true);
            setQty(1);
            setNote("");
        } catch (e: any) {
            setMsg({
                type: "error",
                text: e?.response?.data?.detail || "Error al registrar salida",
            });
            setSnackOpen(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
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

            <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    {/* === GRID PRINCIPAL (responsive) === */}
                    <Box
                        display="grid"
                        gridTemplateColumns={{
                            xs: "1fr",
                            sm: "1.8fr 0.8fr 0.8fr 1.8fr",
                        }}
                        gap={{ xs: 1.5, sm: 2 }}
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
                                <TextField
                                    {...params}
                                    label="Producto (buscar)"
                                    size={isMobile ? "small" : "medium"}
                                />
                            )}
                        />

                        {/* CANTIDAD */}
                        <TextField
                            label="Cantidad"
                            type="number"
                            inputProps={{ step, min: 0 }}
                            value={qty}
                            onChange={(e) => setQty(normalizeQty(Number(e.target.value)))}
                            size={isMobile ? "small" : "medium"}
                        />

                        {/* UNIDAD */}
                        <FormControl size={isMobile ? "small" : "medium"}>
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
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>

                    {/* === FILA SECUNDARIA (responsive) === */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={{ xs: 1.25, sm: 2 }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        mt={2}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                        >
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
                        </Stack>

                        <Box flex={1} />

                        {/* BOTONES: móvil en columna fullWidth */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            <Button
                                variant="outlined"
                                disabled={busy}
                                fullWidth={isMobile}
                                onClick={() => navigate("/barcode-ticket?type=outgoing")}
                                sx={{ minWidth: { xs: "100%", sm: 220 } }}
                            >
                                Código de barras
                            </Button>

                            <Button
                                variant="outlined"
                                disabled={busy}
                                fullWidth={isMobile}
                                onClick={() => navigate("/barcode-camera?type=outgoing")}
                                sx={{ minWidth: { xs: "100%", sm: 220 } }}
                            >
                                Escanear con cámara
                            </Button>

                            <Button
                                variant="contained"
                                disabled={!sku || busy}
                                fullWidth={isMobile}
                                onClick={send}
                                size={isMobile ? "large" : "medium"}
                                sx={{ minWidth: { xs: "100%", sm: 200 } }}
                            >
                                Registrar salida
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* === BLOQUE INFERIOR — Albaranes pendientes === */}
            <Box mt={3}>
                <Suspense fallback={<Paper sx={{ p: 2 }}>Cargando albaranes…</Paper>}>
                    <PendingAlbaranesPanel type="outgoing" sessionKey={getSessionKey()} />
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



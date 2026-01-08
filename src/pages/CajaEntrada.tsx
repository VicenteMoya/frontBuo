import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useScanner } from "../hooks/useScanner";
import { useScale } from "../hooks/useScale";
import { getSessionKey } from "../utils/sessionKey";

const PendingAlbaranesPanel = React.lazy(
    () => import("../components/PendingAlbaranesPanel")
);

type Product = { sku: string; name: string; unit: string };
type Msg = { type: "success" | "error"; text: string } | null;
type Mode = "scale" | "manual";

// lista de unidades visibles en el selector
const UNIT_OPTIONS = ["unidad", "kg"];

export default function CajaEntrada() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        api
            .get<Product[]>("/products")
            .then((r) => setProducts(r.data))
            .catch(() => {});
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

    const productOptions = useMemo(
        () =>
            products.map((p) => ({
                label: `${p.sku} — ${p.name}`,
                sku: p.sku,
                unit: p.unit,
            })),
        [products]
    );

    const selectedProduct = useMemo(
        () => products.find((p) => p.sku === sku) || null,
        [products, sku]
    );

    // scanner: si lee un SKU válido, lo selecciona y pone su unidad canónica
    const onScan = useCallback(
        (code: string) => {
            const p = products.find((x) => x.sku === code) || null;
            if (p) {
                setSku(p.sku);
                setUnit(p.unit);
                setMsg({ type: "success", text: `SKU ${code} leído` });
            } else {
                setMsg({
                    type: "error",
                    text: `Código ${code} no corresponde a un SKU`,
                });
            }
        },
        [products]
    );
    useScanner(onScan);

    // helper: ¿la cantidad es válida según unidad?
    const isIntegerUnit = unit === "unidad";
    const qtyIsInteger = Number.isInteger(qty);
    const qtyValid = qty > 0 && (!isIntegerUnit || qtyIsInteger);

    const submit = async () => {
        if (!selectedProduct) {
            setMsg({ type: "error", text: "Selecciona un producto" });
            return;
        }
        if (!qtyValid) {
            setMsg({
                type: "error",
                text: isIntegerUnit
                    ? "Cantidad debe ser un entero mayor que 0"
                    : "Cantidad debe ser > 0",
            });
            return;
        }
        // comprobación de unidad canónica del producto (política acordada)
        if (unit !== selectedProduct.unit) {
            setMsg({
                type: "error",
                text: `Unidad inválida. Esperado: ${selectedProduct.unit}`,
            });
            return;
        }

        setBusy(true);
        try {
            const body = { sku: selectedProduct.sku, qty, unit, note };
            const resp = await api.post("/incoming", body);
            setMsg({
                type: "success",
                text: `Entrada registrada. Lote ${resp.data?.lot?.lot_code || ""}`,
            });
            setQty(0);
            setNote("");
        } catch (e: any) {
            setMsg({
                type: "error",
                text: e?.response?.data?.detail || "Error al registrar",
            });
        } finally {
            setBusy(false);
        }
    };

    // cuando cambia el producto, fijamos la unidad a su canónica
    useEffect(() => {
        if (selectedProduct) setUnit(selectedProduct.unit);
    }, [selectedProduct]);

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {msg && (
                <Box mb={2}>
                    <Alert severity={msg.type} onClose={() => setMsg(null)}>
                        {msg.text}
                    </Alert>
                </Box>
            )}

            <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    {/* FORM */}
                    <Box
                        display="grid"
                        gridTemplateColumns={{
                            xs: "1fr",
                            sm: "1.8fr 0.8fr 0.8fr 1.8fr",
                        }}
                        gap={{ xs: 1.5, sm: 2 }}
                        alignItems="center"
                    >
                        <Autocomplete
                            options={productOptions}
                            isOptionEqualToValue={(o, v) => o?.sku === v?.sku}
                            getOptionLabel={(o: any) => o?.label ?? ""}
                            onChange={(_, val) => {
                                setSku(val?.sku || "");
                                if (val?.unit) setUnit(val.unit);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Producto (SKU — Nombre)"
                                    placeholder="Buscar producto"
                                    size={isMobile ? "small" : "medium"}
                                />
                            )}
                            value={productOptions.find((o) => o.sku === sku) || null}
                        />

                        <TextField
                            label="Cantidad"
                            type="number"
                            value={Number.isFinite(qty) ? qty : 0}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setQty(isIntegerUnit ? Math.trunc(v) : v);
                            }}
                            inputProps={{ step: isIntegerUnit ? 1 : "any" }}
                            disabled={mode === "scale"}
                            error={!qtyValid && qty > 0}
                            helperText={
                                !qtyValid && qty > 0
                                    ? "Para 'unidad' la cantidad debe ser entera"
                                    : undefined
                            }
                            size={isMobile ? "small" : "medium"}
                        />

                        <FormControl size={isMobile ? "small" : "medium"}>
                            <InputLabel id="unit-label">Unidad</InputLabel>
                            <Select
                                labelId="unit-label"
                                label="Unidad"
                                value={unit}
                                onChange={(e) => setUnit(String(e.target.value))}
                            >
                                {UNIT_OPTIONS.map((u) => (
                                    <MenuItem key={u} value={u}>
                                        {u}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Nota"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Observaciones"
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>

                    {/* CONTROLES */}
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
                            <ToggleButtonGroup
                                exclusive
                                size={isMobile ? "small" : "small"}
                                value={mode}
                                onChange={(_, v: Mode | null) => {
                                    if (v) setMode(v);
                                }}
                            >
                                <ToggleButton
                                    value="scale"
                                    disabled={!scaleWs || unit === "unidad"}
                                >
                                    Báscula
                                </ToggleButton>
                                <ToggleButton value="manual">Manual</ToggleButton>
                            </ToggleButtonGroup>

                            <Chip
                                label={
                                    mode === "scale"
                                        ? scale.connected
                                            ? "Báscula conectada"
                                            : "Báscula desconectada"
                                        : "Entrada manual"
                                }
                                color={mode === "scale" && scale.connected ? "success" : "default"}
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                            />

                            {scaleWs && (
                                <Chip
                                    label={`${scale.weight?.toFixed(3) || "0.000"} ${scale.unit || ""}`}
                                    variant="outlined"
                                    size={isMobile ? "small" : "medium"}
                                />
                            )}
                        </Stack>

                        <Box flex={1} />

                        {/* BOTONES: móvil en columna fullWidth */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            <Button
                                disabled={busy}
                                variant="outlined"
                                fullWidth={isMobile}
                                onClick={() => navigate("/barcode-ticket?type=incoming")}
                                sx={{ minWidth: { xs: "100%", sm: 220 } }}
                            >
                                Código de barras
                            </Button>

                            <Button
                                disabled={busy}
                                variant="outlined"
                                fullWidth={isMobile}
                                onClick={() => navigate("/barcode-camera?type=incoming")}
                                sx={{ minWidth: { xs: "100%", sm: 220 } }}
                            >
                                Escanear con cámara
                            </Button>

                            <Button
                                disabled={busy}
                                variant="contained"
                                fullWidth={isMobile}
                                onClick={submit}
                                size={isMobile ? "large" : "medium"}
                                sx={{ minWidth: { xs: "100%", sm: 200 } }}
                            >
                                Registrar entrada
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Box mt={2}>
                <Suspense fallback={<Paper sx={{ p: 2 }}>Cargando albaranes…</Paper>}>
                    <PendingAlbaranesPanel type="incoming" sessionKey={getSessionKey()} />
                </Suspense>
            </Box>
        </Box>
    );
}


// src/pages/OCRReview2.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    IconButton,
    TextField,
    MenuItem,
    Button,
    Snackbar,
    Alert,
    Stack,
    Card,
    CardContent,
    Divider,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import type { OcrItem } from "../api/types";
import { commitOCRAlbaran } from "../api/albaranes";
import { useAuth } from "../auth/AuthContext";

const UNITS = ["unidad", "kg", "caja", "litro"];
type Product = { sku: string; name: string; unit?: string };

// ✅ Lista de locales
const LOCALES = [
    "La Buha Latina",
    "El Buo Latina",
    "La Buha Chueca",
    "El Buo Chueca",
    "Ciudad Real Plaza Mayor",
    "Ciudad Reak ek Torreón",
    "Murcia",
    "El Corregidor Almagro",
    "Puertollano",
    "Albacete",
    "Hellín",
    "Valdepeñas",
];

export default function OCRReview2() {
    const nav = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { role } = useAuth();

    // ✅ modo kiosco para pedido_only
    const isPedidoOnly = role === "pedido_only";

    // ✅ Antes: fileName. Ahora: local (select)
    const [local, setLocal] = useState<string>("");

    const [items, setItems] = useState<OcrItem[]>([
        { sku: "", name: "", qty: 1, unit: "unidad" } as OcrItem,
    ]);
    const [type, setType] = useState<"incoming" | "outgoing">("outgoing");
    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>(
        { open: false, msg: "", sev: "success" }
    );

    // Catálogo productos
    const [catalog, setCatalog] = useState<Product[]>([]);
    useEffect(() => {
        import("../api/axios").then(({ default: api }) =>
            api.get<Product[]>("/products").then((r) => setCatalog(r.data || []))
        );
    }, []);

    const handleChange = (idx: number, patch: Partial<OcrItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };
    const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const addEmpty = () =>
        setItems((prev) => [...prev, { sku: "", name: "", qty: 1, unit: "unidad" } as OcrItem]);

    const canSubmit = useMemo(
        () =>
            local.trim().length > 0 &&
            items.length > 0 &&
            items.every((it) => it.qty > 0 && (it.sku || it.name.trim().length > 1)),
        [items, local]
    );

    const submit = async () => {
        if (!local.trim()) {
            setSnack({ open: true, sev: "error", msg: "Selecciona un local." });
            return;
        }

        const lines = items
            .filter((it) => it.sku || it.name)
            .map((it) => ({
                sku: it.sku || matchSkuByName(catalog, it.name)!,
                qty: it.qty,
                unit: it.unit,
                note: it.note ?? null,
            }));

        if (lines.some((l) => !l.sku)) {
            setSnack({ open: true, sev: "error", msg: "Falta SKU en alguna línea." });
            return;
        }

        try {
            await commitOCRAlbaran({
                type,
                origin: "manual",
                // ✅ Esto se ve en pendientes como “sourceImageName”
                sourceImageName: local,
                items: lines,
            });

            setSnack({ open: true, sev: "success", msg: "Pedido manual guardado como pendiente." });

            // ✅ Si es pedido_only, se queda aquí SIEMPRE
            if (isPedidoOnly) {
                // resetea el formulario pero mantén el local si quieres (yo lo mantengo)
                setItems([{ sku: "", name: "", qty: 1, unit: "unidad" } as OcrItem]);
                return;
            }

            // resto de roles: vuelve a /ocr como antes
            setTimeout(() => nav("/ocr"), 800);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const text = typeof detail === "string" ? detail : JSON.stringify(detail);
            setSnack({ open: true, sev: "error", msg: text });
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        <Typography variant="h6" fontWeight={700}>
                            Pedido manual
                        </Typography>

                        {/* ✅ pedido_only: NO mostramos “Atrás” */}
                        {!isPedidoOnly && (
                            <Button variant="outlined" onClick={() => nav("/ocr")} fullWidth={isMobile}>
                                ← Atrás
                            </Button>
                        )}
                    </Stack>

                    {/* Tipo + Local */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            select
                            size={isMobile ? "small" : "small"}
                            label="Tipo"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            fullWidth={isMobile}
                        >
                            <MenuItem value="incoming">Entrada</MenuItem>
                            <MenuItem value="outgoing">Salida</MenuItem>
                        </TextField>

                        <TextField
                            select
                            size={isMobile ? "small" : "small"}
                            label="Local"
                            value={local}
                            onChange={(e) => setLocal(e.target.value)}
                            fullWidth
                        >
                            {LOCALES.map((l) => (
                                <MenuItem key={l} value={l}>
                                    {l}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    <Divider />

                    {/* LÍNEAS */}
                    {isMobile ? (
                        <Stack spacing={1.25}>
                            {items.map((it, idx) => (
                                <Card key={idx} variant="outlined">
                                    <CardContent sx={{ p: 1.5 }}>
                                        <Stack spacing={1.25}>
                                            <Autocomplete
                                                size="small"
                                                options={catalog}
                                                getOptionLabel={(o) => `${o.sku} — ${o.name}`}
                                                value={it.sku ? catalog.find((p) => p.sku === it.sku) ?? null : null}
                                                onChange={(_, val) =>
                                                    val && handleChange(idx, { sku: val.sku, name: val.name, unit: val.unit })
                                                }
                                                renderInput={(params) => <TextField {...params} label="Producto" />}
                                            />

                                            <Stack direction="row" spacing={1}>
                                                <TextField
                                                    size="small"
                                                    label="Cantidad"
                                                    type="number"
                                                    value={it.qty}
                                                    onChange={(e) => handleChange(idx, { qty: Number(e.target.value) })}
                                                    fullWidth
                                                />
                                                <TextField
                                                    select
                                                    size="small"
                                                    label="Unidad"
                                                    value={it.unit}
                                                    onChange={(e) => handleChange(idx, { unit: e.target.value as any })}
                                                    fullWidth
                                                >
                                                    {UNITS.map((u) => (
                                                        <MenuItem key={u} value={u}>
                                                            {u}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Stack>

                                            <TextField
                                                size="small"
                                                label="Nota"
                                                value={it.note ?? ""}
                                                onChange={(e) => handleChange(idx, { note: e.target.value })}
                                                fullWidth
                                            />

                                            <Button
                                                color="error"
                                                variant="outlined"
                                                onClick={() => remove(idx)}
                                                fullWidth
                                                startIcon={<DeleteIcon />}
                                                disabled={items.length === 1}
                                            >
                                                Eliminar línea
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <Box>
                            {items.map((it, idx) => (
                                <Box
                                    key={idx}
                                    display="grid"
                                    gridTemplateColumns="2fr 1fr 1fr 2fr 48px"
                                    gap={1}
                                    alignItems="center"
                                    mb={1}
                                >
                                    <Autocomplete
                                        size="small"
                                        options={catalog}
                                        getOptionLabel={(o) => `${o.sku} — ${o.name}`}
                                        value={it.sku ? catalog.find((p) => p.sku === it.sku) ?? null : null}
                                        onChange={(_, val) =>
                                            val && handleChange(idx, { sku: val.sku, name: val.name, unit: val.unit })
                                        }
                                        renderInput={(params) => <TextField {...params} label="Producto" />}
                                    />
                                    <TextField
                                        size="small"
                                        label="Cantidad"
                                        type="number"
                                        value={it.qty}
                                        onChange={(e) => handleChange(idx, { qty: Number(e.target.value) })}
                                    />
                                    <TextField
                                        select
                                        size="small"
                                        label="Unidad"
                                        value={it.unit}
                                        onChange={(e) => handleChange(idx, { unit: e.target.value as any })}
                                    >
                                        {UNITS.map((u) => (
                                            <MenuItem key={u} value={u}>
                                                {u}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        size="small"
                                        label="Nota"
                                        value={it.note ?? ""}
                                        onChange={(e) => handleChange(idx, { note: e.target.value })}
                                    />
                                    <IconButton
                                        color="error"
                                        onClick={() => remove(idx)}
                                        disabled={items.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Acciones */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                            startIcon={<AddIcon />}
                            variant="outlined"
                            onClick={addEmpty}
                            fullWidth={isMobile}
                        >
                            Añadir línea
                        </Button>
                        <Box flex={1} />
                        <Button
                            variant="contained"
                            disabled={!canSubmit}
                            onClick={submit}
                            fullWidth={isMobile}
                            size={isMobile ? "large" : "medium"}
                        >
                            Confirmar
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Snackbar
                open={snack.open}
                autoHideDuration={2500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            >
                <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function matchSkuByName(catalog: Product[], name: string): string | undefined {
    const n = name.trim().toLowerCase();
    const hit = catalog.find((p) => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase()));
    return hit?.sku;
}


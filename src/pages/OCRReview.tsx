// src/pages/OCRReview.tsx
import { useLocation, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import type { OcrItem, OcrResult } from "../api/types";
import { commitOCRAlbaran } from "../api/albaranes";

const UNITS = ["unidad", "kg", "caja", "litro"] as const;

type Product = { sku: string; name: string; unit?: string };

function clampNote(note: any): string | null {
    if (note == null) return null;
    const s = String(note);
    // MySQL varchar(255) => recorta
    return s.length > 255 ? s.slice(0, 255) : s;
}

export default function OCRReview() {
    const { state } = useLocation() as {
        state: {
            ocr: OcrResult;
            sourceImageName: string;
            albaranId: number;
            // ✅ opcional: pásalo desde OCRAlbaran para guardar qué plantilla se usó
            ocrType?: string;
        };
    };

    const nav = useNavigate();

    const albaranId = state?.albaranId;
    const initialFileName = state?.sourceImageName || "";
    const [fileName, setFileName] = useState<string>(initialFileName);

    const [items, setItems] = useState<OcrItem[]>([]);
    const [type, setType] = useState<"incoming" | "outgoing">("incoming");

    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>(
        { open: false, msg: "", sev: "success" }
    );

    // Carga catálogo de productos
    const [catalog, setCatalog] = useState<Product[]>([]);
    useEffect(() => {
        import("../api/axios").then(({ default: api }) =>
            api.get<Product[]>("/products").then((r) => setCatalog(r.data || []))
        );
    }, []);

    // Inicializar líneas desde OCR
    useEffect(() => {
        const ocr = state?.ocr;
        if (!ocr || albaranId === undefined) return;

        setItems(
            (ocr.items || []).map((i) => ({
                ...i,
                qty: Number.isFinite(i.qty) ? i.qty : 1,
                unit: (i.unit as any) ?? "unidad",
                note: clampNote((i as any).note),
            }))
        );
    }, [state, albaranId]);

    const handleChange = (idx: number, patch: Partial<OcrItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };

    const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

    const addEmpty = () =>
        setItems((prev) => [...prev, { sku: "", name: "", qty: 1, unit: "unidad", note: null } as OcrItem]);

    const canSubmit = useMemo(
        () =>
            items.length > 0 &&
            items.every((it) => it.qty > 0 && ((it.sku && it.sku.trim().length > 0) || it.name.trim().length > 1)),
        [items]
    );

    const submit = async () => {
        const lines = items
            .filter((it) => (it.sku && it.sku.trim()) || it.name.trim())
            .map((it, idx) => {
                const skuResolved = (it.sku && it.sku.trim()) ? it.sku.trim().toUpperCase() : matchSkuByName(catalog, it.name);
                return {
                    sku: skuResolved || "",
                    qty: Number(it.qty) || 1,
                    unit: it.unit || "unidad",
                    note: clampNote(it.note),
                    __idx: idx + 1,
                };
            });

        const missing = lines.find((l) => !l.sku);
        if (missing) {
            setSnack({
                open: true,
                sev: "error",
                msg: `Falta SKU en alguna línea (línea ${missing.__idx}). Selecciona el producto en el desplegable.`,
            });
            return;
        }

        try {
            await commitOCRAlbaran({
                type,
                // ✅ Si te llega el tipo de OCR, guárdalo. Si no, "ocr"
                origin: state?.ocrType || "ocr",
                sourceImageName: fileName,
                items: lines.map(({ __idx, ...rest }) => rest),
            });

            setSnack({ open: true, sev: "success", msg: "Albarán guardado como pendiente." });
            setTimeout(() => nav("/ocr"), 800);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const text = typeof detail === "string" ? detail : JSON.stringify(detail);
            setSnack({ open: true, sev: "error", msg: text });
        }
    };

    return (
        <Box p={2} component={Paper}>
            <Typography variant="h6" mb={2}>
                Revisión del albarán
            </Typography>

            <Button variant="outlined" color="primary" onClick={() => nav("/ocr")} sx={{ mb: 2 }}>
                ← Atrás
            </Button>

            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField
                    select
                    size="small"
                    label="Tipo"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                >
                    <MenuItem value="incoming">Entrada</MenuItem>
                    <MenuItem value="outgoing">Salida</MenuItem>
                </TextField>

                <TextField
                    size="small"
                    label="Archivo"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />

                {/* opcional visual: muestra qué plantilla OCR se usó */}
                {state?.ocrType ? (
                    <TextField size="small" label="Proveedor OCR" value={state.ocrType} InputProps={{ readOnly: true }} />
                ) : null}
            </Box>

            {items.map((it, idx) => (
                <Box
                    key={idx}
                    display="grid"
                    gridTemplateColumns="2fr 1fr 1fr 2fr 40px"
                    gap={1}
                    alignItems="center"
                    mb={1}
                >
                    <Autocomplete
                        size="small"
                        options={catalog}
                        getOptionLabel={(o) => `${o.sku} — ${o.name}`}
                        value={it.sku ? catalog.find((p) => p.sku === it.sku) ?? null : null}
                        onChange={(_, val) => {
                            if (!val) return;
                            // ✅ si el usuario elige producto, forzamos sku+name
                            // y si unit viene en catálogo, la ponemos automáticamente
                            handleChange(idx, {
                                sku: val.sku,
                                name: val.name,
                                unit: (val.unit as any) || it.unit || "unidad",
                            });
                        }}
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
                        value={(it.note ?? "") as any}
                        onChange={(e) => handleChange(idx, { note: clampNote(e.target.value) as any })}
                        helperText={((it.note || "").length > 240) ? "Nota recortada a 255 caracteres" : " "}
                    />

                    <IconButton color="error" onClick={() => remove(idx)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ))}

            <Box mt={2} display="flex" gap={1}>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={addEmpty}>
                    Añadir línea
                </Button>
                <Box flex={1} />
                <Button variant="contained" disabled={!canSubmit} onClick={submit}>
                    Confirmar
                </Button>
            </Box>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            >
                <Alert
                    severity={snack.sev}
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                >
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function matchSkuByName(catalog: Product[], name: string): string | undefined {
    const n = (name || "").trim().toLowerCase();
    if (!n) return undefined;

    // búsqueda simple pero robusta
    const hit = catalog.find((p) => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase()));
    return hit?.sku;
}



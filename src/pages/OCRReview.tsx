import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    TextField,
    MenuItem,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import type { OcrItem, OcrResult } from '../api/types';
import api from '../api/axios';
import { assignOCRAlbaran } from '../api/albaranes';

type Product = { sku: string; name: string; unit?: string };
const UNITS = ['unidad', 'kg', 'caja', 'litro'];

export default function OCRReview() {
    const { state } = useLocation() as {
        state: { ocr: OcrResult; sourceImageName: string; albaranId: number };
    };
    const nav = useNavigate();

    const albaranId = state?.albaranId;
    const initialFileName = state?.sourceImageName || '';
    const [fileName, setFileName] = useState<string>(initialFileName);
    const [items, setItems] = useState<OcrItem[]>([]);
    const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
        open: false,
        msg: '',
        sev: 'success'
    });

    useEffect(() => {
        const ocr: OcrResult | undefined = state?.ocr;
        if (!ocr || albaranId === undefined) {
            nav('/ocr');
            return;
        }
        setItems(
            ocr.items.map((i) => ({
                ...i,
                qty: Number.isFinite(i.qty) ? i.qty : 1,
                unit: i.unit ?? 'unidad'
            }))
        );
    }, [state, albaranId, nav]);

    // Catalog for Autocomplete
    const [catalog, setCatalog] = useState<Product[]>([]);
    useEffect(() => {
        api.get<Product[]>('/products').then((r) => setCatalog(r.data || []));
    }, []);

    const handleChange = (idx: number, patch: Partial<OcrItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };
    const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const addEmpty = () => setItems((prev) => [...prev, { sku: '', name: '', qty: 1, unit: 'unidad' } as OcrItem]);

    const canSubmit = useMemo(
        () => items.length > 0 && items.every((it) => it.qty > 0 && (it.sku || it.name.trim().length > 1)),
        [items]
    );

    const submit = async () => {
        const lines = items
            .filter((it) => it.sku || it.name)
            .map((it) => ({
                sku: it.sku || matchSkuByName(catalog, it.name)!,
                qty: it.qty,
                unit: it.unit || 'unidad',
                note: it.note ?? null
            }));

        if (lines.some((l) => !l.sku)) {
            setSnack({ open: true, sev: 'error', msg: 'Falta SKU en alguna línea.' });
            return;
        }

        try {
            await assignOCRAlbaran(albaranId, { type, items: lines });
            setSnack({ open: true, sev: 'success', msg: 'Albarán asignado. Vamos a la caja.' });
            setTimeout(() => nav(type === 'incoming' ? '/entrada' : '/salida'), 800);
        } catch (e: any) {
            console.error(e);
            const detail = e?.response?.data?.detail;
            setSnack({ open: true, sev: 'error', msg: detail ?? 'Error al asignar.' });
        }
    };

    return (
        <Box p={2} component={Paper}>
            <Typography variant="h6" mb={2}>
                Revisión del albarán
            </Typography>

            <Box display="flex" gap={2} mb={2}>
                <TextField
                    select size="small"
                    label="Tipo de albarán (OCR)"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'incoming' | 'outgoing')}
                >
                    <MenuItem value="incoming">Compra (Entrada)</MenuItem>
                    <MenuItem value="outgoing">Venta (Salida)</MenuItem>
                </TextField>

                {/* Editable file name */}
                <TextField
                    size="small"
                    label="Archivo"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />
            </Box>

            {items.map((it, idx) => (
                <Box key={idx} display="grid" gridTemplateColumns="2fr 1.2fr 0.8fr 2fr 40px" gap={1} alignItems="center" mb={1}>
                    <Autocomplete
                        size="small"
                        options={catalog}
                        getOptionLabel={(o) => `${o.sku} — ${o.name}`}
                        value={it.sku ? catalog.find((p) => p.sku === it.sku) ?? null : null}
                        onChange={(_, val) => val && handleChange(idx, { sku: val.sku, name: val.name, unit: val.unit ?? it.unit })}
                        renderInput={(params) => <TextField {...params} label="Producto (buscar)" placeholder="SKU / nombre" />}
                    />
                    <TextField size="small" label="Cantidad" type="number" inputProps={{ step: 1 }} value={it.qty} onChange={(e) => handleChange(idx, { qty: Number(e.target.value) })} />
                    <TextField select size="small" label="Unidad" value={it.unit} onChange={(e) => handleChange(idx, { unit: e.target.value as any })}>
                        {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>
                    <TextField size="small" label="Nota" value={it.note ?? ''} onChange={(e) => handleChange(idx, { note: e.target.value })} />
                    <IconButton color="error" onClick={() => remove(idx)}><DeleteIcon /></IconButton>
                </Box>
            ))}

            <Box mt={2} display="flex" gap={1}>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={addEmpty}>Añadir línea</Button>
                <Box flex={1} />
                <Button variant="contained" disabled={!canSubmit} onClick={submit}>Confirmar</Button>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={2800} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

function matchSkuByName(catalog: Product[], name: string): string | undefined {
    const n = name.trim().toLowerCase();
    return catalog.find((p) => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase()))?.sku;
}




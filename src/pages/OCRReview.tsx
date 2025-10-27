import { useLocation } from 'react-router-dom';
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
import { commitOCRAlbaran } from '../api/albaranes';

const UNITS = ['unidad', 'kg', 'caja', 'litro'];

type Product = { sku: string; name: string; unit?: string };

export default function OCRReview() {
    const { state } = useLocation() as {
        state: { ocr: OcrResult; sourceImageName: string; albaranId: number };
    };

    const albaranId = state?.albaranId;
    const initialFileName = state?.sourceImageName || '';
    const [fileName, setFileName] = useState<string>(initialFileName);
    const [items, setItems] = useState<OcrItem[]>([]);
    const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>(
        { open: false, msg: '', sev: 'success' }
    );

    // Initialize lines from OCR
    useEffect(() => {
        const ocr = state?.ocr;
        if (!ocr || albaranId === undefined) {
            return;
        }
        setItems(
            ocr.items.map(i => ({
                ...i,
                qty: Number.isFinite(i.qty) ? i.qty : 1,
                unit: i.unit ?? 'unidad'
            }))
        );
    }, [state, albaranId]);

    // Load product catalog
    const [catalog, setCatalog] = useState<Product[]>([]);
    useEffect(() => {
        import('../api/axios').then(({ default: api }) =>
            api.get<Product[]>('/products').then(r => setCatalog(r.data || []))
        );
    }, []);

    const handleChange = (idx: number, patch: Partial<OcrItem>) => {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
    };
    const remove = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
    const addEmpty = () => setItems(prev => [...prev, { sku: '', name: '', qty: 1, unit: 'unidad' } as OcrItem]);

    const canSubmit = useMemo(
        () => items.length > 0 && items.every(it => it.qty > 0 && (it.sku || it.name.trim().length > 1)),
        [items]
    );

    const submit = async () => {
        const lines = items
            .filter(it => it.sku || it.name)
            .map(it => ({
                sku:  it.sku || matchSkuByName(catalog, it.name)!,
                qty:  it.qty,
                unit: it.unit,
                note: it.note ?? null
            }));

        if (lines.some(l => !l.sku)) {
            setSnack({ open: true, sev: 'error', msg: 'Falta SKU en alguna línea.' });
            return;
        }

        try {
            await commitOCRAlbaran({
                type,
                origin: 'ocr',
                sourceImageName: fileName,
                items: lines
            });
            setSnack({ open: true, sev: 'success', msg: 'Albarán guardado como pendiente.' });
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const text = typeof detail === 'string' ? detail : JSON.stringify(detail);
            setSnack({ open: true, sev: 'error', msg: text });
        }
    };

    return (
        <Box p={2} component={Paper}>
            <Typography variant="h6" mb={2}>Revisión del albarán</Typography>

            <Box display="flex" gap={2} mb={2}>
                <TextField
                    select size="small"
                    label="Tipo"
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                >
                    <MenuItem value="incoming">Entrada</MenuItem>
                    <MenuItem value="outgoing">Salida</MenuItem>
                </TextField>

                <TextField
                    size="small"
                    label="Archivo"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                />
            </Box>

            {items.map((it, idx) => (
                <Box key={idx} display="grid" gridTemplateColumns="2fr 1fr 1fr 2fr 40px" gap={1} alignItems="center" mb={1}>
                    <Autocomplete
                        size="small"
                        options={catalog}
                        getOptionLabel={o => `${o.sku} — ${o.name}`}
                        value={it.sku ? catalog.find(p => p.sku === it.sku) ?? null : null}
                        onChange={(_, val) => val && handleChange(idx, { sku: val.sku, name: val.name, unit: val.unit })}
                        renderInput={params => <TextField {...params} label="Producto" />}
                    />
                    <TextField size="small" label="Cantidad" type="number" value={it.qty} onChange={e => handleChange(idx, { qty: Number(e.target.value) })} />
                    <TextField select size="small" label="Unidad" value={it.unit} onChange={e => handleChange(idx, { unit: e.target.value as any })}>
                        {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>
                    <TextField size="small" label="Nota" value={it.note ?? ''} onChange={e => handleChange(idx, { note: e.target.value })} />
                    <IconButton color="error" onClick={() => remove(idx)}><DeleteIcon/></IconButton>
                </Box>
            ))}

            <Box mt={2} display="flex" gap={1}>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={addEmpty}>Añadir línea</Button>
                <Box flex={1} />
                <Button variant="contained" disabled={!canSubmit} onClick={submit}>Confirmar</Button>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({...s,open:false}))}>
                <Alert severity={snack.sev} onClose={() => setSnack(s => ({...s,open:false}))}>{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

function matchSkuByName(catalog: Product[], name: string): string | undefined {
    const n = name.trim().toLowerCase();
    const hit = catalog.find(p => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase()));
    return hit?.sku;
}


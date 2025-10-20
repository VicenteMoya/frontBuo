import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, IconButton, TextField, MenuItem, Button, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import type { OcrItem, OcrResult } from '../api/types';
import api from '../api/axios';
import { commitOCRAlbaran } from '../api/albaranes';

type Product = { sku: string; name: string; unit?: string };

const UNITS = ['unidad', 'kg', 'caja', 'litro'];

export default function OCRReview() {
  const { state } = useLocation() as any;
  const nav = useNavigate();

  const [items, setItems] = useState<OcrItem[]>([]);
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming'); // Compra/Entrada por defecto
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });
  const sourceImageName = state?.sourceImageName as string | undefined;

  useEffect(() => {
    const ocr: OcrResult | undefined = state?.ocr;
    if (!ocr) {
      nav('/ocr');
      return;
    }
    setItems(
      (ocr.items || []).map((i) => ({
        ...i,
        qty: Number.isFinite(i.qty) ? i.qty : 1,
        unit: i.unit ?? 'unidad',
      }))
    );
  }, [state, nav]);

  // Autocomplete: catálogo productos
  const [catalog, setCatalog] = useState<Product[]>([]);
  useEffect(() => {
    (async () => {
      const r = await api.get<Product[]>('/products');
      setCatalog(r.data || []);
    })();
  }, []);

  const handleChange = (idx: number, patch: Partial<OcrItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const addEmpty = () => setItems((prev) => [...prev, { name: '', qty: 1, unit: 'unidad' }]);

  const canSubmit = useMemo(
    () => items.length > 0 && items.every((it) => it.qty > 0 && (it.sku || it.name.trim().length > 1)),
    [items]
  );

  const submit = async () => {
    try {
      // Normaliza: si el usuario eligió producto del catálogo, ya tenemos sku;
      // si no, intenta resolver por nombre contra catálogo (best-effort).
      const lines = items
        .filter((it) => it.sku || it.name)
        .map((it) => ({
          sku: it.sku || matchSkuByName(catalog, it.name)!,
          qty: it.qty,
          unit: it.unit || 'unidad',
          note: it.note ?? null,
        }));

      if (lines.some((l) => !l.sku)) {
        setSnack({ open: true, sev: 'error', msg: 'Falta SKU en alguna línea. Selecciona el producto del catálogo.' });
        return;
      }

      await commitOCRAlbaran({
        type,
        origin: 'ocr',
        source_image_name: sourceImageName,
        lines,
      });

      setSnack({ open: true, sev: 'success', msg: 'Albarán OCR guardado como pendiente.' });

      // Después de crear la "chuleta", navega a la caja correspondiente.
      setTimeout(() => nav(type === 'incoming' ? '/entrada' : '/salida'), 700);
    } catch (e: any) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      setSnack({
        open: true,
        sev: 'error',
        msg: detail ? `Error: ${detail}` : 'Error al registrar el albarán.',
      });
    }
  };

  return (
    <Box p={2} component={Paper}>
      <Typography variant="h6" mb={2}>
        Revisión del albarán
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <TextField select size="small" label="Tipo de albarán (OCR)" value={type} onChange={(e) => setType(e.target.value as any)}>
          <MenuItem value="incoming">Compra (Entrada)</MenuItem>
          <MenuItem value="outgoing">Venta (Salida)</MenuItem>
        </TextField>

        {sourceImageName && (
          <TextField size="small" label="Archivo" value={sourceImageName} InputProps={{ readOnly: true }} />
        )}
      </Box>

      {items.map((it, idx) => (
        <Box
          key={idx}
          display="grid"
          gridTemplateColumns="2fr 1.2fr 0.8fr 2fr 40px"
          gap={1}
          alignItems="center"
          mb={1}
        >
          {/* Producto: Autocomplete que escribe sku y name */}
          <Autocomplete
            size="small"
            options={catalog}
            getOptionLabel={(o) => `${o.sku} — ${o.name}`}
            value={it.sku ? catalog.find((p) => p.sku === it.sku) ?? null : null}
            onChange={(_, val) => {
              if (val) handleChange(idx, { sku: val.sku, name: val.name, unit: val.unit ?? it.unit });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Producto (buscar)"
                placeholder="SKU / nombre"
                onChange={(e) => handleChange(idx, { sku: undefined, name: e.target.value })}
              />
            )}
          />

          <TextField
            size="small"
            label="Cantidad"
            type="number"
            inputProps={{ step: '1' }}
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
            value={it.note ?? ''}
            onChange={(e) => handleChange(idx, { note: e.target.value })}
            placeholder={it.source ? `OCR: ${it.source}` : ''}
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

      <Snackbar open={snack.open} autoHideDuration={2800} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
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

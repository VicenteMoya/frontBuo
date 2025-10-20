import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import {
    Box, Typography, TextField, MenuItem, Paper, Accordion, AccordionSummary, AccordionDetails,
    Chip, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type Line = { sku: string; qty: number; unit: string; note?: string | null };
type Mov = {
    id: number;
    type: 'incoming' | 'outgoing';
    origin?: string | null;
    sourceImageName?: string | null;
    created_at?: string | null; // <- la hacemos opcional por seguridad
    lines: Line[];
};

const TYPE_LABEL: Record<Mov['type'], string> = {
    incoming: 'Entrada (Compra)',
    outgoing: 'Salida (Venta)',
};

// Deduplicado defensivo por id+type+created_at (evita “keys” duplicadas)
function dedupeMovs(list: Mov[]): Mov[] {
    const map = new Map<string, Mov>();
    for (const m of list) {
        const key = `${m.id}-${m.type}-${m.created_at ?? ''}`;
        if (!map.has(key)) map.set(key, m);
    }
    return Array.from(map.values());
}

export default function Movimientos() {
    const [rows, setRows] = useState<Mov[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<'all'|'incoming'|'outgoing'>('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // ✅ ÚNICO ENDPOINT normalizado desde el backend
                const r = await api.get<Mov[]>('/movements');
                const data = (r.data ?? []).map(m => ({
                    ...m,
                    // normalizamos por si acaso:
                    type: (m.type as string).toLowerCase() as Mov['type'],
                    lines: m.lines ?? [],
                    created_at: m.created_at ?? null,
                }));
                // dedupe y orden
                const uniq = dedupeMovs(data).sort(
                    (a, b) =>
                        new Date(b.created_at ?? 0).getTime() -
                        new Date(a.created_at ?? 0).getTime()
                );
                setRows(uniq);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows
            .filter(r => (typeFilter === 'all' ? true : r.type === typeFilter))
            .filter(r => {
                if (!q) return true;
                const inLines = r.lines?.some(l =>
                    l.sku.toLowerCase().includes(q) ||
                    (l.note ?? '').toLowerCase().includes(q)
                );
                return (
                    inLines ||
                    (r.origin ?? '').toLowerCase().includes(q) ||
                    (r.sourceImageName ?? '').toLowerCase().includes(q) ||
                    String(r.id).includes(q)
                );
            });
    }, [rows, typeFilter, query]);

    return (
        <Box p={2}>
            <Typography variant="h6" mb={2}>Entradas y salidas</Typography>

            <Box display="flex" gap={2} mb={2}>
                <TextField
                    select size="small" label="Tipo" value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as any)}
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="incoming">Entradas</MenuItem>
                    <MenuItem value="outgoing">Salidas</MenuItem>
                </TextField>

                <TextField
                    size="small" label="Buscar (SKU / nota / archivo / id)"
                    value={query} onChange={e=>setQuery(e.target.value)}
                />
            </Box>

            <Paper>
                {loading ? (
                    <Box p={3} display="flex" justifyContent="center"><CircularProgress/></Box>
                ) : filtered.length === 0 ? (
                    <Box p={3} textAlign="center">No hay movimientos.</Box>
                ) : (
                    filtered.map(m => {
                        // ⛑ fecha robusta (por si no viene created_at)
                        const createdRaw = m.created_at ?? '';
                        const createdText = createdRaw
                            ? new Date(createdRaw).toLocaleString()
                            : '-';

                        // 🔑 key robusta para evitar warnings incluso si hay id repetido
                        const rowKey = `${m.id}-${m.type}-${m.created_at ?? ''}`;

                        return (
                            <Accordion key={rowKey} disableGutters>
                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Box display="flex" alignItems="center" gap={2} width="100%">
                                        <Typography variant="subtitle1">#{m.id}</Typography>
                                        <Chip
                                            size="small"
                                            label={TYPE_LABEL[m.type]}
                                            color={m.type === 'incoming' ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                        <Typography variant="body2">{createdText}</Typography>
                                        <Box flex={1}/>
                                        <Typography variant="body2" color="text.secondary">
                                            {m.origin || '-'} {m.sourceImageName ? `· ${m.sourceImageName}` : ''}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>SKU</TableCell>
                                                <TableCell align="right">Cantidad</TableCell>
                                                <TableCell>Unidad</TableCell>
                                                <TableCell>Nota</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {m.lines.map((l, i) => (
                                                <TableRow key={`${rowKey}-ln-${i}`}>
                                                    <TableCell>{l.sku}</TableCell>
                                                    <TableCell align="right">{l.qty}</TableCell>
                                                    <TableCell>{l.unit}</TableCell>
                                                    <TableCell>{l.note || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                )}
            </Paper>
        </Box>
    );
}

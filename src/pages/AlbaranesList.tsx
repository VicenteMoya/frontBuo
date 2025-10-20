import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

type AlbaranLine = { sku: string; qty: number; unit: string; note?: string | null };
type Albaran = {
    id: number;
    type: 'incoming' | 'outgoing';
    origin?: string | null;
    sourceImageName?: string | null;
    created_at: string;
    lines: AlbaranLine[];
};

export default function AlbaranesList() {
    const nav = useNavigate();
    const [rows, setRows] = useState<Albaran[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const r = await api.get<Albaran[]>('/albaranes');
                setRows(r.data || []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Box p={2}>
            <Typography variant="h6" mb={2}>Historial de albaranes</Typography>
            <Paper>
                {loading ? (
                    <Box p={3} display="flex" justifyContent="center"><CircularProgress/></Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Origen</TableCell>
                                <TableCell>Archivo</TableCell>
                                <TableCell align="right">Líneas</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map(r => (
                                <TableRow key={r.id} hover>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={r.type === 'incoming' ? 'Compra (Entrada)' : 'Venta (Salida)'}
                                            color={r.type === 'incoming' ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                                    <TableCell>{r.origin || '-'}</TableCell>
                                    <TableCell>{r.sourceImageName || '-'}</TableCell>
                                    <TableCell align="right">{r.lines?.length ?? 0}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={() => nav(`/albaranes/${r.id}`)} aria-label="ver">
                                            <VisibilityIcon/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow><TableCell colSpan={7} align="center">No hay albaranes.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Paper>
        </Box>
    );
}

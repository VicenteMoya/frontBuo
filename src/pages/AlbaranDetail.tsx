import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Box, Paper, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress } from '@mui/material';

type Line = { sku: string; qty: number; unit: string; note?: string | null };
type Detail = {
    id: number;
    type: 'incoming' | 'outgoing';
    origin?: string | null;
    sourceImageName?: string | null;
    created_at: string;
    lines: Line[];
};

export default function AlbaranDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [data, setData] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const r = await api.get<Detail>(`/albaranes/${id}`);
                setData(r.data);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return <Box p={3} display="flex" justifyContent="center"><CircularProgress/></Box>;
    }
    if (!data) {
        return <Box p={3}><Typography>No existe el albarán.</Typography></Box>;
    }

    return (
        <Box p={2}>
            <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Albarán #{data.id}</Typography>
                <Chip
                    size="small"
                    label={data.type === 'incoming' ? 'Compra (Entrada)' : 'Venta (Salida)'}
                    color={data.type === 'incoming' ? 'success' : 'warning'}
                    variant="outlined"
                />
                <Box flex={1}/>
                <Button variant="outlined" onClick={() => nav('/albaranes')}>Volver</Button>
            </Box>

            <Paper sx={{ p:2, mb:2 }}>
                <Typography variant="subtitle2">Datos</Typography>
                <Box mt={1} display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                    <Box><strong>Fecha:</strong> {new Date(data.created_at).toLocaleString()}</Box>
                    <Box><strong>Origen:</strong> {data.origin || '-'}</Box>
                    <Box><strong>Archivo:</strong> {data.sourceImageName || '-'}</Box>
                </Box>
            </Paper>

            <Paper>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>SKU</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell>Nota</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.lines.map((l, i) => (
                            <TableRow key={i}>
                                <TableCell>{l.sku}</TableCell>
                                <TableCell>{l.unit}</TableCell>
                                <TableCell align="right">{l.qty}</TableCell>
                                <TableCell>{l.note || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}

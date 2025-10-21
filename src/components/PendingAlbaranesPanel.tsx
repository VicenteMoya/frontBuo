// src/components/PendingAlbaranesPanel.tsx
import { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axios';
import {completeAlbaran, type AlbaranPending, fetchPending} from '../api/albaranes';
import { useNavigate } from 'react-router-dom';


export default function PendingAlbaranesPanel({
                                                  type,
                                                  sessionKey
                                              }: {
    type: 'incoming' | 'outgoing';
    sessionKey?: string;
}) {
    const [rows, setRows] = useState<AlbaranPending[]>([]);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
        open: false,
        msg: '',
        sev: 'success'
    });
    const nav = useNavigate();

    const [open, setOpen] = useState(false);
    const [loadingOne, setLoadingOne] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const load = async () => {
        try {
            const data = await fetchPending(type, sessionKey);
            setRows(data);
        } catch (e) {
            setSnack({ open: true, sev: 'error', msg: 'Error cargando albaranes pendientes' });
        }
    };

    const openDetail = async (id: number) => {
        setOpen(true);
        setLoadingOne(true);
        try {
            const r = await api.get(`/albaranes/${id}`);
            setDetail(r.data);
        } catch (e) {
            setSnack({ open: true, sev: 'error', msg: 'No se pudo cargar el albarán' });
            setOpen(false);
        } finally {
            setLoadingOne(false);
        }
    };

    useEffect(() => {
        load();
    }, [type, sessionKey]);

    const onCheck = async (id: number, checked: boolean) => {
        if (!checked) return;
        const ok = confirm('Marcar como COMPLETADO este albarán? Esta acción lo retirará de la lista.');
        if (!ok) return;
        try {
            await completeAlbaran(id);
            setSnack({ open: true, sev: 'success', msg: 'Albarán completado' });
            setRows((prev) => prev.filter((r) => r.id !== id));
        } catch {
            setSnack({ open: true, sev: 'error', msg: 'No se pudo completar el albarán' });
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">
                {type === 'incoming'
                    ? 'Albaranes de COMPRA pendientes'
                    : 'Albaranes de VENTA pendientes'}
            </Typography>

            {rows.length === 0 ? (
                <Box mt={1} color="text.secondary">
                    No hay albaranes pendientes.
                </Box>
            ) : (
                <List dense>
                    {rows.map((r) => (
                        <ListItem
                            key={r.id}
                            secondaryAction={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Tooltip title="Ver detalle">
                                        <IconButton edge="end" onClick={() => openDetail(r.id)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Marcar como completado">
                                        <Checkbox onChange={(e) => onCheck(r.id, e.target.checked)} />
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={`#${r.id} · ${new Date(r.created_at).toLocaleString()}`}
                                secondary={`${r.lines?.length || 0} líneas · ${r.origin || '-'}${
                                    r.sourceImageName ? ' · ' + r.sourceImageName : ''
                                }`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            <Snackbar
                open={snack.open}
                autoHideDuration={2500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            >
                <Alert
                    severity={snack.sev}
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                >
                    {snack.msg}
                </Alert>
            </Snackbar>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {detail
                        ? `Albarán #${detail.id} · ${
                            detail.type === 'incoming' ? 'COMPRA' : 'VENTA'
                        }`
                        : 'Cargando…'}
                </DialogTitle>
                <DialogContent dividers>
                    {loadingOne && (
                        <Box py={3} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    )}
                    {!loadingOne && detail && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {new Date(detail.created_at).toLocaleString()} · {detail.origin || '-'}{' '}
                                {detail.sourceImageName ? `· ${detail.sourceImageName}` : ''}
                            </Typography>
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
                                    {detail.lines?.map((ln: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{ln.sku}</TableCell>
                                            <TableCell align="right">{ln.qty}</TableCell>
                                            <TableCell>{ln.unit}</TableCell>
                                            <TableCell>{ln.note || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cerrar</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!detail}
                        onClick={async () => {
                            if (!detail) return;
                            const ok = confirm(
                                'Marcar como COMPLETADO este albarán?'
                            );
                            if (!ok) return;
                            try {
                                await completeAlbaran(detail.id);
                                setSnack({ open: true, sev: 'success', msg: 'Albarán completado' });
                                setRows((prev) =>
                                    prev.filter((r) => r.id !== detail.id)
                                );
                                setOpen(false);
                            } catch {
                                setSnack({
                                    open: true,
                                    sev: 'error',
                                    msg: 'No se pudo completar el albarán'
                                });
                            }
                        }}
                    >
                        Marcar como completado
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

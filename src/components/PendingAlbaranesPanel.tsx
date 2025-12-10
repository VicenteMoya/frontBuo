// src/components/PendingAlbaranesPanel.tsx
import { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Checkbox,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Collapse,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import api from '../api/axios';
import {
    fetchPending,
    completeAlbaran,
    type AlbaranPending,
} from "../api/albaranes";

type Props = {
    type: "incoming" | "outgoing";
    sessionKey?: string;
};

export default function PendingAlbaranesPanel({ type, sessionKey }: Props) {
    const [rows, setRows] = useState<AlbaranPending[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [snack, setSnack] = useState<{
        open: boolean;
        msg: string;
        sev: "success" | "error";
    }>({ open: false, msg: "", sev: "success" });

    // id del albarán desplegado
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // si tu fetchPending sólo acepta (type), cambia esta línea a: fetchPending(type)
            const data = await fetchPending(type, sessionKey);
            setRows(data);
        } catch (e) {
            console.error(e);
            setSnack({
                open: true,
                sev: "error",
                msg: "Error cargando albaranes pendientes",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [type, sessionKey]);

    const onCheck = async (id: number, checked: boolean) => {
        if (!checked) return;
        const ok = confirm(
            "Marcar como COMPLETADO este albarán? Esta acción lo retirará de la lista."
        );
        if (!ok) return;
        try {
            await completeAlbaran(id);
            setSnack({
                open: true,
                sev: "success",
                msg: "Albarán completado",
            });
            setRows((prev) => prev.filter((r) => r.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (e) {
            console.error(e);
            setSnack({
                open: true,
                sev: "error",
                msg: "No se pudo completar el albarán",
            });
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <Paper sx={{ p: 2, height: "100%", overflowY: "auto" }}>
            <Typography variant="subtitle1" gutterBottom>
                {type === "incoming"
                    ? "Albaranes de COMPRA pendientes"
                    : "Albaranes de VENTA pendientes"}
            </Typography>

            {loading && (
                <Box py={3} display="flex" justifyContent="center">
                    <CircularProgress size={24} />
                </Box>
            )}

            {!loading && rows.length === 0 && (
                <Box mt={1} color="text.secondary">
                    No hay albaranes pendientes.
                </Box>
            )}

            {!loading &&
                rows.map((r) => {
                    const isExpanded = expandedId === r.id;
                    const numLineas = r.lines?.length || 0;

                    return (
                        <Box key={r.id} mb={1}>
                            {/* CABECERA DEL ALBARÁN */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                                onClick={() => toggleExpand(r.id)}
                            >
                                <Box flex={1}>
                                    <Typography variant="body2">
                                        #{r.id} · {new Date(r.created_at).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {numLineas} líneas · {r.origin || "-"}
                                        {r.sourceImageName ? " · " + r.sourceImageName : ""}
                                    </Typography>
                                </Box>

                                <Tooltip title="Ver/ocultar líneas">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(r.id);
                                        }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Marcar como completado">
                                    <Checkbox
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => onCheck(r.id, e.target.checked)}
                                    />
                                </Tooltip>

                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(r.id);
                                    }}
                                    sx={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                    }}
                                >
                                    <ExpandMoreIcon fontSize="small" />
                                </IconButton>
                            </Paper>

                            {/* DETALLE DESPLEGABLE */}
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Paper
                                    variant="outlined"
                                    sx={{ mt: 0.5, mb: 1, p: 1, backgroundColor: "#fafafa" }}
                                >
                                    {numLineas === 0 ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ p: 1 }}
                                        >
                                            Sin líneas.
                                        </Typography>
                                    ) : (
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
                                                {r.lines.map((ln, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{ln.sku}</TableCell>
                                                        <TableCell align="right">{ln.qty}</TableCell>
                                                        <TableCell>{ln.unit}</TableCell>
                                                        <TableCell>{ln.note || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Paper>
                            </Collapse>
                        </Box>
                    );
                })}

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
        </Paper>
    );
}

import React, { useMemo } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    IconButton,
    Stack,
    Typography,
    CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";

export type TicketLine = {
    sku: string;
    name: string;
    unit: string;
    qty: number;
};

type Props = {
    title: string;
    subtitle?: string;

    lines: TicketLine[];
    busy: boolean;
    error: string | null;

    onBack: () => void;
    onClear: () => void;

    onInc: (sku: string) => void;
    onDec: (sku: string) => void;
    onRemove: (sku: string) => void;

    onConfirm: () => void;
    confirmLabel?: string;
};

export default function TicketEditor({
                                         title,
                                         subtitle,
                                         lines,
                                         busy,
                                         error,
                                         onBack,
                                         onClear,
                                         onInc,
                                         onDec,
                                         onRemove,
                                         onConfirm,
                                         confirmLabel = "Confirmar y aplicar",
                                     }: Props) {
    const totalUnits = useMemo(
        () => lines.reduce((acc, l) => acc + l.qty, 0),
        [lines]
    );

    return (
        <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={onBack} disabled={busy}>
                            Volver
                        </Button>
                        <Button variant="outlined" color="error" onClick={onClear} disabled={busy}>
                            Vaciar
                        </Button>
                    </Stack>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}

                <Card>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                Ticket ({totalUnits} uds)
                            </Typography>
                            {busy && <CircularProgress size={20} />}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {lines.length === 0 ? (
                            <Typography color="text.secondary">
                                Escanea productos para empezar
                            </Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {lines.map((l) => (
                                    <Stack
                                        key={l.sku}
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={700}>
                                                {l.sku}{" "}
                                                <Typography component="span" color="text.secondary" fontWeight={400}>
                                                    — {l.name}
                                                </Typography>
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Unidad: {l.unit}
                                            </Typography>
                                        </Box>

                                        <IconButton onClick={() => onDec(l.sku)} disabled={busy}>
                                            <RemoveIcon />
                                        </IconButton>
                                        <Typography fontWeight={700}>{l.qty}</Typography>
                                        <IconButton onClick={() => onInc(l.sku)} disabled={busy}>
                                            <AddIcon />
                                        </IconButton>
                                        <IconButton onClick={() => onRemove(l.sku)} disabled={busy}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                ))}
                            </Stack>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Button
                            variant="contained"
                            fullWidth
                            disabled={busy || lines.length === 0}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </Button>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}

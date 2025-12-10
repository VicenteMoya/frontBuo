import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
} from "@mui/material";
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
import type { OcrResult } from "../api/types.ts";
import { getSessionKey } from '../utils/sessionKey';

export default function OCRAlbaran() {
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState<{ type: "success" | "error" | "info", text: string } | null>(null);
    const [busy, setBusy] = useState(false);

    // tipo de OCR seleccionado
    const [ocrType, setOcrType] = useState<"cash_unide" | "villar_munoz" | "whatsapp">("cash_unide");

    const nav = useNavigate();

    const onUpload = async () => {
        if (!file) {
            setMsg({ type: "error", text: "Selecciona un archivo" });
            return;
        }
        setBusy(true);
        setMsg(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("session_key", getSessionKey());
            // 👇 nuevo: mandamos el tipo al backend
            fd.append("ocr_type", ocrType);

            const r = await api.post("/albaranes/ocr", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const data = (r?.data || {}) as OcrResult;
            const items = Array.isArray(data.items) ? data.items : [];

            if (items.length === 0) {
                setMsg({ type: "info", text: "Analizado: 0 items. Revisa/añade manualmente." });
            } else {
                setMsg({ type: "success", text: `Analizado. Items: ${items.length}` });
            }

            nav('/ocr/review', {
                state: {
                    ocr: { items: data.items },
                    sourceImageName: file.name,
                    albaranId: data.id,
                }
            });
        } catch (e: any) {
            console.error(e?.response?.data || e);
            setMsg({ type: "error", text: e?.response?.data?.detail || "Error en OCR" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h6">OCR de Albarán</Typography>

                    {msg && (
                        <Alert
                            severity={msg.type}
                            onClose={() => setMsg(null)}
                            sx={{ mt: 2 }}
                        >
                            {msg.text}
                        </Alert>
                    )}

                    {/* Selector de tipo de albarán */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Tipo de albarán
                        </Typography>

                        <ToggleButtonGroup
                            value={ocrType}
                            exclusive
                            onChange={(_, value) => {
                                if (value) setOcrType(value);
                            }}
                            size="small"
                        >
                            <ToggleButton
                                value="cash_unide"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: ocrType === "cash_unide" ? 700 : 400,
                                    bgcolor: ocrType === "cash_unide" ? "#1565c0" : "#e3f2fd", // azul oscuro seleccionado, azul muy claro sin seleccionar
                                    color: ocrType === "cash_unide" ? "#ffffff" : "#0d47a1",
                                    "&:hover": {
                                        bgcolor: ocrType === "cash_unide" ? "#0d47a1" : "#bbdefb",
                                    },
                                    borderRadius: 2,
                                    px: 2,
                                }}
                            >
                                Cash Unide
                            </ToggleButton>
                            <ToggleButton
                                value="villar_munoz"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: ocrType === "villar_munoz" ? 700 : 400,
                                    bgcolor: ocrType === "villar_munoz" ? "#8A0018" : "#ffe4f2", // 8A0018 seleccionado, rosa muy claro sin seleccionar
                                    color: ocrType === "villar_munoz" ? "#ffffff" : "#8A0018",
                                    "&:hover": {
                                        bgcolor: ocrType === "villar_munoz" ? "#5c0010" : "#ffc6e3",
                                    },
                                    borderRadius: 2,
                                    px: 2,
                                }}
                            >
                                Villar Muñoz
                            </ToggleButton>
                            <ToggleButton
                                value="whatsapp"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: ocrType === "whatsapp" ? 700 : 400,
                                    bgcolor: ocrType === "whatsapp" ? "#1b5e20" : "#e8f5e9", // verde oscuro seleccionado, verde muy claro sin seleccionar
                                    color: ocrType === "whatsapp" ? "#ffffff" : "#1b5e20",
                                    "&:hover": {
                                        bgcolor: ocrType === "whatsapp" ? "#104116" : "#c8e6c9",
                                    },
                                    borderRadius: 2,
                                    px: 2,
                                }}
                            >
                                WhatsApp
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Selector de archivo */}
                    <Box sx={{ mt: 3 }}>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            disabled={!file || busy}
                            onClick={onUpload}
                        >
                            Analizar
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

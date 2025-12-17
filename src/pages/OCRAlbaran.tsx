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

    const [ocrType, setOcrType] =
        useState<"cash_unide" | "villar_munoz" | "whatsapp">("cash_unide");

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

                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                            <ToggleButtonGroup
                                value={ocrType}
                                exclusive
                                onChange={(_, value) => value && setOcrType(value)}
                                size="small"
                            >
                                {/* 🔵 CASH UNIDE */}
                                <ToggleButton
                                    value="cash_unide"
                                    sx={{
                                        color: "#1976d2",
                                        borderColor: "#1976d2",
                                        "&.Mui-selected": {
                                            backgroundColor: "#1976d2",
                                            color: "#fff",
                                            "&:hover": { backgroundColor: "#115293" },
                                        },
                                    }}
                                >
                                    Cash Unide
                                </ToggleButton>

                                {/* 🟡 VILLAR MUÑOZ */}
                                <ToggleButton
                                    value="villar_munoz"
                                    sx={{
                                        color: "#f9a825",
                                        borderColor: "#f9a825",
                                        "&.Mui-selected": {
                                            backgroundColor: "#f9a825",
                                            color: "#000",
                                            "&:hover": { backgroundColor: "#c17900" },
                                        },
                                    }}
                                >
                                    Villar Muñoz
                                </ToggleButton>

                                {/* 🟢 WHATSAPP */}
                                <ToggleButton
                                    value="whatsapp"
                                    sx={{
                                        color: "#2e7d32",
                                        borderColor: "#2e7d32",
                                        "&.Mui-selected": {
                                            backgroundColor: "#2e7d32",
                                            color: "#fff",
                                            "&:hover": { backgroundColor: "#1b5e20" },
                                        },
                                    }}
                                >
                                    WhatsApp
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {/* BOTÓN MANUAL */}
                            <Button
                                variant="outlined"
                                onClick={() => nav("/ocr/review2")}
                            >
                                MANUAL
                            </Button>
                        </Box>
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

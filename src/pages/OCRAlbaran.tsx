import { useState } from "react";
import { Box, Button, Card, CardContent, Typography, Alert } from "@mui/material";
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
import type { OcrResult } from "../api/types.ts";
import { getSessionKey } from '../utils/sessionKey';

export default function OCRAlbaran() {
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState<{ type: "success" | "error" | "info", text: string } | null>(null);
    const [busy, setBusy] = useState(false);

    // ⬅️ El hook va a nivel de componente, no dentro de la función:
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
            // Añadimos la clave de sesión para que el backend etiquete el albarán a esta sesión
            fd.append("session_key", getSessionKey());

            const r = await api.post("/albaranes/ocr", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Aceptamos 200 aunque items sea [] y navegamos a revisión
            const data = (r?.data || {}) as OcrResult;
            const items = Array.isArray(data.items) ? data.items : [];

            if (items.length === 0) {
                setMsg({ type: "info", text: "Analizado: 0 items. Revisa/añade manualmente." });
            } else {
                setMsg({ type: "success", text: `Analizado. Items: ${items.length}` });
            }

            nav('/ocr/review', {
                state: {
                    ocr: { items },                 // normalizamos el shape
                    sourceImageName: file?.name || undefined
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
                    {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mt: 2 }}>{msg.text}</Alert>}

                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    <Box sx={{ mt: 2 }}>
                        <Button variant="contained" disabled={!file || busy} onClick={onUpload}>
                            Analizar
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

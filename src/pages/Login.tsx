import React, { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
} from "@mui/material";
import portada from "../assets/portada.png";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

function extractErrorMessage(err: any): string {
    // Intenta sacar string de las respuestas típicas de FastAPI (detail puede ser string o array)
    const d = err?.response?.data?.detail ?? err?.message ?? err?.toString?.();
    if (!d) return "Error desconocido";

    if (typeof d === "string") return d;

    if (Array.isArray(d)) {
        // detail: [{loc, msg, type, input}, ...]
        const msgs = d.map((x) => (x?.msg ? String(x.msg) : JSON.stringify(x)));
        return msgs.join(" · ");
    }

    // objeto suelto
    return JSON.stringify(d);
}

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const { login } = useAuth();
    const nav = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
            // 1) Tu API (por cómo responde) espera JSON: { username, password }
            let r = await api.post("/auth/login", { username, password });

            // si tu API devuelve access_token, úsalo; si devuelve token, úsalo
            const token = r.data?.access_token || r.data?.token;
            if (!token) throw new Error("No se recibió el token");
            login(token);
            nav("/", { replace: true });
        } catch (err: any) {
            // Si el backend estuviera esperando form-urlencoded, reintenta automáticamente
            if (err?.response?.status === 422) {
                try {
                    const body = new URLSearchParams();
                    body.append("username", username);
                    body.append("password", password);
                    const r2 = await api.post("/auth/login", body, {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    });
                    const token = r2.data?.access_token || r2.data?.token;
                    if (!token) throw new Error("No se recibió el token");
                    login(token);
                    nav("/", { replace: true });
                    return;
                } catch (err2: any) {
                    setMsg(extractErrorMessage(err2));
                }
            } else {
                setMsg(extractErrorMessage(err));
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box
            sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                backgroundColor: "#f5f5f5",
            }}
        >
            {/* Imagen de portada encima del formulario */}
            <Box
                component="img"
                src={portada}
                alt="Portada del login"
                loading="lazy"
                sx={{
                    width: "100%",
                    maxWidth: 360,
                    mb: 2,
                    borderRadius: 2,
                    display: { xs: "none", sm: "block" }, // opcional: ocultar en móviles
                }}
            />

            <Card sx={{ width: 360 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Acceso
                    </Typography>

                    {msg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {msg} {/* 👈 Nunca pasar objetos aquí */}
                        </Alert>
                    )}

                    <form onSubmit={onSubmit}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onSubmit(e as any);
                            }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={busy}
                            sx={{ mt: 2 }}
                        >
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}

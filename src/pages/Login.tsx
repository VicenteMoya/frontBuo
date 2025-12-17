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
    const d = err?.response?.data?.detail ?? err?.message ?? err?.toString?.();
    if (!d) return "Error desconocido";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
        const msgs = d.map((x) => (x?.msg ? String(x.msg) : JSON.stringify(x)));
        return msgs.join(" · ");
    }
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
            let r = await api.post("/auth/login", { username, password });

            const token = r.data?.access_token || r.data?.token;
            const role = r.data?.user?.role; // 👈 NUEVO

            if (!token) throw new Error("No se recibió el token");

            login(token, role); // 👈 CAMBIO CLAVE
            nav(role === "pedido_only" ? "/ocr" : "/", { replace: true }); // 👈 REDIRECCIÓN
        } catch (err: any) {
            if (err?.response?.status === 422) {
                try {
                    const body = new URLSearchParams();
                    body.append("username", username);
                    body.append("password", password);
                    const r2 = await api.post("/auth/login", body, {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    });

                    const token = r2.data?.access_token || r2.data?.token;
                    const role = r2.data?.user?.role; // 👈 TAMBIÉN AQUÍ

                    if (!token) throw new Error("No se recibió el token");

                    login(token, role);
                    nav(role === "pedido_only" ? "/ocr" : "/", { replace: true });
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
                    display: { xs: "none", sm: "block" },
                }}
            />

            <Card sx={{ width: 360 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Acceso
                    </Typography>

                    {msg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {msg}
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

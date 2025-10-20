import React from "react";
import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logoBuo from "../assets/logo_combo.png"; // comenta si no existe
import logoGroupymes from "../assets/grpy.png"; // comenta si no existe

const Layout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
    const { logout } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();

    const handleLogout = () => { logout(); if (window.location.pathname !== "/login") nav("/login", { replace: true }); };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box component="img" src={logoBuo} alt="Logo" sx={{ height: 40 }} />
                        <Box component="img" src={logoGroupymes} alt="Logo" sx={{ height: 40 }} />
                    </Box>
                    <Box>
                        <Button color="inherit" onClick={() => nav("/")} disabled={loc.pathname === "/"}>Entrada</Button>
                        <Button color="inherit" onClick={() => nav("/ocr")} disabled={loc.pathname === "/ocr"}>OCR</Button>
                        <Button color="inherit" onClick={() => nav("/movimientos")} disabled={loc.pathname === "/movimientos"}>MOVIMIENTOS</Button>
                        <Button color="inherit" onClick={() => nav("/salida")} disabled={loc.pathname === "/salida"}>Salida</Button>
                        <Button color="inherit" onClick={handleLogout}>Cerrar sesión</Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 2 }}>{children}</Box>
        </Box>
    );
};

export default Layout;

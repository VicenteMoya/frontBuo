import React from "react";
import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logoBuo from "../assets/logo_combo.png";
import logoGroupymes from "../assets/grpy.png";

const Layout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
    const { logout } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();

    const handleLogout = () => {
        logout();
        if (window.location.pathname !== "/login") {
            nav("/login", { replace: true });
        }
    };

    const isPath = (path: string) => loc.pathname === path;

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box component="img" src={logoBuo} alt="Logo" sx={{ height: 40 }} />
                        <Box component="img" src={logoGroupymes} alt="Logo" sx={{ height: 40 }} />
                    </Box>
                    <Box>
                        <Button color="inherit" onClick={() => nav("/")} disabled={isPath("/")}>
                            Entrada
                        </Button>
                        <Button color="inherit" onClick={() => nav("/ocr")} disabled={isPath("/ocr")}>
                            OCR
                        </Button>
                        <Button
                            color="inherit"
                            onClick={() => nav("/movimientos")}
                            disabled={isPath("/movimientos")}
                        >
                            MOVIMIENTOS
                        </Button>

                        {/* 👇 NUEVO BOTÓN PROCESOS */}
                        <Button
                            color="inherit"
                            onClick={() => nav("/procesos")}
                            disabled={isPath("/procesos")}
                        >
                            Procesos
                        </Button>

                        <Button color="inherit" onClick={() => nav("/salida")} disabled={isPath("/salida")}>
                            Salida
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            Cerrar sesión
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 2 }}>{children}</Box>
        </Box>
    );
};

export default Layout;

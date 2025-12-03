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

    // 👉 ESTILO UNIFICADO PARA LOS BOTONES DEL HEADER
    const topButtonStyle = {
        ml: 1,
        backgroundColor: "#8A0018",
        color: "white",
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 20,
        px: 2.5,
        "&:hover": {
            backgroundColor: "#6a0012",
        },
        "&.Mui-disabled": {
            backgroundColor: "#cccccc",
            color: "#666666",
        },
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box component="img" src={logoBuo} alt="Logo" sx={{ height: 75 }} />
                        <Box component="img" src={logoGroupymes} alt="Logo" sx={{ height: 100 }} />
                    </Box>

                    {/* 👉 BOTONES DEL MENÚ SUPERIOR (YA ESTILIZADOS) */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Button
                            sx={topButtonStyle}
                            onClick={() => nav("/")}
                            disabled={isPath("/")}>
                            ENTRADA
                        </Button>

                        <Button
                            sx={topButtonStyle}
                            onClick={() => nav("/ocr")}
                            disabled={isPath("/ocr")}>
                            OCR
                        </Button>

                        <Button
                            sx={topButtonStyle}
                            onClick={() => nav("/movimientos")}
                            disabled={isPath("/movimientos")}>
                            MOVIMIENTOS
                        </Button>

                        <Button
                            sx={topButtonStyle}
                            onClick={() => nav("/procesos")}
                            disabled={isPath("/procesos")}>
                            PROCESOS
                        </Button>

                        <Button
                            sx={topButtonStyle}
                            onClick={() => nav("/salida")}
                            disabled={isPath("/salida")}>
                            SALIDA
                        </Button>

                        <Button sx={topButtonStyle} onClick={handleLogout}>
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

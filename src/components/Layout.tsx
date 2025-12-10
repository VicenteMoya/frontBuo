import React from "react";
import { AppBar, Box, Button, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logoBuo from "../assets/logo_combo.png";
import logoGroupymes from "../assets/grpy.png";

const Layout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
    const { logout } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleLogout = () => {
        logout();
        if (window.location.pathname !== "/login") {
            nav("/login", { replace: true });
        }
    };

    const isPath = (path: string) => loc.pathname === path;

    // 👉 ESTILO UNIFICADO PARA LOS BOTONES DEL HEADER (ajustado a móvil)
    const topButtonStyle = {
        ml: { xs: 0.5, md: 1 },
        backgroundColor: "#8A0018",
        color: "white",
        textTransform: "none" as const,
        fontWeight: 600,
        borderRadius: 20,
        px: { xs: 1.5, md: 2.5 },
        fontSize: isMobile ? "0.7rem" : "0.9rem",
        whiteSpace: "nowrap" as const,
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
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: { xs: 1.5, md: 3 },
                        minHeight: { xs: 56, sm: 64 },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
                        <Box
                            component="img"
                            src={logoBuo}
                            alt="Logo Buo"
                            sx={{ height: { xs: 40, sm: 60, md: 75 } }}
                        />
                        <Box
                            component="img"
                            src={logoGroupymes}
                            alt="Logo Groupymes"
                            sx={{ height: { xs: 55, sm: 80, md: 100 } }}
                        />
                    </Box>

                    {/* 👉 BOTONES DEL MENÚ SUPERIOR (YA ESTILIZADOS) */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            overflowX: { xs: "auto", md: "visible" },
                            maxWidth: { xs: "60%", sm: "70%", md: "none" },
                            pl: { xs: 1, md: 0 },
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
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
                            CERRAR SESIÓN
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 2 }}>{children}</Box>
        </Box>
    );
};

export default Layout;

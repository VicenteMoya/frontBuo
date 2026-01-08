import React, { useEffect, useMemo, useState } from "react";
import {
    AppBar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logoBuo from "../assets/logo_combo.png";
import logoGroupymes from "../assets/grpy.png";

const Layout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
    const { logout, role } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = () => {
        logout();
        if (window.location.pathname !== "/login") {
            nav("/login", { replace: true });
        }
    };

    const isPath = (path: string) => loc.pathname === path;

    // ✅ Guardia de navegación para pedido_only
    useEffect(() => {
        if (role === "pedido_only") {
            const path = loc.pathname;

            const allowed =
                path === "/ocr" ||
                path === "/ocr/review" ||
                path === "/ocr/review2" ||
                path === "/login";

            if (!allowed) {
                nav("/ocr", { replace: true });
            }
        }
    }, [role, loc.pathname, nav]);

    // Cierra drawer al cambiar de ruta (móvil)
    useEffect(() => {
        if (drawerOpen) setDrawerOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.pathname]);

    const isPedidoOnly = role === "pedido_only";

    const topButtonStyle = useMemo(
        () => ({
            ml: { xs: 0.5, md: 1 },
            backgroundColor: "#8A0018",
            color: "white",
            textTransform: "none" as const,
            fontWeight: 600,
            borderRadius: 20,
            px: { xs: 1.5, md: 2.5 },
            fontSize: isMobile ? "0.7rem" : "0.9rem",
            whiteSpace: "nowrap" as const,
            "&:hover": { backgroundColor: "#6a0012" },
            "&.Mui-disabled": {
                backgroundColor: "#cccccc",
                color: "#666666",
            },
        }),
        [isMobile]
    );

    const menuItems = useMemo(() => {
        if (isPedidoOnly) {
            return [
                { label: "REALIZAR PEDIDO", path: "/ocr" },
            ];
        }
        return [
            { label: "ENTRADA 📥", path: "/" },
            { label: "REALIZAR PEDIDO ✍🏻", path: "/ocr" },
            { label: "MOVIMIENTOS 🚛", path: "/movimientos" },
            { label: "PROCESOS 🥔", path: "/procesos" },
            { label: "SALIDA 📤", path: "/salida" },
        ];
    }, [isPedidoOnly]);

    const drawer = (
        <Box sx={{ width: 280 }}>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                    component="img"
                    src={logoBuo}
                    alt="Logo Buo"
                    sx={{ height: 38 }}
                />
                <Box
                    component="img"
                    src={logoGroupymes}
                    alt="Logo Groupymes"
                    sx={{ height: 42 }}
                />
            </Box>

            <Divider />

            <List sx={{ p: 0 }}>
                {menuItems.map((it) => (
                    <ListItem key={it.path} disablePadding>
                        <ListItemButton
                            selected={isPath(it.path)}
                            onClick={() => nav(it.path)}
                            sx={{
                                py: 1.5,
                                "&.Mui-selected": {
                                    backgroundColor: "rgba(138, 0, 24, 0.10)",
                                },
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Typography fontWeight={700}>
                                        {it.label}
                                    </Typography>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider />

            <Box sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                        backgroundColor: "#8A0018",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": { backgroundColor: "#6a0012" },
                    }}
                >
                    CERRAR SESIÓN
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: { xs: 1, md: 3 },
                        minHeight: { xs: 56, sm: 64 },
                        gap: 1,
                    }}
                >
                    {/* IZQUIERDA: logos */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            component="img"
                            src={logoBuo}
                            alt="Logo Buo"
                            sx={{ height: { xs: 34, sm: 60, md: 75 } }}
                        />
                        <Box
                            component="img"
                            src={logoGroupymes}
                            alt="Logo Groupymes"
                            sx={{ height: { xs: 38, sm: 80, md: 100 } }}
                        />
                    </Box>

                    {/* DERECHA: móvil => hamburger; desktop => botones */}
                    {isMobile ? (
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Abrir menú"
                            size="large"
                        >
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {!isPedidoOnly && (
                                <>
                                    <Button sx={topButtonStyle} onClick={() => nav("/")} disabled={isPath("/")}>
                                        ENTRADA 📥
                                    </Button>

                                    <Button sx={topButtonStyle} onClick={() => nav("/ocr")} disabled={isPath("/ocr")}>
                                        REALIZAR PEDIDO 📷
                                    </Button>

                                    <Button
                                        sx={topButtonStyle}
                                        onClick={() => nav("/movimientos")}
                                        disabled={isPath("/movimientos")}
                                    >
                                        MOVIMIENTOS 🚛
                                    </Button>

                                    <Button
                                        sx={topButtonStyle}
                                        onClick={() => nav("/procesos")}
                                        disabled={isPath("/procesos")}
                                    >
                                        PROCESOS 🥔
                                    </Button>

                                    <Button sx={topButtonStyle} onClick={() => nav("/salida")} disabled={isPath("/salida")}>
                                        SALIDA 📤
                                    </Button>
                                </>
                            )}

                            {isPedidoOnly && (
                                <Button sx={topButtonStyle} onClick={() => nav("/ocr")} disabled={isPath("/ocr")}>
                                    REALIZAR PEDIDO
                                </Button>
                            )}

                            <Button sx={topButtonStyle} onClick={handleLogout}>
                                CERRAR SESIÓN
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Drawer móvil */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }} // mejora rendimiento en móvil
            >
                {drawer}
            </Drawer>

            {/* Contenido */}
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;

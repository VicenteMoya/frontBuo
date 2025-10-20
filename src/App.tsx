import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { SessionGuard } from "./auth/SessionGuard";

import Login from "./pages/Login";
import CajaEntrada from "./pages/CajaEntrada"; // tu pantalla
import OCRAlbaran from "./pages/OCRAlbaran";
import Layout from "./components/Layout";
import OCRReview from './pages/OCRReview';
import AlbaranesList from "./pages/AlbaranesList.tsx";
import AlbaranDetail from "./pages/AlbaranDetail.tsx";
import Movimientos from "./pages/Movimientos";
import CajaSalida from "./pages/CajaSalida.tsx";

function Shell() {
    return (
        <ProtectedRoute>
            <SessionGuard>
                <Layout>
                    <Outlet />
                </Layout>
            </SessionGuard>
        </ProtectedRoute>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route element={<Shell />}>
                            <Route path="/" element={<CajaEntrada />} />
                            <Route path="/ocr" element={<OCRAlbaran />} />
                            <Route path="/ocr/review" element={<OCRReview />} />
                            <Route path="/albaranes" element={<AlbaranesList />} />
                            <Route path="/albaranes/:id" element={<AlbaranDetail />} />
                            <Route path="/movimientos" element={<Movimientos />} />
                            <Route path="/salida" element={<CajaSalida/>} />
                        </Route>
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

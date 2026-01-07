import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import BarcodeCameraTicket from "./pages/BarcodeCameraTicket";

import OCRReview2 from "./pages/OCRReview2";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { SessionGuard } from "./auth/SessionGuard";

// Páginas
import Login from "./pages/Login";
import CajaEntrada from "./pages/CajaEntrada";
import OCRAlbaran from "./pages/OCRAlbaran";
import Layout from "./components/Layout";
import OCRReview from "./pages/OCRReview";
import AlbaranesList from "./pages/AlbaranesList.tsx";
import AlbaranDetail from "./pages/AlbaranDetail.tsx";
import Movimientos from "./pages/Movimientos";
import CajaSalida from "./pages/CajaSalida.tsx";
import ProcesosPage from "./pages/Procesos.tsx";

// ✅ NUEVA PÁGINA
import BarcodeTicket from "./pages/BarcodeTicket";

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
                            <Route path="/procesos" element={<ProcesosPage />} />
                            <Route path="/salida" element={<CajaSalida />} />
                            <Route path="/ocr/review2" element={<OCRReview2 />} />
                            <Route path="/barcode-camera" element={<BarcodeCameraTicket />} />


                            {/* ✅ RUTA BARCODE */}
                            <Route path="/barcode-ticket" element={<BarcodeTicket />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

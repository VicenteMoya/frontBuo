import Login from './pages/Login';

export default function App() {
    console.log('App render');               // <- para ver en consola
    return (
        <div>
            <h1>TEST</h1>
            <Login />
        </div>
    );
}
/*
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CajaEntrada from './pages/CajaEntrada';
import CajaProceso from './pages/CajaProceso';
import CajaSalida from './pages/CajaSalida';
import Layout from './components/Layout';

const App: React.FC = () => {
    const token = localStorage.getItem('token');
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/!*"
                element={
                    token ? (
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="entrada" element={<CajaEntrada />} />
                                <Route path="proceso" element={<CajaProceso />} />
                                <Route path="salida" element={<CajaSalida />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Layout>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
        </Routes>
    );
};

export default App;*/

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getJwtExpMs, isExpired } from "../utils/jwt";

type AuthState = {
    token: string | null;
    login: (t: string) => void;
    logout: () => void;
};

const AuthCtx = createContext<AuthState>({ token: null, login: () => {}, logout: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const timerRef = useRef<number | null>(null);

    const clearTimer = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = null;
    };

    const scheduleAutoLogout = (t: string | null) => {
        clearTimer();
        const expMs = getJwtExpMs(t);
        if (!expMs) return;
        const delay = Math.max(0, expMs - Date.now() - 2000); // 2s de margen
        timerRef.current = window.setTimeout(() => {
            logout();
            // redirigimos por si estamos en zona protegida
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }, delay);
    };

    const login = (t: string) => {
        localStorage.setItem("token", t);
        setToken(t);
        scheduleAutoLogout(t);
    };

    const logout = () => {
        clearTimer();
        localStorage.removeItem("token");
        setToken(null);
    };

    // Inicializa desde localStorage + programa auto-logout
    useEffect(() => {
        if (token) {
            if (isExpired(token)) {
                logout();
            } else {
                scheduleAutoLogout(token);
            }
        }
        // limpieza al desmontar
        return () => clearTimer();
    }, []); // solo al montar

    return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);

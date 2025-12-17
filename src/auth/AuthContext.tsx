import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getJwtExpMs, isExpired } from "../utils/jwt";

type Role = "admin" | "pedido_only" | string | null;

type AuthState = {
    token: string | null;
    role: Role;
    login: (t: string, role?: Role) => void;
    logout: () => void;
};

const AuthCtx = createContext<AuthState>({
    token: null,
    role: null,
    login: () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const [role, setRole] = useState<Role>(() => localStorage.getItem("auth_role"));
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
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }, delay);
    };

    const login = (t: string, r: Role = null) => {
        localStorage.setItem("token", t);
        setToken(t);
        scheduleAutoLogout(t);

        // guardamos role si viene (o dejamos el que hubiese)
        if (r !== undefined) {
            if (r === null) {
                localStorage.removeItem("auth_role");
            } else {
                localStorage.setItem("auth_role", String(r));
            }
            setRole(r);
        }
    };

    const logout = () => {
        clearTimer();
        localStorage.removeItem("token");
        localStorage.removeItem("auth_role");
        setToken(null);
        setRole(null);
    };

    useEffect(() => {
        if (token) {
            if (isExpired(token)) {
                logout();
            } else {
                scheduleAutoLogout(token);
            }
        }
        return () => clearTimer();
    }, []); // solo al montar

    return <AuthCtx.Provider value={{ token, role, login, logout }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);


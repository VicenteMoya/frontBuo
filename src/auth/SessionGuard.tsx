import React, { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { isExpired } from "../utils/jwt";

export const SessionGuard: React.FC<{ children: React.ReactNode; intervalMs?: number }> = ({ children, intervalMs = 60000 }) => {
    const { token, logout } = useAuth();

    useEffect(() => {
        const id = window.setInterval(() => {
            if (isExpired(token)) {
                logout();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }, intervalMs);
        return () => window.clearInterval(id);
    }, [token, logout, intervalMs]);

    return <>{children}</>;
};

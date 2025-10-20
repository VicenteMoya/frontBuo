// Decodifica JWT sin validar firma para leer el payload
export function parseJwt<T = any>(token: string | null): T | null {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    try {
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export function getJwtExpMs(token: string | null): number | null {
    const payload = parseJwt<{ exp?: number }>(token);
    if (!payload?.exp) return null;
    // exp está en segundos → pasamos a ms
    return payload.exp * 1000;
}

export function isExpired(token: string | null, skewMs = 5000): boolean {
    const expMs = getJwtExpMs(token);
    if (!expMs) return true;
    return Date.now() >= (expMs - skewMs);
}

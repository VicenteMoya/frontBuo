// src/utils/sessionKey.ts

// Generador UUID de respaldo para navegadores sin crypto.randomUUID
function fallbackUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getSessionKey(): string {
    const STORAGE_KEY = "sessionKey";

    let key = sessionStorage.getItem(STORAGE_KEY);
    if (!key) {
        const cryptoObj: Crypto | undefined = (window as any).crypto;

        if (cryptoObj && typeof (cryptoObj as any).randomUUID === "function") {
            key = (cryptoObj as any).randomUUID();
        } else {
            key = fallbackUUID();
        }

        sessionStorage.setItem(STORAGE_KEY, key);
    }

    return key;
}

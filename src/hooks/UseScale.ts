import { useEffect, useRef, useState } from "react";

type ScaleData = { weight: number; unit?: string; connected: boolean; error?: string };

export const useScale = (wsUrl: string | null) => {
    const [data, setData] = useState<ScaleData>({ weight: 0, unit: "kg", connected: false });
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!wsUrl) { setData(d => ({...d, connected: false})); return; }
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => setData(d => ({...d, connected: true}));
        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (typeof msg.weight === "number") setData({ weight: msg.weight, unit: msg.unit || "kg", connected: true });
            } catch {}
        };
        ws.onerror = () => setData(d => ({...d, error: "WS error", connected: false}));
        ws.onclose = () => setData(d => ({...d, connected: false}));
        return () => { ws.close(); };
    }, [wsUrl]);

    return data;
};

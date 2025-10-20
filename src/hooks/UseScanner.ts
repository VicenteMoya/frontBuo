import { useEffect, useRef } from "react";

export const useScanner = (onScan: (code: string)=>void, timeoutMs = 100) => {
    const buffer = useRef("");
    const timer = useRef<number | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                const code = buffer.current.trim();
                buffer.current = "";
                if (code) onScan(code);
                if (timer.current) window.clearTimeout(timer.current);
                timer.current = null;
                return;
            }
            if (timer.current) window.clearTimeout(timer.current);
            buffer.current += e.key;
            timer.current = window.setTimeout(() => {
                buffer.current = "";
                timer.current = null;
            }, timeoutMs);
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onScan, timeoutMs]);
};

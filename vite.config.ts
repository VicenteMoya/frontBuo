import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // 👈 MUY IMPORTANTE: acepta conexiones externas
        port: 5173,       // 👈 el puerto que estás usando
    },
});


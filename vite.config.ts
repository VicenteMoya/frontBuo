import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5173,
        https: {
            key: fs.readFileSync("C:/mkcert/desktop-lsqhmga.tail3d952c.ts.net-key.pem"),
            cert: fs.readFileSync("C:/mkcert/desktop-lsqhmga.tail3d952c.ts.net.pem"),
        },
    },
});



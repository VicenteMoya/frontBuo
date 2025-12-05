import axios from "axios";

// SIEMPRE usar el host desde el que se carga la web
// PC:   http://localhost:5173  -> baseURL: http://localhost:8000
// Móvil/Tailscale: http://100.76.21.89:5173 -> baseURL: http://100.76.21.89:8000
const API_BASE = `http://${window.location.hostname}:8000`;

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const t = localStorage.getItem("token");
    if (t) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${t}`,
        };
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(err);
    }
);

export default api;

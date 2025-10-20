import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // p.ej. http://localhost:8000
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const t = localStorage.getItem("token");
    if (t) config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            if (window.location.pathname !== "/login") window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;

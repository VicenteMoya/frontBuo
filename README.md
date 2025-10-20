# 🖥️ frontBuo — Interfaz web para gestión de almacén con OCR

## 🧠 Descripción general

**frontBuo** es la interfaz web del sistema de gestión de inventario desarrollado por **Groupymes**.  
Está diseñado para gestionar de forma sencilla las **entradas y salidas de productos**, tanto manualmente como mediante **OCR automático** (reconocimiento de texto en albaranes).

Permite:
- Registrar **entradas (compras)** y **salidas (ventas)** de productos.
- Subir imágenes de **albaranes** para analizar y extraer líneas automáticamente con OCR.
- Visualizar y confirmar los albaranes pendientes.
- Consultar el historial completo de movimientos.
- Gestionar el catálogo de productos.

---

## ⚙️ Tecnologías principales

- **React 18 + TypeScript**
- **Vite** como bundler
- **Material UI (MUI)** para la interfaz
- **Axios** para comunicación con el backend
- **React Router** para navegación SPA
- **Lazy Loading / Suspense** para optimización

---

## 📁 Estructura principal

```
src/
├── api/axios.ts                # Cliente HTTP preconfigurado
├── auth/                      # Lógica de login y sesión
├── components/                # Componentes reutilizables
├── pages/
│    ├── CajaEntrada.tsx       # Entradas (compras)
│    ├── CajaSalida.tsx        # Salidas (ventas)
│    ├── OCRAlbaran.tsx        # OCR de albaranes
│    ├── Movimientos.tsx       # Historial de movimientos
├── utils/sessionKey.ts        # Generador de clave de sesión temporal
├── main.tsx                   # Punto de entrada
└── App.tsx                    # Configuración de rutas
```

---

## 🚀 Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar entorno
Crea un archivo `.env` con:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Por defecto se ejecuta en [http://localhost:5173](http://localhost:5173)

---

## 🔗 Comunicación con el backend

El frontend se comunica con el API REST de **FastAPI** (puerto 8000) en los siguientes endpoints:

| Endpoint | Método | Descripción |
|-----------|---------|-------------|
| `/auth/login` | POST | Autenticación de usuarios |
| `/products` | GET | Listado de productos |
| `/incoming` / `/outgoing` | POST | Registrar entrada o salida |
| `/albaranes/ocr` | POST | Subir imagen para análisis OCR |
| `/albaranes/pending` | GET | Listar albaranes pendientes por sesión |
| `/movements` / `/movements/flat` | GET | Historial de movimientos |

---

👨‍💻 Proyecto desarrollado por **Groupymes**

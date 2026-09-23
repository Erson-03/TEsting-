/* =========================================================
   Environment configuration
   ---------------------------------------------------------
   The frontend runs with mock data by default. When the real
   backend is ready, set VITE_USE_MOCK_API=false in .env and
   point VITE_API_BASE_URL to your server.
   ========================================================= */

export const ENV = {
  useMockApi: (import.meta.env.VITE_USE_MOCK_API ?? "true") === "true",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
};

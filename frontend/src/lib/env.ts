export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

// Domains whose backend endpoints are not built yet read from src/services/mock when true.
// Auth never uses mocks.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

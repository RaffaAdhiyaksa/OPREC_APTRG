export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export type MockDomain = "users" | "divisions" | "materials" | "assignments" | "announcements" | "notifications";

// Domains listed in VITE_MOCK_DOMAINS read from src/services/mock until their integration step. Auth never uses mocks.
const MOCK_DOMAINS = new Set((import.meta.env.VITE_MOCK_DOMAINS ?? "").split(",").map((d) => d.trim()));

export const isMocked = (domain: MockDomain) => MOCK_DOMAINS.has(domain);

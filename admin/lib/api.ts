import type { ApiEnvelope, User } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000/api";

export function getAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const assetBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${assetBaseUrl}/${path.replace(/^\/+/, "")}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public missingEndpoint = false
  ) {
    super(message);
  }
}

function normalizeApiMessage(message: string | undefined, status?: number, path?: string) {
  if (status === 401) {
    if (path === "/admin/auth/login") {
      return message || "Invalid username or password";
    }

    return "Your session expired. Please sign in again.";
  }

  if (!message) return "The request could not be completed.";

  if (
    message.includes("Invalid `prisma.") ||
    message.includes("PrismaClient") ||
    message.includes("does not exist in the current database")
  ) {
    return "The database needs to be updated before these records can be loaded.";
  }

  return message;
}

function handleUnauthorized(status: number, path: string) {
  if (status !== 401 || typeof window === "undefined") return;
  if (path === "/admin/auth/login") return;

  clearStoredSession();

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const payload = await apiRequest<T>(path, options);

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError(`Unexpected API response for ${path}`);
  }

  return payload.data as T;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || payload?.success === false) {
    handleUnauthorized(response.status, path);

    throw new ApiError(
      normalizeApiMessage(payload?.message, response.status, path),
      response.status,
      response.status === 404
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new ApiError(`Unexpected API response for ${path}`, response.status);
  }

  return payload;
}

export async function login(username: string, password: string) {
  return apiFetch<{ token: string; user: User; role: string; permissions: string[] }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("mhn_admin_token") ?? getCookie("mhn_admin_session");
}

export function setStoredSession(token: string, user: User) {
  window.localStorage.setItem("mhn_admin_token", token);
  window.localStorage.setItem("mhn_admin_user", JSON.stringify(user));
  document.cookie = `mhn_admin_session=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=lax`;
}

const ORIGINAL_SESSION_KEY = "mhn_superadmin_session";

type StoredSession = {
  token: string;
  user: User;
};

export function storeOriginalSession(token: string, user: User) {
  if (typeof window === "undefined" || window.sessionStorage.getItem(ORIGINAL_SESSION_KEY)) return;
  window.sessionStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify({ token, user } satisfies StoredSession));
}

export function getOriginalSession() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ORIGINAL_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.sessionStorage.removeItem(ORIGINAL_SESSION_KEY);
    return null;
  }
}

export function clearOriginalSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ORIGINAL_SESSION_KEY);
  }
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("mhn_admin_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getStoredUserName() {
  if (typeof window === "undefined") return "Administrator";
  const user = getStoredUser();
  return user?.name || user?.username || "Administrator";
}

export function clearStoredSession() {
  window.localStorage.removeItem("mhn_admin_token");
  window.localStorage.removeItem("mhn_admin_user");
  clearOriginalSession();
  document.cookie = "mhn_admin_session=; path=/; max-age=0; samesite=lax";
}

function getCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

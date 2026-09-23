import { ENV } from "../../config/env";

/* =========================================================
   Shared HTTP client for the future backend.
   ---------------------------------------------------------
   All real API calls should pass through this file so auth,
   timeouts, headers and error handling remain consistent.
   ========================================================= */

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? ENV.apiTimeoutMs,
  );

  const token = localStorage.getItem("para.auth.token");
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${ENV.apiBaseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message: unknown }).message)
          : `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out.", 408);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

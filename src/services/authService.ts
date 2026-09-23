import { ENV } from "../config/env";
import type { AuthUser, LoginResponse } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { wait } from "./mock/mockStore";

const TOKEN_KEY = "para.auth.token";
const USER_KEY = "para.auth.user";

/**
 * Authentication gateway.
 * Pages/components never call fetch directly; switching to the backend only
 * requires setting VITE_USE_MOCK_API=false and implementing /auth/login.
 */
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    let response: LoginResponse;

    if (ENV.useMockApi) {
      await wait(450);
      if (!email.includes("@") || password.length < 6) {
        throw new Error("Enter a valid email and a password with at least 6 characters.");
      }
      response = {
        token: "para-demo-token",
        user: { id: "USR001", name: "Admin", email, role: "Administrator" },
      };
    } else {
      response = await apiRequest<LoginResponse>(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    }

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { AuthUser } from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());

  async function login(email: string, password: string) {
    const response = await authService.login(email, password);
    setUser(response.user);
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, authenticated: Boolean(user && authService.getToken()), login, logout }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

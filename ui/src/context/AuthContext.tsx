"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  role: "member" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    orgName?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/users/me");
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    await api.post("/auth/jwt/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    await fetchUser();
  };

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    orgName?: string,
  ) => {
    setLoading(true);
    await api.post("/auth/register", {
      email,
      password,
      first_name: firstName || null,
      last_name: lastName || null,
      org_name: orgName || null,
    });
    await login(email, password);
  };

  const logout = async () => {
    try {
      await api.post("/auth/jwt/logout");
    } catch {
      // Ignore errors — cookie may already be expired
    }
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

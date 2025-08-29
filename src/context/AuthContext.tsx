"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  async function login(email: string, password: string) {
    try {
      const data = await apiFetch<{ access: string; refresh: string }>(
        "/auth/jwt/create/",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        false
      );

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      const userInfo = await getUser();
      setUser(userInfo);

      if (userInfo?.role === "admin") router.push("/user/dashboard/admin");
      else if (userInfo?.role === "organizer") router.push("/user/dashboard/organizer");
      else if (userInfo?.role === "attendee") router.push("/user/dashboard/attendee");
    } catch (error: any) {
      throw new Error(error.message || "Login failed.");
    }
  }

  async function getUser(): Promise<User> {
    return apiFetch<User>("/auth/users/me/");
  }

  function logout() {
    router.push("/");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) {
      getUser()
        .then(setUser)
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

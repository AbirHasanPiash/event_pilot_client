"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiFetch } from "./api";

const PROTECTION_MODE = process.env.NEXT_PUBLIC_PROTECTION_MODE === "true";

/*
 * Hook to use safe API calls with automatic session handling.
 */
export function useSafeApiFetch() {
  const router = useRouter();

  const safeApiFetch = useCallback(
    async function <T>(
      endpoint: string,
      options: RequestInit = {},
      includeAuth: boolean = true
    ): Promise<T | null> {
      try {
        // Protection Mode
        if (PROTECTION_MODE) {
          const method = (options.method || "GET").toUpperCase();
          const safeMethods = ["GET", "HEAD", "OPTIONS"];
          if (!safeMethods.includes(method)) {
            toast.success("Demo Mode: Action simulated (no data changed).");
            return {} as T;
          }
        }

        return await apiFetch<T>(endpoint, options, includeAuth);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === "Session expired. Please log in again.") {
            toast.error("Session expired. Redirecting to login...");
            router.push("/auth/login");
          } else {
            toast.error(err.message || "Something went wrong.");
          }
        } else {
          toast.error("Something went wrong.");
        }
        return null;
      }
    },
    [router]
  );

  return safeApiFetch;
}

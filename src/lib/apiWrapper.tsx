"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiFetch } from "./api";

/**
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
        return await apiFetch<T>(endpoint, options, includeAuth);
      } catch (err: any) {
        if (err.message === "Session expired. Please log in again.") {
          toast.error("Session expired. Redirecting to login...");
          router.push("/auth/login");
        } else {
          toast.error(err.message || "Something went wrong.");
        }
        return null;
      }
    },
    [router]
  );

  return safeApiFetch;
}

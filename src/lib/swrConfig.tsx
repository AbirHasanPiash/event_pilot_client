"use client";

import { SWRConfig } from "swr";
import { apiFetch } from "@/lib/api";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => apiFetch(url), // reuse your existing fetcher
        revalidateOnFocus: false,                // no refetch every tab focus
        revalidateIfStale: false,                // trust cached data
        revalidateOnReconnect: false,
        keepPreviousData: true,                  // smooth pagination
      }}
    >
      {children}
    </SWRConfig>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import { ArrowLeft, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

interface OrganizerRequest {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  profile_image?: string | null;
  status: "pending" | "approved" | "rejected";
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function OrganizerRequestsPage() {
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();
  const searchParams = useSearchParams();

  const initialFilter = searchParams.get("status") || "pending";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<PaginatedResponse<OrganizerRequest>>(url),
    [safeApiFetch]
  );

  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/request-organizer/list/?status=${filter}&page=${currentPage}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value && value !== "pending") params.set("status", value);
    else params.delete("status");
    params.set("page", "1");
    router.replace(`/user/dashboard/admin/organizer-requests?${params}`);
    mutate(); // refetch with new filter
  };

  // Page navigation
  const goToPage = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (filter) params.set("status", filter);
    params.set("page", String(newPage));
    router.replace(`/user/dashboard/admin/organizer-requests?${params}`);
    mutate(); // refetch with new page
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Organizer Requests</h2>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error || !data ? (
        <p className="text-gray-500">Failed to load requests.</p>
      ) : data.results.length === 0 ? (
        <p className="text-gray-500">No {filter} requests found.</p>
      ) : (
        <>
          {/* Requests List */}
          <div className="space-y-4">
            {data.results.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm"
              >
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    {req.profile_image ? (
                      <Image
                        src={req.profile_image}
                        alt="Profile"
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-xl font-bold">
                        {req.first_name[0]}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold">
                    {req.first_name} {req.last_name}
                  </p>
                </div>

                {/* Manage Button */}
                <button
                  onClick={() =>
                    router.push(
                      `/user/dashboard/admin/organizer-requests/${req.id}`
                    )
                  }
                  className="px-4 py-2 border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={!data.previous}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${
                  data.previous
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <ArrowLeft size={16} /> Prev
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!data.next}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${
                  data.next
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import {
  CheckCircle2,
  XCircle,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import dayjs from "dayjs";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

interface OrganizerRequest {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  user_email: string;
  profile_image?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string | null;
  reason?: string;
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

  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [loading, setLoading] = useState(true);

  // Load requests
  const loadRequests = useCallback(
    async (status: string, page = 1, pageUrl?: string) => {
      setLoading(true);

      const url =
        pageUrl ||
        `/api/dashboard/request-organizer/list/?status=${status}&page=${page}`;

      const data = await safeApiFetch<PaginatedResponse<OrganizerRequest>>(url);

      if (data) {
        setRequests(data.results);
        setCount(data.count);
        setNext(data.next);
        setPrevious(data.previous);
      } else {
        setRequests([]);
        setCount(0);
        setNext(null);
        setPrevious(null);
      }
      setLoading(false);
    },
    [safeApiFetch]
  );

  // Update request status
  const updateRequest = async (
    id: number,
    newStatus: "approved" | "rejected"
  ) => {
    const result = await safeApiFetch(
      `/api/dashboard/request-organizer/${id}/update/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (result) {
      toast.success(`Request ${newStatus}!`);
      loadRequests(filter, currentPage);
    } else {
      toast.error("Failed to update request.");
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value && value !== "pending") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.replace(`/user/dashboard/admin/organizer-requests?${params}`);
    loadRequests(value, 1);
  };

  // Page navigation
  const goToPage = (newPage: number, url?: string) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (filter) params.set("status", filter);
    params.set("page", String(newPage));
    router.replace(`/user/dashboard/admin/organizer-requests?${params}`);
    loadRequests(filter, newPage, url);
  };

  // Initial load
  useEffect(() => {
    loadRequests(initialFilter, initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
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

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No {filter} requests found.</p>
      ) : (
        <>
          {/* Horizontal list */}
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm"
              >
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
                      <div className="w-full h-full rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-3xl font-bold">
                        {req?.first_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {req.first_name} {req.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{req.user_email}</p>
                    <p className="text-xs text-gray-400">
                      Requested:{" "}
                      {dayjs(req.created_at).format("MMM D, YYYY h:mm A")}
                    </p>
                    {req.reviewed_at && (
                      <p className="text-xs text-gray-400">
                        Reviewed:{" "}
                        {dayjs(req.reviewed_at).format("MMM D, YYYY h:mm A")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`capitalize text-sm font-medium ${
                      req.status === "pending"
                        ? "text-yellow-600"
                        : req.status === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {req.status}
                  </span>

                  <button
                    onClick={() =>
                      router.push(`/user/dashboard/admin/users/${req.user}`)
                    }
                    className="px-3 py-1 text-xs border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
                  >
                    View Profile
                  </button>

                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateRequest(req.id, "approved")}
                        className="flex items-center gap-1 px-3 py-1 text-xs border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-white/10 rounded"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => updateRequest(req.id, "rejected")}
                        className="flex items-center gap-1 px-3 py-1 text-xs border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={!previous}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                  previous
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <ArrowLeft size={16} /> Prev
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!next}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                  next
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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

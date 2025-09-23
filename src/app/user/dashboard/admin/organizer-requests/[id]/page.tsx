"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
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

export default function OrganizerRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();
  const [request, setRequest] = useState<OrganizerRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const requestId = params?.id;

  // Fetch request details
  const fetchRequest = async () => {
    setLoading(true);
    const data = await safeApiFetch<OrganizerRequest>(
      `/api/dashboard/request-organizer/${requestId}/`
    );
    if (data) setRequest(data);
    else toast.error("Failed to load request.");
    setLoading(false);
  };

  // Update request status
  const updateRequest = async (newStatus: "approved" | "rejected") => {
    const result = await safeApiFetch(
      `/api/dashboard/request-organizer/${requestId}/update/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (result) {
      toast.success(`Request ${newStatus}!`);
      fetchRequest();
    } else {
      toast.error("Failed to update request.");
    }
  };

  useEffect(() => {
    if (requestId) fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  if (loading) return <LoadingSpinner />;

  if (!request) {
    return (
      <div className="p-6 text-center text-gray-500">
        Request not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/user/dashboard/admin/organizer-requests")}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ArrowLeft size={16} /> Back to Requests
      </button>

      {/* Card */}
      <div className="p-6 border rounded-lg bg-white dark:bg-gray-900 shadow-sm space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            {request.profile_image ? (
              <Image
                src={request.profile_image}
                alt="Profile"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-3xl font-bold">
                {request.first_name[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-xl font-semibold">
              {request.first_name} {request.last_name}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
            <p className="text-gray-500">{request.user_email}</p>
          <p>
            <span className="font-medium">Status:</span>{" "}
            <span
              className={`capitalize ${
                request.status === "pending"
                  ? "text-yellow-600"
                  : request.status === "approved"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {request.status}
            </span>
          </p>
          <p>
            <span className="font-medium">Requested:</span>{" "}
            {dayjs(request.created_at).format("MMM D, YYYY h:mm A")}
          </p>
          {request.reviewed_at && (
            <p>
              <span className="font-medium">Reviewed:</span>{" "}
              {dayjs(request.reviewed_at).format("MMM D, YYYY h:mm A")}
            </p>
          )}
          {request.reason && (
            <p>
              <span className="font-medium">Reason:</span> {request.reason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4">
          {request.status === "pending" && (
            <>
              <button
                onClick={() => updateRequest("approved")}
                className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 dark:hover:bg-white/10"
              >
                <CheckCircle2 size={16} /> Approve
              </button>
              <button
                onClick={() => updateRequest("rejected")}
                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 dark:hover:bg-white/10"
              >
                <XCircle size={16} /> Reject
              </button>
            </>
          )}
          <button
            onClick={() =>
              router.push(`/user/dashboard/admin/users/${request.user}`)
            }
            className="px-4 py-2 border border-indigo-500 text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-white/10"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
}

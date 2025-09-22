"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import { motion } from "framer-motion";

// Define type for API response
type OrganizerRequestStatus =
  | {
      status: "none";
    }
  | {
      status: "pending";
    }
  | {
      status: "approved";
    }
  | {
      status: "rejected";
      can_request_again: boolean;
      remaining_days: number;
    };

export default function RequestOrganizerPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<OrganizerRequestStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();

  // Fetch status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await safeApiFetch<OrganizerRequestStatus>(
          "/api/dashboard/request-organizer/status/"
        );
        if (res?.status === "approved") {
          toast.success("You are already an organizer!");
          router.push("/user/dashboard/organizer/events");
        } else {
          setStatus(res);
        }
      } finally {
        setChecking(false);
      }
    };
    fetchStatus();
  }, [safeApiFetch, router]);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await safeApiFetch("/api/dashboard/request-organizer/", {
        method: "POST",
      });

      if (res) {
        toast.success("Your request has been submitted successfully!");
        setStatus({ status: "pending" });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (checking) {
      return (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Checking your organizer status...
        </p>
      );
    }

    if (!status || status.status === "none") {
      return (
        <div className="flex flex-col items-center">
          <button
            onClick={handleRequest}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            Once approved, you’ll gain access to organizer tools for creating
            and managing events.
          </p>
        </div>
      );
    }

    if (status.status === "pending") {
      return (
        <div className="text-center">
          <span className="inline-block px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
            ⏳ Your request is under review
          </span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Our admins will notify you via email once reviewed.
          </p>
        </div>
      );
    }

    if (status.status === "rejected" && !status.can_request_again) {
      return (
        <div className="text-center">
          <span className="inline-block px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
            ❌ Request Rejected
          </span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            You can try again in{" "}
            <span className="font-bold text-red-600">
              {status.remaining_days} days
            </span>
            .
          </p>
        </div>
      );
    }

    if (status.status === "rejected" && status.can_request_again) {
      return (
        <div className="flex flex-col items-center">
          <button
            onClick={handleRequest}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Resubmit Request"}
          </button>
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            Your previous request was rejected, but you can submit a new one now.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-8 sm:p-10"
      >
        <h6 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 text-center">
          First, you need to
        </h6>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 text-center">
          Become an Organizer
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Submit your request to become an organizer on{" "}
          <span className="font-semibold text-indigo-600">Event</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            Pilot
          </span>
          . An admin will review your request and notify you via email.
        </p>

        {renderContent()}
      </motion.div>
    </div>
  );
}

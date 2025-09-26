"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  MapPin,
  Clock,
  Calendar,
  Tag,
  Users,
  Lock,
  Globe,
  HeartHandshake,
  Star,
} from "lucide-react";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import ScheduleTimeline from "@/components/ScheduleTimeline";

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventDetail {
  id: number;
  organizer: number;
  organizer_name: string;
  title: string;
  description: string;
  category: { id: number; name: string; description: string } | null;
  tags: string[];
  image: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  location_map_url: string;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  capacity: number;
  allow_waitlist: boolean;
  attending_count: number;
  interested_count: number;
  reaction_status: "attending" | "interested" | null;
  created_at: string;
  updated_at: string;
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();
  const searchParams = useSearchParams();

  const [isReacting, setIsReacting] = useState<"attending" | "interested" | null>(null);

  // Build SWR key
  const swrKey = useMemo(() => {
    if (!id) return null;
    return `/api/events/${id}/`;
  }, [id]);

  // SWR fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<EventDetail>(url),
    [safeApiFetch]
  );

  // SWR hook
  const {
    data: event,
    error,
    isLoading,
    mutate,
  } = useSWR<EventDetail | null>(swrKey, fetcher);

  // Error toast
  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  // Handle reaction
  const handleReaction = async (
    status: "attending" | "interested" | "none"
  ) => {
    if (!event) return;
    if (status === "none") {
      setIsReacting(event.reaction_status || null);
    } else {
      setIsReacting(status);
    }

    try {
      const updated = await safeApiFetch<EventDetail>(
        `/api/events/${event.id}/react/`,
        {
          method: "POST",
          body: JSON.stringify({ status }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (updated && updated.id) {
        await mutate(updated, false); // update cache without revalidation
        toast.success("Reaction updated successfully");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else if (typeof err === "object" && err !== null && "detail" in err) {
        toast.error(String((err as { detail: string }).detail));
      } else {
        toast.error("Failed to update reaction");
      }
    } finally {
      setIsReacting(null);
    }
  };

  const handleBack = () => {
    if (document.referrer.includes("/events")) {
      router.back();
    } else {
      const fromQs = searchParams.get("from");
      const lastListUrl = fromQs
        ? `/events?${decodeURIComponent(fromQs)}`
        : sessionStorage.getItem("events_last_list_url") || "/events";
      router.push(lastListUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center bg-white dark:bg-black justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Event not found.</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pt-20 pb-16">
      {/* Hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden shadow">
          <Image
            src={event.image || "/placeholder.jpeg"}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 sm:p-10">
            <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs rounded-full w-max mb-2">
              {event.category?.name ?? "General"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200 mt-3">
              <div className="flex items-center gap-1">
                <Calendar size={16} />{" "}
                {dayjs(event.start_time).format("MMM D, YYYY")}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} /> {dayjs(event.start_time).format("h:mm A")} –{" "}
                {dayjs(event.end_time).format("h:mm A")}
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} /> {event.venue}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-3">About this event</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Tag size={16} /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {event.location_map_url && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-3">Location</h3>
              <a
                href={event.location_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                View on Map
              </a>
            </div>
          )}

          {/* Schedule Timeline */}
          <ScheduleTimeline />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Event Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Users size={16} /> Capacity: {event.capacity.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                {event.visibility === "private" ? (
                  <>
                    <Lock size={16} /> Private
                  </>
                ) : (
                  <>
                    <Globe size={16} /> Public
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                Organizer:{" "}
                <span className="font-medium">{event.organizer_name}</span>
              </div>
              {event.allow_waitlist && (
                <div className="text-green-600 text-sm">Waitlist available</div>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium dark:bg-green-900/30 dark:text-green-300">
                <HeartHandshake size={14} className="text-green-500" />
                {event.attending_count} Attending
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium dark:bg-yellow-900/30 dark:text-yellow-300">
                <Star size={14} className="text-yellow-500" />
                {event.interested_count} Interested
              </span>
            </div>

            {/* Reaction buttons */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleReaction(
                      event.reaction_status === "attending"
                        ? "none"
                        : "attending"
                    )
                  }
                  disabled={
                    isReacting !== null ||
                    event.status === "archived" ||
                    dayjs().isAfter(dayjs(event.end_time)) ||
                    (event.reaction_status !== "attending" &&
                      event.attending_count >= event.capacity &&
                      !event.allow_waitlist)
                  }
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    event.reaction_status === "attending"
                      ? "bg-green-600"
                      : "bg-green-500 hover:bg-green-600"
                  } ${
                    (event.attending_count >= event.capacity &&
                      !event.allow_waitlist) ||
                    event.status === "archived" ||
                    dayjs().isAfter(dayjs(event.end_time))
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isReacting === "attending"
                    ? "Updating..."
                    : event.reaction_status === "attending"
                    ? "Attending ✓"
                    : event.attending_count >= event.capacity &&
                      !event.allow_waitlist
                    ? "Full"
                    : "Mark as Attending"}
                </button>
                <button
                  onClick={() =>
                    handleReaction(
                      event.reaction_status === "interested"
                        ? "none"
                        : "interested"
                    )
                  }
                  disabled={
                    isReacting !== null ||
                    event.status === "archived" ||
                    dayjs().isAfter(dayjs(event.end_time))
                  }
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    event.reaction_status === "interested"
                      ? "bg-yellow-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } ${
                    event.status === "archived" ||
                    dayjs().isAfter(dayjs(event.end_time))
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isReacting === "interested"
                    ? "Updating..."
                    : event.reaction_status === "interested"
                    ? "Interested ★"
                    : "Mark as Interested"}
                </button>
              </div>

              {/* Archived / Past Event Message */}
              {(event.status === "archived" ||
                dayjs().isAfter(dayjs(event.end_time))) && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 
      1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 
      1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-medium">
                    This event has ended and is no longer accepting responses.
                  </span>
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

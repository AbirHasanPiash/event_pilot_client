"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "react-hot-toast";
import { Pencil, Trash2, Calendar, MapPin, Users } from "lucide-react";

import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import EventModal from "@/components/EventModal";
import ConfirmModal from "@/components/ConfirmModal";
import ScheduleModal from "@/components/ScheduleModal";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import { Event } from "@/types/events";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ScheduleInput {
  start_datetime?: string | null;
  end_datetime?: string | null;
  title?: string;
  agenda?: string;
}

export interface AdminEventForm {
  id?: number | null;
  title: string;
  description: string;
  category?: { id: number; name?: string; description?: string } | null;
  tags: string[];
  image?: File | string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number | null;
  allow_waitlist: boolean;
}

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeApiFetch = useSafeApiFetch();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // SWR key
  const swrKey = useMemo(() => (id ? `/api/events/${id}/` : null), [id]);

  // SWR fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<Event>(url),
    [safeApiFetch]
  );

  // SWR hook
  const {
    data: event,
    error,
    isLoading,
    mutate,
  } = useSWR<Event | null>(swrKey, fetcher);

  // Error toast
  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
      router.push("/user/dashboard/admin/events");
    }
  }, [error, router]);

  // -------------------- Update Event --------------------
  const handleUpdate = async (form: AdminEventForm) => {
    if (!event) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    if (form.category?.id)
      formData.append("category_id", String(form.category.id));
    formData.append("tags", JSON.stringify(form.tags));
    if (form.image instanceof File) formData.append("image", form.image);
    if (form.start_time) formData.append("start_time", form.start_time);
    if (form.end_time) formData.append("end_time", form.end_time);
    formData.append("venue", form.venue);
    formData.append("location_map_url", form.location_map_url);
    formData.append("visibility", form.visibility);
    formData.append("status", form.status);
    formData.append("capacity", String(form.capacity ?? 0));
    formData.append("allow_waitlist", String(form.allow_waitlist));

    try {
      const updated = await safeApiFetch<Event>(`/api/events/${event.id}/`, {
        method: "PUT",
        body: formData,
      });

      if (updated) {
        await mutate(updated, false); // update cache without refetch
        toast.success("Event updated successfully!");
        setShowEditModal(false);
      }
    } catch {
      toast.error("Failed to update event.");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------- Delete Event --------------------
  const handleDelete = async () => {
    if (!event) return;
    try {
      const result = await safeApiFetch(`/api/events/${event.id}/`, {
        method: "DELETE",
      });
      if (result !== null) {
        toast.success("Event deleted successfully!");
        router.push("/user/dashboard/admin/events");
      }
    } catch {
      toast.error("Failed to delete event.");
    }
  };

  // -------------------- Add Schedules --------------------
  const handleScheduleSubmit = async (schedules: ScheduleInput[]) => {
    if (!event) return;

    const payload = schedules
      .map((s) => ({
        start_datetime: s.start_datetime
          ? new Date(s.start_datetime).toISOString()
          : null,
        end_datetime: s.end_datetime
          ? new Date(s.end_datetime).toISOString()
          : null,
        title: s.title?.trim() || "",
        agenda: s.agenda?.trim() || "",
      }))
      .filter((s) => s.start_datetime && s.title);

    if (payload.length === 0) {
      toast.error(
        "Please add at least one valid schedule with title and start time."
      );
      return;
    }

    try {
      const result = await safeApiFetch(
        `/api/events/${event.id}/schedules/bulk/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedules: payload }),
        }
      );

      if (result) {
        toast.success("Schedules created successfully!");
        await mutate(); // revalidate event details
      }
    } catch {
      toast.error("Failed to create schedules.");
    }
  };

  // Back to list handler
  const handleBack = () => {
    if (document.referrer.includes("/admin/events")) {
      router.back();
    } else {
      const fromQs = searchParams.get("from");
      const lastListUrl = fromQs
        ? `/user/dashboard/admin/events?${decodeURIComponent(fromQs)}`
        : sessionStorage.getItem("admin_events_last_list_url") ||
          "/user/dashboard/admin/events";
      router.push(lastListUrl);
    }
  };

  const memoizedInitialData = useMemo(() => {
    if (!event) return null;
    return {
      ...event,
      image: null,
      existingImage: event.image || undefined,  
      category_id: event.category?.id || null,
    };
  }, [event]);

  if (isLoading) return <LoadingSpinner />;
  if (!event) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Image + Details */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="relative w-full h-48 md:h-56 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow">
          <Image
            src={event.image?.trim() ? event.image : "/placeholder.jpeg"}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {event.category.name}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {event.visibility}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              Status: {event.status}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="text-indigo-500" size={18} />
              <span>
                {dayjs(event.start_time).format("MMM D, YYYY h:mm A")} →{" "}
                {dayjs(event.end_time).format("MMM D, YYYY h:mm A")}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="text-indigo-500" size={18} />
              <span>
                {event.venue}{" "}
                {event.location_map_url && (
                  <>
                    -{" "}
                    <a
                      href={event.location_map_url}
                      className="text-blue-500 hover:underline"
                      target="_blank"
                    >
                      View Map
                    </a>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="text-indigo-500" size={18} />
              <span>
                Capacity: <span className="font-medium">{event.capacity}</span>{" "}
                | Waitlist:{" "}
                <span
                  className={`font-medium ${
                    event.allow_waitlist ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {event.allow_waitlist ? "Yes" : "No"}
                </span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="text-green-500" size={18} />
              <span>
                Attending:{" "}
                <span className="font-medium">{event.attending_count}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="text-yellow-500" size={18} />
              <span>
                Interested:{" "}
                <span className="font-medium">{event.interested_count}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">Organizer:</span>{" "}
              {event.organizer_name}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Description</h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Schedules */}
      <div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="mt-4 px-4 py-2 text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg"
        >
          + Add Sub-Schedules
        </button>
      </div>

      <ScheduleTimeline />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleSubmit}
        mainStart={event.start_time}
        mainEnd={event.end_time}
      />

      <EventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        initialData={memoizedInitialData || undefined}
        loading={submitting}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Event?"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
      />

      {/* Back Button */}
      <div className="pt-4">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
}

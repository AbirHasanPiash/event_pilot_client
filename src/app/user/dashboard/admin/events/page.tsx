"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import EventModal from "@/components/EventModal";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import LoadingSpinner from "@/components/LoadingSpinner";

dayjs.extend(utc);
dayjs.extend(timezone);

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface Event {
  id: number;
  organizer: number;
  organizer_name: string;
  title: string;
  description: string;
  category: { id: number; name: string; description: string };
  tags: string[];
  image: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number;
  allow_waitlist: boolean;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  id?: number | null;
  title: string;
  description: string;
  category?: { id: number; name: string; description: string } | null;
  tags: string[];
  image: File | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number;
  allow_waitlist: boolean;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const initialDateFilter = searchParams.get("date_filter") || "";
  const [dateFilter, setDateFilter] = useState(initialDateFilter);

  const emptyEventData: EventFormData = {
    title: "",
    description: "",
    category: null,
    tags: [],
    image: null,
    start_time: "",
    end_time: "",
    venue: "",
    location_map_url: "",
    visibility: "public",
    status: "draft",
    capacity: 0,
    allow_waitlist: false,
  };

  const memoizedInitialData = useMemo(() => {
    return editingEvent
      ? {
          ...editingEvent,
          image: null, // File input starts empty
          existingImage: editingEvent?.image || null,
        }
      : emptyEventData;
  }, [editingEvent]);

  // Load events
  const loadEvents = useCallback(
    async (query = "", dateFilter = "") => {
      setLoading(true);

      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (dateFilter) params.set("date_filter", dateFilter);

      const data = await safeApiFetch<PaginatedResponse<Event>>(
        `/api/events/?${params.toString()}`
      );

      if (data && Array.isArray(data.results)) {
        setEvents(data.results);
      } else {
        setEvents([]);
      }

      setLoading(false);
    },
    [safeApiFetch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`/user/dashboard/admin/events?${params.toString()}`);
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDateFilter(value);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    if (value) {
      params.set("date_filter", value);
    } else {
      params.delete("date_filter");
    }

    router.replace(`/user/dashboard/admin/events?${params.toString()}`);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadEvents(searchTerm, dateFilter);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, dateFilter, loadEvents]);

  // Handle Create / Update
  const handleFormSubmit = async (form: EventFormData) => {
    setSubmitting(true);

    const isEdit = !!form.id;
    const method = isEdit ? "PUT" : "POST";
    const endpoint = isEdit ? `/api/events/${form.id}/` : "/api/events/";

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    if (form.category?.id) {
      formData.append("category_id", String(form.category.id));
    }
    formData.append("tags", JSON.stringify(form.tags));

    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    if (form.start_time) formData.append("start_time", form.start_time);
    if (form.end_time) formData.append("end_time", form.end_time);
    formData.append("venue", form.venue);
    formData.append("location_map_url", form.location_map_url);
    formData.append("visibility", form.visibility);
    formData.append("status", form.status);
    formData.append("capacity", String(form.capacity));
    formData.append("allow_waitlist", String(form.allow_waitlist));

    const result = await safeApiFetch(endpoint, {
      method,
      body: formData,
      headers: {}, // Let browser set multipart/form-data boundaries
    });

    if (result) {
      toast.success(`Event ${isEdit ? "updated" : "created"} successfully!`);
      setShowFormModal(false);
      setEditingEvent(null);
      loadEvents();
    } else {
      toast.error("Failed to save event. Please try again.");
    }

    setSubmitting(false);
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (eventToDelete === null) return;

    const result = await safeApiFetch(`/api/events/${eventToDelete}/`, {
      method: "DELETE",
    });

    if (result !== null) {
      toast.success("Event deleted successfully!");
      loadEvents();
    }

    setShowDeleteConfirm(false);
    setEventToDelete(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header + Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowFormModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      {/* Search & Date Filter */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-sm px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
        <select
          value={dateFilter}
          onChange={handleDateFilterChange}
          className="px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
          <option value="">All</option>
          <option value="archived">Archived</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
        </select>
      </div>

      {/* Event List */}
      {loading ? (
        // <p className="text-gray-500">Loading...</p>
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 flex flex-col"
            >
              {/* Image */}
              <div
                className="relative w-full h-40 cursor-pointer"
                onClick={() =>
                  router.push(`/user/dashboard/admin/events/${event.id}`)
                }
              >
                <Image
                  src={event.image ? event.image : "/placeholder.jpeg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow">
                <h3
                  className="text-lg font-semibold hover:text-indigo-600 cursor-pointer"
                  onClick={() =>
                    router.push(`/user/dashboard/admin/events/${event.id}`)
                  }
                >
                  {event.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {event.description}
                </p>

                <div className="mt-2 text-xs text-gray-400">
                  <p>
                    <strong>When:</strong>{" "}
                    {dayjs(event.start_time).format("MMM D, YYYY h:mm A")}
                  </p>
                  {event.category?.name && (
                    <p>
                      <strong>Category:</strong> {event.category.name}
                    </p>
                  )}
                </div>

                {/* Tags (inline, fewer lines) */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEvent(event);
                      setShowFormModal(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventToDelete(event.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <EventModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingEvent(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={memoizedInitialData}
        loading={submitting}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Event?"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onCancel={() => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText="Delete"
      />
    </div>
  );
}

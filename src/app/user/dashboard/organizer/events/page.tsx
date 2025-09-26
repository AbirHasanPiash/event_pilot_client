"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import EventModal from "@/components/EventModal";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { Event, EventFormData } from "@/types/events";

dayjs.extend(utc);
dayjs.extend(timezone);

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const EMPTY_EVENT_DATA: EventFormData = {
  title: "",
  description: "",
  category: null,
  tags: [],
  image: null,
  start_time: null,
  end_time: null,
  venue: "",
  location_map_url: "",
  visibility: "public",
  status: "draft",
  capacity: 0,
  allow_waitlist: false,
};

export default function OrganizerEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeApiFetch = useSafeApiFetch();
  const { user } = useAuth();

  // Modal / form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // URL-driven state
  const initialSearch = searchParams.get("search") || "";
  const initialDateFilter = searchParams.get("date_filter") || "";
  const initialPage = Number(searchParams.get("page") || 1);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [page, setPage] = useState<number>(initialPage);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Build query string
  const buildQuery = useCallback(
    (pageNum = page, filter = dateFilter, search = debouncedSearch) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      if (filter) params.set("date_filter", filter);
      if (search) params.set("search", search);
      if (user?.id) params.set("organizer", String(user.id));
      return params.toString();
    },
    [dateFilter, debouncedSearch, page, user]
  );

  // SWR key
  const swrKey = useMemo(() => {
    if (!user) return null;
    return `/api/events/?${buildQuery(page)}`;
  }, [buildQuery, page, user]);

  // SWR fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<PaginatedResponse<Event>>(url),
    [safeApiFetch]
  );

  const { data, error, isLoading } = useSWR<PaginatedResponse<Event> | null>(
    swrKey,
    fetcher,
    { keepPreviousData: true }
  );

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  // Keep prev values for router behavior
  const prevRef = useRef({
    page: initialPage,
    dateFilter: initialDateFilter,
    debouncedSearch: initialSearch,
  });

  // Sync URL
  useEffect(() => {
    if (!user) return;
    const qs = buildQuery(page);
    const url = `/user/dashboard/organizer/events?${qs}`;

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("organizer_events_last_list_url", url);
      }
    } catch {
      // ignore storage errors
    }

    const prev = prevRef.current;
    const onlyPageChanged =
      prev.page !== page &&
      prev.dateFilter === dateFilter &&
      prev.debouncedSearch === debouncedSearch;

    if (onlyPageChanged) {
      router.push(url, { scroll: false });
    } else {
      router.replace(url, { scroll: false });
    }

    prevRef.current = { page, dateFilter, debouncedSearch };
  }, [page, dateFilter, debouncedSearch, router, buildQuery, user]);

  // Reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [dateFilter, debouncedSearch]);

  // Sync state with URL
  useEffect(() => {
    const urlPage = Number(searchParams.get("page") || 1);
    const urlFilter = searchParams.get("date_filter") || "";
    const urlSearch = searchParams.get("search") || "";

    setPage(urlPage);
    setDateFilter(urlFilter);
    setSearchTerm(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [searchParams]);

  // Data
  const events = data?.results || [];
  const count = data?.count ?? 0;

  // Memoized form data
  const memoizedInitialData = useMemo(() => {
    if (!editingEvent) return EMPTY_EVENT_DATA;

    return {
      ...editingEvent,
      image: null,
      existingImage: editingEvent.image || undefined,
      category: editingEvent.category ? { id: editingEvent.category.id } : null,
      tags: editingEvent.tags || [],
      start_time: editingEvent.start_time || null,
      end_time: editingEvent.end_time || null,
      capacity: editingEvent.capacity ?? 0,
      allow_waitlist: editingEvent.allow_waitlist ?? false,
    };
  }, [editingEvent]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDateFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDateFilter(event.target.value);
  };

  // Pagination
  const goNext = () => {
    if (data?.next) {
      const url = new URL(
        data.next,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost"
      );
      const p = Number(url.searchParams.get("page") || page + 1);
      setPage(p);
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (data?.previous) {
      const url = new URL(
        data.previous,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost"
      );
      const p = Number(url.searchParams.get("page") || Math.max(1, page - 1));
      setPage(p);
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // --- Create / Update ---
  const handleFormSubmit = async (form: EventFormData) => {
    if (!user) return;
    setSubmitting(true);

    const isEdit = !!form.id;
    const method = isEdit ? "PUT" : "POST";
    const endpoint = isEdit ? `/api/events/${form.id}/` : "/api/events/";

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    if (form.category?.id) {
      formData.append("category_id", String(form.category.id));
    }
    formData.append("tags", JSON.stringify(form.tags));
    if (form.image instanceof File) formData.append("image", form.image);
    if (form.start_time) formData.append("start_time", form.start_time);
    if (form.end_time) formData.append("end_time", form.end_time);
    formData.append("venue", form.venue);
    formData.append("location_map_url", form.location_map_url);
    formData.append("visibility", form.visibility);
    formData.append("status", form.status);
    formData.append("capacity", String(form.capacity));
    formData.append("allow_waitlist", String(form.allow_waitlist));
    formData.append("organizer", String(user.id));

    try {
      const result = await safeApiFetch(endpoint, {
        method,
        body: formData,
        headers: {},
      });

      if (result) {
        toast.success(`Event ${isEdit ? "updated" : "created"} successfully!`);
        setShowFormModal(false);
        setEditingEvent(null);
        mutate(swrKey);
      } else {
        toast.error("Failed to save event. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save event. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete ---
  const confirmDelete = async () => {
    if (eventToDelete === null) return;

    try {
      await safeApiFetch(`/api/events/${eventToDelete}/`, {
        method: "DELETE",
      });

      toast.success("Event deleted successfully!");
      mutate(swrKey);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete event.");
      }
    } finally {
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header + Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Events</h2>
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
          placeholder="Search my events..."
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
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-500">Failed to load events.</p>
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
                  router.push(`/user/dashboard/organizer/events/${event.id}`)
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
                    router.push(`/user/dashboard/organizer/events/${event.id}`)
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

                {/* Tags */}
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

      {/* Pagination */}
      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
          <span className="text-sm text-gray-600">
            Page {page} — Showing <b>{events.length}</b> of <b>{count}</b>{" "}
            events
          </span>
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={goPrev}
              disabled={!data?.previous}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                data?.previous
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <ArrowLeft size={16} /> Prev
            </button>
            <button
              onClick={goNext}
              disabled={!data?.next}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                data?.next
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Calendar,
} from "lucide-react";

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
  organizer_name: string;
  title: string;
  description: string;
  category: { id: number; name: string; description: string } | null;
  tags: string[];
  image: string | null;
  start_time: string;
  end_time: string;
  venue: string;
}

const DATE_FILTERS = [
  { key: "", label: "All", Icon: Filter },
  { key: "ongoing", label: "Ongoing", Icon: Clock },
  { key: "today", label: "Today", Icon: Calendar },
  { key: "upcoming", label: "Upcoming", Icon: Filter },
  { key: "archived", label: "Archived", Icon: Filter },
];

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeApiFetch = useSafeApiFetch();

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  // Query state (URL-synced)
  const initialSearch = searchParams.get("search") || "";
  const initialFilter = searchParams.get("date_filter") || "";
  const initialPage = Number(searchParams.get("page") || 1);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [dateFilter, setDateFilter] = useState(initialFilter);
  const [page, setPage] = useState<number>(initialPage);

  // Debounce search input locally
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Build query string helper
  const buildQuery = useCallback(
    (pageNum = page, filter = dateFilter, search = debouncedSearch) => {
      const params = new URLSearchParams();
      if (filter) params.set("date_filter", filter);
      if (search) params.set("search", search);
      if (pageNum && pageNum > 1) params.set("page", String(pageNum));
      return params.toString();
    },
    [dateFilter, debouncedSearch, page]
  );

  // Load events from API (supports pagination)
  const loadEvents = useCallback(
    async (pageNum = 1, filter = dateFilter, search = debouncedSearch) => {
      setLoading(true);
      try {
        const qs = buildQuery(pageNum, filter, search);
        const endpoint = `/api/events/?${qs}`;
        const data = await safeApiFetch<PaginatedResponse<Event>>(endpoint);

        setEvents(data?.results || []);
        setCount(data?.count ?? null);
        setNextUrl(data?.next ?? null);
        setPrevUrl(data?.previous ?? null);
      } finally {
        setLoading(false);
      }
    },
    [safeApiFetch, buildQuery, dateFilter, debouncedSearch]
  );

  // Sync URL and load on filter/search/page changes
  useEffect(() => {
    // Update URL without refreshing page
    const qs = buildQuery(page, dateFilter, debouncedSearch);
    router.replace(`/events?${qs}`);
    loadEvents(page, dateFilter, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateFilter, debouncedSearch]);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [dateFilter, debouncedSearch]);

  // Memoized summary text
  const resultSummary = useMemo(() => {
    if (loading) return "Searching...";
    if (count === 0) return "No events found";
    if (count === 1) return "1 event found";
    return `${count ?? "—"} events`;
  }, [count, loading]);

  // Pagination handlers
  const goNext = () => {
    if (nextUrl) {
      // If API provided full next URL, try to extract page param
      const url = new URL(nextUrl, typeof window !== "undefined" ? window.location.origin : undefined);
      const p = Number(url.searchParams.get("page") || page + 1);
      setPage(p);
    } else {
      setPage((s) => s + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    if (prevUrl) {
      const url = new URL(prevUrl, typeof window !== "undefined" ? window.location.origin : undefined);
      const p = Number(url.searchParams.get("page") || Math.max(1, page - 1));
      setPage(p);
    } else {
      setPage((s) => Math.max(1, s - 1));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // page background: white (light) / black (dark)
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Discover Events
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {resultSummary} • {debouncedSearch ? `Searching for "${debouncedSearch}"` : "Browse by filter or search"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filters (pill group) */}
            <div className="hidden sm:flex gap-2">
              {DATE_FILTERS.map((f) => {
                const active = dateFilter === f.key;
                const Icon = f.Icon;
                return (
                  <button
                    key={f.key || "all"}
                    onClick={() => setDateFilter(f.key)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-shadow border ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:shadow-sm hover:bg-indigo-50 dark:hover:bg-white/5"
                    }`}
                    aria-pressed={active}
                    title={f.label}
                  >
                    <Icon size={14} className={`${active ? "text-white" : "text-indigo-500"}`} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-none w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search events, tags or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Search events"
              />
            </div>
          </div>
        </div>

        {/* Mobile filter strip */}
        <div className="sm:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DATE_FILTERS.map((f) => {
              const active = dateFilter === f.key;
              return (
                <button
                  key={f.key || "all-mobile"}
                  onClick={() => setDateFilter(f.key)}
                  className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid + Sidebar layout (cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main list */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center bg-white dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400">No events match your query.</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Try clearing filters or searching different keywords.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {events.map((event) => (
                  <article
                    key={event.id}
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="group cursor-pointer rounded-2xl overflow-hidden shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:shadow-none border border-gray-100 dark:border-gray-800 bg-gradient-to-b from-white to-white/90 dark:from-gray-900 dark:to-gray-900/95 hover:scale-[1.01] transition-transform duration-200"
                    role="link"
                    aria-label={`Open event ${event.title}`}
                  >
                    <div className="relative h-44 w-full">
                      <Image
                        src={event.image || "/placeholder.jpeg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* overlay badge */}
                      <div className="absolute left-3 top-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                        {event.category?.name ?? "General"}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold leading-snug truncate">{event.title}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <div>{dayjs(event.start_time).format("MMM D")}</div>
                          <div className="mt-1 font-medium text-gray-800 dark:text-gray-200 text-sm">
                            {dayjs(event.start_time).format("h:mm A")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {event.tags.slice(0, 4).map((t) => (
                            <span key={t} className="px-2 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {event.venue}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page <span className="font-medium">{page}</span>
                {count !== null && (
                  <span className="text-gray-500"> — {count} total</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <button
                  onClick={goNext}
                  disabled={events.length === 0 || loading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                  aria-label="Next page"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right column: small insights / CTA */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-lg p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h4 className="text-sm font-semibold">Refine results</h4>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Use filters and search to quickly find events. Try searching with city, tag or organizer.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => { setDateFilter("ongoing"); setPage(1); }}
                    className="text-left text-sm px-3 py-2 rounded-md border bg-indigo-50 text-indigo-700"
                  >
                    Ongoing events
                  </button>
                  <button
                    onClick={() => { setDateFilter("upcoming"); setPage(1); }}
                    className="text-left text-sm px-3 py-2 rounded-md border bg-white dark:bg-gray-800"
                  >
                    Upcoming events
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

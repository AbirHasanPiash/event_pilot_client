"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  RefreshCw,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Tag,
  Map,
} from "lucide-react";

import LoadingSpinner from "@/components/LoadingSpinner";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import useSWR from "swr";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

interface EventItem {
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
  visibility: string;
  status: string;
  capacity: number;
  allow_waitlist: boolean;
  reaction_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserDashboardResponse {
  today?: {
    attending?: EventItem[];
    interested?: EventItem[];
  };
  ongoing?: EventItem[];
  upcoming?: {
    attending?: EventItem[];
    interested?: EventItem[];
  };
  archived?: EventItem[];
}

const POLL_MS = 2 * 60 * 1000; // poll every 2 minutes
const PAGE_SIZE = 9;

function AvatarFallback({ title }: { title: string }) {
  return (
    <div className="w-full h-40 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500">
      <div className="text-sm">{title}</div>
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  showDiscoverButton = true,
}: {
  title: string;
  subtitle?: string;
  showDiscoverButton?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-xs flex flex-col items-center gap-4">
        <Users className="mx-auto text-gray-400 w-10 h-10" />
        <div>
          <h3 className="mt-2 text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {showDiscoverButton && (
          <button
            onClick={() => router.push("/events")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
              bg-indigo-600 text-white text-sm font-medium shadow-sm
              hover:bg-indigo-700 active:bg-indigo-800 
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 
              transition w-full sm:w-auto"
          >
            <MapPin className="w-4 h-4" />
            Find Events
          </button>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onOpen,
}: {
  event: EventItem;
  onOpen: (id: number) => void;
}) {
  const start = dayjs(event.start_time).local();
  const hasMap = Boolean(event.location_map_url);

  return (
    <article
      onClick={() => onOpen(event.id)}
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-2xl overflow-hidden shadow-[0_6px_18px_rgba(15,23,42,0.06)]
        dark:shadow-none border border-gray-100 dark:border-gray-800
        bg-white dark:bg-gray-900 hover:scale-[1.01] transition-transform duration-200 focus:outline-none
        focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* Cover Image */}
      <div className="relative h-40 w-full overflow-hidden">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <AvatarFallback title={event.title} />
        )}

        {/* Category (prevent overlap with Private) */}
        <div className="absolute left-3 top-3 z-10 px-2 py-1 rounded-md bg-black/60 text-white text-xs max-w-[60%] truncate">
          {event.category?.name ?? "General"}
        </div>

        {/* Private badge */}
        {event.visibility === "private" && (
          <div className="absolute right-3 top-3 z-10 px-2 py-1 rounded-md bg-yellow-600/90 text-white text-xs">
            Private
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <h3 className="text-lg font-semibold leading-snug break-words line-clamp-2 min-h-[3.5rem]">
          {event.title}
        </h3>

        {/* Description (fixed height for consistency) */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {event.description || "No description provided."}
        </p>

        {/* Venue + Time + Actions */}
        <div className="flex items-center justify-between gap-3 text-sm flex-wrap">
          {/* Venue (truncate to avoid pushing other items) */}
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-0 flex-1">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate" title={event.venue || "No venue"}>
              {event.venue || "No venue"}
            </span>
          </div>

          {/* Right side: reaction (optional), date/time (single source of truth), map */}
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {event.reaction_status && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 capitalize">
                {event.reaction_status}
              </span>
            )}

            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span>{start.format("MMM D • h:mm A")}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasMap) window.open(event.location_map_url!, "_blank");
              }}
              disabled={!hasMap}
              aria-disabled={!hasMap}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs
                ${
                  hasMap
                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/60 opacity-60 cursor-not-allowed"
                }`}
            >
              <Map className="w-3 h-3" /> Map
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function UserDashboardPage() {
  const safeApiFetch = useSafeApiFetch();
  const router = useRouter();

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "today" | "ongoing" | "upcoming" | "archived"
  >("today");
  const [currentPage, setCurrentPage] = useState(1);

  const fetcher = useCallback(
    async (url: string): Promise<UserDashboardResponse> => {
      const res = await safeApiFetch<UserDashboardResponse | null>(url);
      if (!res) throw new Error("No data");
      return res;
    },
    [safeApiFetch]
  );

  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR<UserDashboardResponse>("/api/dashboard/user/", fetcher, {
    refreshInterval: POLL_MS,
    onSuccess: () => setLastUpdated(Date.now()),
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // compute counts (safe)
  const counts = useMemo(() => {
    const todayAtt = data?.today?.attending?.length ?? 0;
    const todayInt = data?.today?.interested?.length ?? 0;
    const ongoing = data?.ongoing?.length ?? 0;
    const upcomingAtt = data?.upcoming?.attending?.length ?? 0;
    const upcomingInt = data?.upcoming?.interested?.length ?? 0;
    const archived = data?.archived?.length ?? 0;
    return {
      today: todayAtt + todayInt,
      ongoing,
      upcoming: upcomingAtt + upcomingInt,
      archived,
      attendingToday: todayAtt,
      interestedToday: todayInt,
      upcomingAtt,
      upcomingInt,
    };
  }, [data]);

  const tabList = useMemo((): EventItem[] => {
    switch (activeTab) {
      case "today":
        return [...(data?.today?.attending ?? []), ...(data?.today?.interested ?? [])];
      case "ongoing":
        return data?.ongoing ?? [];
      case "upcoming":
        return [...(data?.upcoming?.attending ?? []), ...(data?.upcoming?.interested ?? [])];
      case "archived":
        return data?.archived ?? [];
      default:
        return [];
    }
  }, [activeTab, data]);

  const totalPages = Math.ceil(tabList.length / PAGE_SIZE);
  const paginatedList = tabList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // safe open
  const openEvent = useCallback(
    (id: number) => {
      router.push(`/events/${id}`);
    },
    [router]
  );

  // UI quick refresh
  const onRefresh = async () => {
    try {
      await mutate();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Events
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Quickly access events you’re attending or interested in — and
              discover new ones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />{" "}
                <span>{counts.today} Today</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />{" "}
                <span>{counts.ongoing} Ongoing</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />{" "}
                <span>{counts.upcoming} Upcoming</span>
              </div>
            </div>

            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
              aria-label="Refresh dashboard"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex gap-2 overflow-x-auto">
              {(["today", "ongoing", "upcoming", "archived"] as const).map(
                (t) => {
                  const label =
                    t === "today"
                      ? `Today (${counts.today})`
                      : t === "ongoing"
                      ? `Ongoing (${counts.ongoing})`
                      : t === "upcoming"
                      ? `Upcoming (${counts.upcoming})`
                      : `Archived (${counts.archived})`;
                  const active = activeTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 text-sm rounded-full transition ${
                        active
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-white/5"
                      }`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </nav>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last updated:
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {lastUpdated ? dayjs(lastUpdated).fromNow() : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Loading state */}
            {loading && (
              <div className="py-12 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error.message || "Failed to load dashboard"}
              </div>
            )}

            {/* Tab panes */}
            {!loading && !error && (
              <>
                {tabList.length === 0 ? (
                  <EmptyState
                    title={`No ${activeTab} events`}
                    subtitle={`You have no events in the ${activeTab} section.`}
                  />
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {paginatedList.map((e) => (
                        <EventCard key={e.id} event={e} onOpen={openEvent} />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-md text-sm ${
                            currentPage === 1
                              ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-md text-sm ${
                            currentPage === totalPages
                              ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Right column: small insights / CTA */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-lg p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h4 className="text-sm font-semibold">Quick summary</h4>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Personal quick stats and shortcuts for your events.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                    <div className="text-xs text-gray-500">Today</div>
                    <div className="mt-1 font-medium text-lg">
                      {counts.today}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500">Ongoing</div>
                    <div className="mt-1 font-medium text-lg">
                      {counts.ongoing}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500">Upcoming</div>
                    <div className="mt-1 font-medium text-lg">
                      {counts.upcoming}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500">Archived</div>
                    <div className="mt-1 font-medium text-lg">
                      {counts.archived}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setActiveTab("ongoing")}
                    className="flex-1 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
                  >
                    View ongoing
                  </button>
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 text-sm"
                  >
                    View upcoming
                  </button>
                </div>
              </div>

              <div className="rounded-lg p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h4 className="text-sm font-semibold">Discover</h4>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Looking for similar events? Use the Discover page to find
                  events by tag or organizer.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => router.push("/events")}
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-sm"
                  >
                    Browse Events
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
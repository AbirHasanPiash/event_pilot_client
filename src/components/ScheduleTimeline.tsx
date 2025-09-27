"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import ScheduleModal from "@/components/ScheduleModal";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "react-hot-toast";
import useSWR, { mutate } from "swr";
import { Schedule, ScheduleInput } from "@/types/events";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ScheduleTimelineProps {
  canEdit: boolean;
}

export default function ScheduleTimeline({ canEdit: propCanEdit }: ScheduleTimelineProps) {
  const { id: eventId } = useParams();
  const safeApiFetch = useSafeApiFetch();

  // Modal state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const pathname = usePathname();

  // SWR fetcher
  const fetcher = async (url: string) => {
    const data = await safeApiFetch<{ results: Schedule[] }>(url);
    return (
      data?.results
        ?.sort(
          (a, b) =>
            new Date(a.start_datetime).getTime() -
            new Date(b.start_datetime).getTime()
        ) || []
    );
  };

  const { data: schedules = [], isLoading } = useSWR<Schedule[]>(
    eventId ? `/api/events/${eventId}/schedules/` : null,
    fetcher
  );

  // Check if current path is admin/organizer dashboard
  const isDashboard =
  pathname?.startsWith("/user/dashboard/admin") ||
  pathname?.startsWith("/user/dashboard/organizer");

  // Create or update handler with optimistic updates
  const handleSaveSchedule = async (updates: ScheduleInput[]) => {
    const update = updates[0];
    const cacheKey = `/api/events/${eventId}/schedules/`;

    try {
      if (editingSchedule) {
        // Optimistic update for edit
        mutate(
          cacheKey,
          (current: Schedule[] | undefined) => {
            if (!current) return current;
            return current.map((s) =>
              s.id === editingSchedule.id ? { ...s, ...update } : s
            );
          },
          false
        );

        // Update
        const result = await safeApiFetch(
          `/api/events/${eventId}/schedules/${editingSchedule.id}/`,
          {
            method: "PATCH",
            body: JSON.stringify(update),
            headers: { "Content-Type": "application/json" },
          }
        );
        if (result) {
          toast.success("Schedule updated successfully");
          setShowScheduleModal(false);
          setEditingSchedule(null);
          mutate(cacheKey); // Revalidate to confirm
        }
      } else {
        // Optimistic update for create (use temp ID and insert sorted)
        const tempId = Date.now();
        mutate(
          cacheKey,
          (current: Schedule[] | undefined) => {
            const newSchedule = {
              ...update,
              id: tempId,
              event: Number(eventId),
            };
            const updatedList = current ? [...current, newSchedule] : [newSchedule];
            return updatedList.sort(
              (a, b) =>
                new Date(a.start_datetime).getTime() -
                new Date(b.start_datetime).getTime()
            );
          },
          false
        );

        // Create new
        const result = await safeApiFetch(`/api/events/${eventId}/schedules/`, {
          method: "POST",
          body: JSON.stringify(update),
          headers: { "Content-Type": "application/json" },
        });
        if (result) {
          toast.success("Schedule created successfully");
          setShowScheduleModal(false);
          mutate(cacheKey); // Revalidate to get real ID and confirm
        }
      }
    } catch {
      toast.error("Something went wrong");
      mutate(cacheKey); // Rollback by revalidating
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    const cacheKey = `/api/events/${eventId}/schedules/`;

    // Optimistic remove
    mutate(
      cacheKey,
      (current: Schedule[] | undefined) => {
        if (!current) return current;
        return current.filter((s) => s.id !== scheduleToDelete.id);
      },
      false
    );

    try {
      const result = await safeApiFetch(
        `/api/events/${eventId}/schedules/${scheduleToDelete.id}/`,
        { method: "DELETE" }
      );
      if (result !== null) {
        toast.success("Schedule deleted successfully");
        mutate(cacheKey); // Revalidate to confirm
      }
    } catch {
      toast.error("Failed to delete schedule");
      mutate(cacheKey); // Rollback by revalidating
    } finally {
      setScheduleToDelete(null);
    }
  };

  function generatePath(cycles: number) {
    let d = "M 50 0";
    for (let i = 0; i < cycles; i++) {
      const y = (i + 1) * 100;
      if (i % 2 === 0) {
        d += ` Q 75 ${y - 50} 50 ${y}`;
      } else {
        d += ` Q 25 ${y - 50} 50 ${y}`;
      }
    }
    return d;
  }

  if (isLoading) return <LoadingSpinner />;

  if (!schedules.length)
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Event Schedule Timeline</h2>
        <p className="text-gray-500 dark:text-gray-400">
          No sub-schedules added yet.
        </p>
      </div>
    );

  return (
    <div className="relative py-12">
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">
          Event Schedule Timeline
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Stay on track with session timings and activities
        </p>
      </div>

      {/* Timeline container */}
      <div className="relative max-w-5xl mx-auto">
        {/* Responsive SVG path */}
        <svg
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1/2 md:w-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${schedules.length * 3 * 100}`}
        >
          <defs>
            <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="25%" stopColor="#EC4899" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="75%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <path
            d={generatePath(schedules.length * 3)}
            stroke="url(#flowLine)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            className="animate-dash"
          />
        </svg>

        {/* Items */}
        <div className="grid gap-16 relative">
          {schedules.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative flex justify-center"
            >
              <div
                className="relative w-full max-w-lg lg:max-w-2xl rounded-2xl
                shadow-md transition-all duration-500 ease-out
                soft-glow bg-white dark:bg-gray-900"
              >
                <div className="rounded-2xl p-6 border border-indigo-500">
                  <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                    {s.title}
                  </h3>

                  {s.agenda && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {s.agenda}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
                    <span className="flex items-center gap-1">
                      <Calendar
                        size={15}
                        className="text-indigo-500 dark:text-indigo-400"
                      />
                      {dayjs(s.start_datetime).format("MMM D")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock
                        size={15}
                        className="text-pink-500 dark:text-pink-400"
                      />
                      {dayjs(s.start_datetime).format("h:mm A")} →{" "}
                      {dayjs(s.end_datetime).format("h:mm A")}
                    </span>
                  </div>

                  {propCanEdit && isDashboard && (
                    <div className="mt-auto pt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSchedule(s);
                          setShowScheduleModal(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => setScheduleToDelete(s)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setEditingSchedule(null);
          }}
          onSubmit={handleSaveSchedule}
          mainStart={schedules[0].start_datetime}
          mainEnd={schedules[schedules.length - 1].end_datetime}
          initialSchedules={
            editingSchedule
              ? [
                  {
                    start_datetime: editingSchedule.start_datetime,
                    end_datetime: editingSchedule.end_datetime,
                    title: editingSchedule.title,
                    agenda: editingSchedule.agenda,
                  },
                ]
              : undefined
          }
        />
      )}

      {scheduleToDelete && (
        <ConfirmModal
          isOpen={!!scheduleToDelete}
          title="Delete Schedule?"
          description={`Are you sure you want to delete "${scheduleToDelete.title}"? This action cannot be undone.`}
          onCancel={() => setScheduleToDelete(null)}
          onConfirm={confirmDelete}
          confirmText="Delete"
        />
      )}
    </div>
  );
}

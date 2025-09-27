"use client";

import { useState, useEffect } from "react";
import { ScheduleInput } from "@/types/events";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (schedules: ScheduleInput[]) => Promise<void>;
  mainStart?: string | null;
  mainEnd?: string | null;
  initialSchedules?: ScheduleInput[];
}

// Convert UTC ISO string → local "YYYY-MM-DDTHH:mm" for datetime-local input
function toLocalDatetimeString(utcString: string | null) {
  if (!utcString) return "";
  const date = new Date(utcString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// Convert local datetime-local string → UTC ISO
function toUTC(localString: string): string {
  if (!localString) return "";
  return new Date(localString).toISOString();
}

type ScheduleWithErrors = ScheduleInput & {
  errors?: { start?: string; end?: string };
};

export default function ScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  mainStart,
  mainEnd,
  initialSchedules,
}: ScheduleModalProps) {
  const [schedules, setSchedules] = useState<ScheduleWithErrors[]>([
    { start_datetime: "", end_datetime: "", title: "", agenda: "" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      setSchedules(
        initialSchedules.map((s) => ({
          ...s,
          start_datetime: toLocalDatetimeString(s.start_datetime),
          end_datetime: toLocalDatetimeString(s.end_datetime),
        }))
      );
    } else {
      setSchedules([
        { start_datetime: "", end_datetime: "", title: "", agenda: "" },
      ]);
    }
  }, [initialSchedules, isOpen]);

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { start_datetime: "", end_datetime: "", title: "", agenda: "" },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    field: keyof ScheduleInput,
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    );
  };

  const validateSchedules = (): boolean => {
    let valid = true;

    const updated = schedules.map((s) => {
      const errors: { start?: string; end?: string } = {};

      const startUTC = toUTC(s.start_datetime);
      const endUTC = s.end_datetime ? toUTC(s.end_datetime) : "";

      const startDate = startUTC ? new Date(startUTC) : null;
      const endDate = endUTC ? new Date(endUTC) : null;

      const mainS = mainStart ? new Date(mainStart) : null;
      const mainE = mainEnd ? new Date(mainEnd) : null;

      if (!s.start_datetime) {
        errors.start = "Start time required";
        valid = false;
      } else if (mainS && mainE && (startDate! < mainS || startDate! > mainE)) {
        errors.start = "Must be within main event time";
        valid = false;
      }

      if (!s.end_datetime) {
        errors.end = "End time required";
        valid = false;
      } else if (endDate! <= startDate!) {
        errors.end = "End must be after start";
        valid = false;
      } else if (
        mainS &&
        mainE &&
        (endDate! > mainE || endDate! < mainS)
      ) {
        errors.end = "Must be within main event time";
        valid = false;
      }

      return { ...s, errors };
    });

    setSchedules(updated);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateSchedules()) return;
    setLoading(true);

    const utcSchedules: ScheduleInput[] = schedules.map((s) => ({
      title: s.title,
      agenda: s.agenda,
      start_datetime: toUTC(s.start_datetime),
      end_datetime: s.end_datetime ? toUTC(s.end_datetime) : null,
    }));

    await onSubmit(utcSchedules);

    setLoading(false);
    setSchedules([
      { start_datetime: "", end_datetime: "", title: "", agenda: "" },
    ]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl p-6 rounded-lg shadow-lg space-y-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold">Add Sub-Schedules</h2>

        <div className="space-y-6">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg dark:border-gray-700 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start */}
                <div>
                  <label className="block mb-1 font-medium">Start Time</label>
                  <input
                    type="datetime-local"
                    value={schedule.start_datetime}
                    onChange={(e) =>
                      handleChange(index, "start_datetime", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                  {schedule.errors?.start && (
                    <p className="text-xs text-red-500 mt-1">
                      {schedule.errors.start}
                    </p>
                  )}
                </div>

                {/* End */}
                <div>
                  <label className="block mb-1 font-medium">End Time</label>
                  <input
                    type="datetime-local"
                    value={schedule.end_datetime ?? ""}
                    onChange={(e) =>
                      handleChange(index, "end_datetime", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                  {schedule.errors?.end && (
                    <p className="text-xs text-red-500 mt-1">
                      {schedule.errors.end}
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  value={schedule.title}
                  onChange={(e) =>
                    handleChange(index, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  placeholder="Session Title"
                />
              </div>

              {/* Agenda */}
              <div>
                <label className="block mb-1 font-medium">Agenda</label>
                <textarea
                  value={schedule.agenda}
                  onChange={(e) =>
                    handleChange(index, "agenda", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  placeholder="Session agenda..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  disabled={schedules.length === 1}
                  className="text-red-500 text-sm hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={addSchedule}
            className="px-4 py-2 border border-indigo-500 text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-gray-800"
          >
            + Add Another
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

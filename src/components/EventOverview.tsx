"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import dayjs from "dayjs";
import { Users, Calendar, Activity, Award, Star } from "lucide-react";
import Link from "next/link";

interface OverviewResponse {
  stats: {
    total_events: number;
    upcoming_events: number;
    registered_users: number;
    total_attendees: number;
    active_organizers: number;
    avg_event_capacity: number;
    avg_attendance_rate: number;
  };
  popular_categories: { name: string; event_count: number }[];
  latest_events: {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    venue: string;
    capacity: number;
  }[];
  featured_organizers: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    event_count: number;
  }[];
}

export default function EventOverview() {
  const safeApiFetch = useSafeApiFetch();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch with sessionStorage cache
  useEffect(() => {
    const cached = sessionStorage.getItem("event_overview");
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    }

    const fetchData = async () => {
      try {
        const response = await safeApiFetch<OverviewResponse>("/api/overview/");
        if (response) {
          setData(response);
          sessionStorage.setItem("event_overview", JSON.stringify(response));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [safeApiFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No data available.</p>
      </div>
    );
  }

  const { stats, popular_categories, latest_events, featured_organizers } =
    data;

  return (
    <section className="relative bg-white dark:bg-black py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Our <span className="text-indigo-600">Impact</span> So Far
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            <span className="text-indigo-600 font-bold">Event</span>
            <span className="text-gray-900 font-bold dark:text-white">Pilot </span>
            powers memorable experiences with{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              thousands of events
            </span>
            ,{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              engaged attendees
            </span>
            , and{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              active organizers
            </span>{" "}
            worldwide. Here’s a glimpse of our growing impact.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14"
        >
          {[
            {
              label: "Total Events Hosted",
              value: stats.total_events,
              icon: Calendar,
              color: "text-indigo-500",
            },
            {
              label: "Happy Attendees",
              value: stats.total_attendees,
              icon: Users,
              color: "text-green-500",
            },
            {
              label: "Verified Organizers",
              value: stats.active_organizers,
              icon: Award,
              color: "text-purple-500",
            },
            {
              label: "Average Attendance Rate",
              value: `${(stats.avg_attendance_rate * 100).toFixed(0)}%`,
              icon: Activity,
              color: "text-pink-500",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:shadow-lg transition"
            >
              <item.icon className={`w-8 h-8 ${item.color}`} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Popular Categories */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Popular Event Categories
            </h3>
            <ul className="space-y-3 flex-1">
              {popular_categories.map((cat) => (
                <li
                  key={cat.name}
                  className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>{cat.name}</span>
                  <span className="font-medium">{cat.event_count}</span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <div className="mt-6 flex justify-center">
              <Link
                href="/events"
                className="px-6 py-3 w-full sm:w-auto text-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                Find your favorite one
              </Link>
            </div>
          </div>

          {/* Latest Events */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Latest Events on EventPilot
            </h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {latest_events.map((event) => (
                <li
                  key={event.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex gap-2 mt-1">
                      <Calendar size={14} />
                      {dayjs(event.start_time).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <span className="mt-2 sm:mt-0 text-sm text-indigo-600 dark:text-indigo-400">
                    Capacity: {event.capacity.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Featured Organizers */}
        <div className="mt-14 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
            Featured Organizers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured_organizers.map((org) => (
              <div
                key={org.id}
                className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {org.first_name} {org.last_name}
                  </p>
                  <Star className="text-yellow-500 w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {org.email}
                </p>
                <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
                  {org.event_count}{" "}
                  {org.event_count === 1
                    ? "Event Organized"
                    : "Events Organized"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

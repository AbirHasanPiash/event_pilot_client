"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import useSWR from "swr";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  TrendingUp,
  Users,
  CalendarDays,
  UserCheck,
  ListOrdered,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Day.js setup ---
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// --- Types that match your backend response ---
interface RoleBreakdown {
  role: string;
  count: number;
}
interface StatusBreakdown {
  status: string;
  count: number;
}
interface CategoryBreakdown {
  name: string;
  count: number;
}

interface MonthDatum {
  month: string;
  year: number;
  count: number;
}
interface YearDatum {
  year: number;
  count: number;
}

interface TopEvent {
  id: number;
  title: string;
  attendee_count: number;
}
interface TopOrganizerByEvents {
  id: number;
  first_name: string;
  last_name: string;
  events_count: number;
}
interface TopOrganizerByAttendees {
  id: number;
  first_name: string;
  last_name: string;
  attendee_count: number;
}

interface AdminDashboardResponse {
  totals: { users: number; events: number; attendees: number };
  breakdowns: {
    users_by_role: RoleBreakdown[];
    events_by_status: StatusBreakdown[];
    events_by_category: CategoryBreakdown[];
  };
  trends: {
    monthly: {
      users: MonthDatum[];
      events: MonthDatum[];
      attendees: MonthDatum[];
    };
    yearly: {
      users: YearDatum[];
      events: YearDatum[];
      attendees: YearDatum[];
    };
  };
  rankings: {
    top_events_by_attendance: TopEvent[];
    top_organizers_by_events: TopOrganizerByEvents[];
    top_organizers_by_attendees: TopOrganizerByAttendees[];
  };
  organizer_performance: Array<{
    id: number;
    first_name: string;
    last_name: string;
    events_count: number;
    attendees_count: number;
  }>;
  system_health: {
    draft_events: number;
    cancelled_events: number;
    waitlist_enabled: number;
    full_events: number;
  };
}

// --- Config ---
const POLL_MS = 2 * 60 * 1000; // background refresh every 2 minutes

// color palette (works in light & dark)
const SERIES_COLORS = {
  users: "#4F46E5", // indigo-600
  events: "#10B981", // emerald-500
  attendees: "#F59E0B", // amber-500
};

const AXIS_COLOR_LIGHT = "#374151"; // gray-700
const AXIS_COLOR_DARK = "#E5E7EB"; // gray-200
const GRID_COLOR_LIGHT = "#E5E7EB"; // gray-200
const GRID_COLOR_DARK = "#374151"; // gray-700

// Helpers
const monthNameToIndex: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

function getIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

// Build last 12 months time-series combining users/events/attendees
function buildLast12MonthsSeries(trends: AdminDashboardResponse["trends"]) {
  const now = dayjs();
  const labels: string[] = [];
  const points: Array<{
    label: string;
    key: string;
    users: number;
    events: number;
    attendees: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = now.subtract(i, "month");
    const label = d.format("MMM YY");
    const key = `${d.year()}-${d.month()}`; // year-monthIndex
    labels.push(label);
    points.push({ label, key, users: 0, events: 0, attendees: 0 });
  }

  const map = Object.fromEntries(points.map((p) => [p.key, p]));

  (trends.monthly.users || []).forEach((m) => {
    const idx = monthNameToIndex[m.month];
    if (idx === undefined) return;
    const key = `${m.year}-${idx}`;
    if (map[key]) map[key].users = m.count;
  });
  (trends.monthly.events || []).forEach((m) => {
    const idx = monthNameToIndex[m.month];
    if (idx === undefined) return;
    const key = `${m.year}-${idx}`;
    if (map[key]) map[key].events = m.count;
  });
  (trends.monthly.attendees || []).forEach((m) => {
    const idx = monthNameToIndex[m.month];
    if (idx === undefined) return;
    const key = `${m.year}-${idx}`;
    if (map[key]) map[key].attendees = m.count;
  });

  // return in the same order as labels
  return points;
}

// Build last 5 full years series
function buildLast5YearsSeries(trends: AdminDashboardResponse["trends"]) {
  const thisYear = dayjs().year();
  const years = Array.from({ length: 5 }, (_, i) => thisYear - 4 + i);
  const base = years.map((y) => ({
    label: String(y),
    year: y,
    users: 0,
    events: 0,
    attendees: 0,
  }));
  const byYear = Object.fromEntries(base.map((b) => [b.year, b]));

  (trends.yearly.users || []).forEach((y) => {
    if (byYear[y.year]) byYear[y.year].users = y.count;
  });
  (trends.yearly.events || []).forEach((y) => {
    if (byYear[y.year]) byYear[y.year].events = y.count;
  });
  (trends.yearly.attendees || []).forEach((y) => {
    if (byYear[y.year]) byYear[y.year].attendees = y.count;
  });

  return base;
}

// Compact number formatting
const nf = new Intl.NumberFormat(undefined, { notation: "compact" });

// Tooltip formatter for Recharts
function tooltipFormatter(value: string | number) {
  if (typeof value === "number") return nf.format(value);
  return String(value);
}

// --- Component ---
export default function AdminDashboardPage() {
  const safeApiFetch = useSafeApiFetch();

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [metric, setMetric] = useState<"events" | "users" | "attendees">(
    "events"
  );
  const [timeframe, setTimeframe] = useState<"12m" | "5y">("12m");
  const [isDark, setIsDark] = useState(getIsDark());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // observe theme changes in case your app toggles the `dark` class
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(getIsDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const fetcher = useCallback(
    async (url: string): Promise<AdminDashboardResponse> => {
      const res = await safeApiFetch<AdminDashboardResponse | null>(url);
      if (!res) throw new Error("Failed to fetch Admin Dashboard data");
      return res;
    },
    [safeApiFetch]
  );

  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR<AdminDashboardResponse>("/api/dashboard/admin", fetcher, {
    refreshInterval: POLL_MS,
    onSuccess: () => setLastUpdated(Date.now()),
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load dashboard");
    }
  }, [error]);

  // derived chart data
  const last12m = useMemo(
    () => (data ? buildLast12MonthsSeries(data.trends) : []),
    [data]
  );
  const last5y = useMemo(
    () => (data ? buildLast5YearsSeries(data.trends) : []),
    [data]
  );
  const chartData = useMemo(() => {
    if (timeframe === "12m") {
      if (windowWidth < 768) {
        return last12m.slice(-3); // Last 3 months
      } else if (windowWidth >= 768 && windowWidth < 1024) {
        return last12m.slice(-6); // Last 6 months
      } else {
        return last12m; // Full 12 months
      }
    }
    if (timeframe === "5y") {
      if (windowWidth < 768) {
        return last5y.slice(-3); // Last 3 years
      } else {
        return last5y; // Full 5 years
      }
    }
    return [];
  }, [last12m, last5y, timeframe, windowWidth]);

  const axisColor = isDark ? AXIS_COLOR_DARK : AXIS_COLOR_LIGHT;
  const gridColor = isDark ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;

  const metricLabel = metric[0].toUpperCase() + metric.slice(1);

  // Update the windowWidth state when the window is resized
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRefresh = async () => {
    try {
      await mutate();
      toast.success("Dashboard refreshed");
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of users, events, attendees & system health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {dayjs(lastUpdated).fromNow()}
            </span>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Users"
          value={data?.totals.users ?? 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Events"
          value={data?.totals.events ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title="Attendees"
          value={data?.totals.attendees ?? 0}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Full Events"
          value={data?.system_health.full_events ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Trends */}
      <Card className="">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ListOrdered className="h-5 w-5" /> Trends
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="isolate inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setTimeframe("12m")}
                className={`px-3 py-1.5 text-sm rounded-l-lg ${
                  timeframe === "12m"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {windowWidth < 768
                  ? "Last 3 months"
                  : windowWidth >= 768 && windowWidth < 1024
                  ? "Last 6 months"
                  : "Last 12 months"}
              </button>
              <button
                onClick={() => setTimeframe("5y")}
                className={`px-3 py-1.5 text-sm rounded-r-lg ${
                  timeframe === "5y"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {windowWidth < 768 ? "Last 3 years" : "Last 5 years"}
              </button>
            </div>

            <div className="isolate inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setMetric("events")}
                className={`px-3 py-1.5 text-sm ${
                  metric === "events"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setMetric("users")}
                className={`px-3 py-1.5 text-sm ${
                  metric === "users"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setMetric("attendees")}
                className={`px-3 py-1.5 text-sm rounded-r-lg ${
                  metric === "attendees"
                    ? "bg-amber-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                Attendees
              </button>
            </div>

            <div className="isolate inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setChartMode("bar")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 rounded-l-lg ${
                  chartMode === "bar"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <BarChartIcon className="h-4 w-4" /> Bar
              </button>
              <button
                onClick={() => setChartMode("line")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 rounded-r-lg ${
                  chartMode === "line"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <LineChartIcon className="h-4 w-4" /> Line
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[340px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    interval={chartData.length > 12 ? 0 : 0}
                    angle={-45}
                    height={50}
                    tick={{ fill: axisColor, dy: 15 }}
                  />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Bar
                    dataKey={metric}
                    name={metricLabel}
                    fill={SERIES_COLORS[metric]}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    height={40}
                    tick={{ fill: axisColor }}
                  />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    name={metricLabel}
                    stroke={SERIES_COLORS[metric]}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Breakdown & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <Donut
                data={(data?.breakdowns.users_by_role ?? []).map((d) => ({
                  name: d.role,
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <Donut
                data={(data?.breakdowns.events_by_status ?? []).map((d) => ({
                  name: d.status,
                  value: d.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Draft events
                  </span>
                  <span className="font-medium">
                    {data?.system_health.draft_events ?? 0}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Cancelled events
                  </span>
                  <span className="font-medium">
                    {data?.system_health.cancelled_events ?? 0}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Waitlist enabled
                  </span>
                  <span className="font-medium">
                    {data?.system_health.waitlist_enabled ?? 0}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Full events
                  </span>
                  <span className="font-medium">
                    {data?.system_health.full_events ?? 0}
                  </span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top Events by Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ol className="space-y-2">
                {(data?.rankings.top_events_by_attendance ?? []).map((e, i) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-6">#{i + 1}</span>
                      <span className="font-medium line-clamp-1">
                        {e.title}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs">
                      {e.attendee_count} attending
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Organizers</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="py-8 flex justify-center col-span-2">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-2">By Events</h4>
                  <ul className="space-y-2">
                    {(data?.rankings.top_organizers_by_events ?? []).map(
                      (o) => (
                        <li
                          key={o.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="line-clamp-1">
                            {o.first_name} {o.last_name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {o.events_count}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">By Attendees</h4>
                  <ul className="space-y-2">
                    {(data?.rankings.top_organizers_by_attendees ?? []).map(
                      (o) => (
                        <li
                          key={o.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="line-clamp-1">
                            {o.first_name} {o.last_name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {o.attendee_count}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium">Category</th>
                    <th className="py-2 pr-4 font-medium">Events</th>
                    <th className="py-2 font-medium">Visualization</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdowns.events_by_category ?? []).map((c) => (
                    <tr
                      key={c.name}
                      className="border-t border-gray-100 dark:border-white/10"
                    >
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4">{c.count}</td>
                      <td className="py-2">
                        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${percentOf(
                                c.count,
                                data?.totals.events ?? 1
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function percentOf(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="text-3xl font-bold">
          {new Intl.NumberFormat().format(value)}
        </div>
        <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const colors = [
    "#4F46E5",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
  ]; // variety
  const isDark = getIsDark();
  const labelColor = isDark ? AXIS_COLOR_DARK : AXIS_COLOR_LIGHT;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip formatter={tooltipFormatter} />
        <Legend />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {/* center label */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-current"
          style={{ fill: labelColor }}
        >
          {total}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

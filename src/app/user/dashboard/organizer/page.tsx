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
} from "recharts";

// --- Day.js setup ---
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// --- Types that match your backend response ---
interface MonthlyStat {
  month: string;
  year: number;
  events: number;
  attendees: number;
}
interface YearlyStat {
  year: number;
  events: number;
  attendees: number;
}
interface OrganizerDashboardData {
  total_events: number;
  total_attendees: number;
  monthly_stats: MonthlyStat[];
  yearly_stats: YearlyStat[];
}

// --- Config ---
const POLL_MS = 2 * 60 * 1000; // background refresh every 2 minutes

// color palette (works in light & dark, matching AdminDashboard)
const SERIES_COLORS = {
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

// Build last 12 months time-series for events and attendees
function buildLast12MonthsSeries(
  stats: OrganizerDashboardData["monthly_stats"]
) {
  const now = dayjs();
  const labels: string[] = [];
  const points: Array<{
    label: string;
    key: string;
    events: number;
    attendees: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = now.subtract(i, "month");
    const label = d.format("MMM YY");
    const key = `${d.year()}-${d.month()}`; // year-monthIndex
    labels.push(label);
    points.push({ label, key, events: 0, attendees: 0 });
  }

  const map = Object.fromEntries(points.map((p) => [p.key, p]));

  (stats || []).forEach((m) => {
    const idx = monthNameToIndex[m.month];
    if (idx === undefined) return;
    const key = `${m.year}-${idx}`;
    if (map[key]) {
      map[key].events = m.events;
      map[key].attendees = m.attendees;
    }
  });

  return points;
}

// Build last 5 full years series
function buildLast5YearsSeries(stats: OrganizerDashboardData["yearly_stats"]) {
  const thisYear = dayjs().year();
  const years = Array.from({ length: 5 }, (_, i) => thisYear - 4 + i);
  const base = years.map((y) => ({
    label: String(y),
    year: y,
    events: 0,
    attendees: 0,
  }));
  const byYear = Object.fromEntries(base.map((b) => [b.year, b]));

  (stats || []).forEach((y) => {
    if (byYear[y.year]) {
      byYear[y.year].events = y.events;
      byYear[y.year].attendees = y.attendees;
    }
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
export default function OrganizerDashboardPage() {
  const safeApiFetch = useSafeApiFetch();

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [metric, setMetric] = useState<"events" | "attendees">("events");
  const [timeframe, setTimeframe] = useState<"12m" | "5y">("12m");
  const [isDark, setIsDark] = useState(getIsDark());
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // observe theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(getIsDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // observe window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetcher = useCallback(
    async (url: string): Promise<OrganizerDashboardData> => {
      const res = await safeApiFetch<OrganizerDashboardData | null>(url);
      if (!res) throw new Error("Failed to load organizer dashboard");
      return res;
    },
    [safeApiFetch]
  );

  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR<OrganizerDashboardData>("/api/dashboard/organizer", fetcher, {
    refreshInterval: POLL_MS,
    onSuccess: () => setLastUpdated(Date.now()),
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load dashboard");
    }
  }, [error]);

  // derived chart data with responsive data limiting
  const last12m = useMemo(
    () => (data ? buildLast12MonthsSeries(data.monthly_stats) : []),
    [data]
  );
  const last5y = useMemo(
    () => (data ? buildLast5YearsSeries(data.yearly_stats) : []),
    [data]
  );
  const chartData = useMemo(() => {
    if (timeframe === "12m") {
      if (windowWidth < 640) {
        return last12m.slice(-3); // Last 3 months for small screens
      } else if (windowWidth < 1024) {
        return last12m.slice(-6); // Last 6 months for medium screens
      }
      return last12m; // Full 12 months
    }
    if (timeframe === "5y") {
      if (windowWidth < 640) {
        return last5y.slice(-3); // Last 3 years for small screens
      }
      return last5y; // Full 5 years
    }
    return [];
  }, [last12m, last5y, timeframe, windowWidth]);

  const axisColor = isDark ? AXIS_COLOR_DARK : AXIS_COLOR_LIGHT;
  const gridColor = isDark ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;

  const metricLabel = metric[0].toUpperCase() + metric.slice(1);

  const handleRefresh = async () => {
    try {
      await mutate();
      toast.success("Dashboard refreshed");
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Organizer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
            Overview of your events and attendees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2 text-xs sm:text-sm"
          >
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        <StatCard
          title="Events"
          value={data?.total_events ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title="Attendees"
          value={data?.total_attendees ?? 0}
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Trends */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <ListOrdered className="h-5 w-5" /> Trends
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="isolate inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setTimeframe("12m")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-l-lg ${
                  timeframe === "12m"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {windowWidth < 640
                  ? "Last 3 months"
                  : windowWidth < 1024
                  ? "Last 6 months"
                  : "Last 12 months"}
              </button>
              <button
                onClick={() => setTimeframe("5y")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-r-lg hidden sm:block ${
                  timeframe === "5y"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {windowWidth < 640 ? "Last 3 years" : "Last 5 years"}
              </button>
            </div>

            <div className="isolate inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
              <button
                onClick={() => setMetric("events")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${
                  metric === "events"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setMetric("attendees")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-r-lg ${
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
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1 rounded-l-lg ${
                  chartMode === "bar"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <BarChartIcon className="h-4 w-4" /> Bar
              </button>
              <button
                onClick={() => setChartMode("line")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1 rounded-r-lg ${
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
        <CardContent className="h-[300px] sm:h-[340px]">
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
    </div>
  );
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
    <Card className="overflow-hidden flex-1 min-w-[150px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold">
          {new Intl.NumberFormat().format(value)}
        </div>
        <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

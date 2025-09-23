"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { RefreshCcw, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useSafeApiFetch } from "@/lib/apiWrapper";

// Components (replace shadcn/ui if not installed)
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl shadow-md p-4 bg-white dark:bg-gray-900">{children}</div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="pb-2 border-b border-gray-200 dark:border-gray-700 mb-2">{children}</div>
);
const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);
const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2">{children}</div>
);

const Button = ({
  children,
  onClick,
  variant = "default",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  size?: "sm" | "md";
}) => {
  const base =
    "rounded-2xl transition font-medium flex items-center gap-2 justify-center";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
  };
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  );
};

dayjs.extend(relativeTime);

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

export default function OrganizerDashboardPage() {
  const apiFetch = useSafeApiFetch();
  const [data, setData] = useState<OrganizerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [timeframe, setTimeframe] = useState<"monthly" | "yearly">("monthly");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dashboard/organizer");
      setData(res);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const chartData =
    timeframe === "monthly" ? data?.monthly_stats || [] : data?.yearly_stats || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setChartType(chartType === "bar" ? "line" : "bar")} variant="outline" size="sm">
            {chartType === "bar" ? <BarChart2 size={16} /> : <LineChartIcon size={16} />} Chart
          </Button>
          <Button onClick={() => setTimeframe(timeframe === "monthly" ? "yearly" : "monthly")} variant="outline" size="sm">
            {timeframe === "monthly" ? "Last 12 Months" : "Last 5 Years"}
          </Button>
          <Button onClick={fetchData} size="sm">
            <RefreshCcw size={16} /> Refresh
          </Button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {data && !loading && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-600">{data.total_events}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Attendees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{data.total_attendees}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {timeframe === "monthly" ? "Events & Attendees (Last 12 Months)" : "Events & Attendees (Last 5 Years)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={timeframe === "monthly" ? "month" : "year"} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="events" fill="#4F46E5" name="Events" />
                      <Bar dataKey="attendees" fill="#10B981" name="Attendees" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={timeframe === "monthly" ? "month" : "year"} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="events" stroke="#4F46E5" name="Events" />
                      <Line type="monotone" dataKey="attendees" stroke="#10B981" name="Attendees" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated {dayjs(lastUpdated).fromNow()}
            </p>
          )}
        </>
      )}
    </div>
  );
}

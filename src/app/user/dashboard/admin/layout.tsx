"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  Folder,
  FileCheck2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSafeApiFetch } from "@/lib/apiWrapper";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [organizerCount, setOrganizerCount] = useState<number>(0);
  const safeApiFetch = useSafeApiFetch();

  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited =
        sessionStorage.getItem("visitedOrganizerRequests") === "true";
      setShowBadge(!visited);
    }
  }, []);

  interface OrganizerRequest {
    id: number;
    user: number;
    first_name: string;
    last_name: string;
    user_email: string;
    profile_image?: string | null;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    reviewed_at?: string | null;
    reason?: string;
  }

  interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  }

  const navItems = [
    { name: "Dashboard", href: "/user/dashboard/admin", icon: LayoutDashboard },
    { name: "Users", href: "/user/dashboard/admin/users", icon: Users },
    { name: "Events", href: "/user/dashboard/admin/events", icon: Calendar },
    {
      name: "Categories",
      href: "/user/dashboard/admin/categories",
      icon: Folder,
    },
    {
      name: "Organizer Requests",
      href: "/user/dashboard/admin/organizer-requests",
      icon: FileCheck2,
    },
  ];

  // Mark as hydrated after first client render
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    async function fetchCount() {
      try {
        const data = await safeApiFetch<PaginatedResponse<OrganizerRequest>>(
          "/api/dashboard/request-organizer/list/?status=pending&page=1"
        );
        if (data) setOrganizerCount(data.count || 0);
      } catch (err) {
        console.error("Failed to load organizer request count:", err);
      }
    }

    fetchCount();
  }, [safeApiFetch]);

  // Close sidebar when clicking outside (mobile only)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  // Access control
  useEffect(() => {
    const hasToken = localStorage.getItem("access");
    if (
      hydrated &&
      !isLoading &&
      (!user || user.role !== "admin") &&
      hasToken
    ) {
      router.replace("/unauthorized");
    }
  }, [hydrated, user, isLoading, router]);

  // Show spinner while loading or before hydration
  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <LoadingSpinner size={60} color="border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="flex container mx-auto px-4 h-screen pt-16">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`z-40 fixed inset-y-0 pt-16 left-0 w-56 bg-white dark:bg-black border-r border-indigo-500 transform transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-end px-4 py-3 md:hidden">
            <button onClick={() => setSidebarOpen(false)}>
              <X className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                onClick={() => {
                  if (name === "Organizer Requests") {
                    sessionStorage.setItem("visitedOrganizerRequests", "true");
                    setShowBadge(false); // hide badge immediately
                  }
                }}
                className={`flex items-center justify-between px-4 py-2 rounded-md font-medium transition-colors ${
                  pathname === href
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="shrink-0" /> {name}
                </div>
                {name === "Organizer Requests" &&
                  organizerCount > 0 &&
                  showBadge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                      {organizerCount}
                    </span>
                  )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar (Mobile toggle) */}
          <header className="flex items-center justify-between px-4 py-3 dark:bg-black md:hidden">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="text-gray-600 dark:text-gray-300" />
            </button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-black">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

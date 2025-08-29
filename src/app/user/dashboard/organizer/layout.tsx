"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LayoutDashboard, Calendar, Folder } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { name: "Dashboard", href: "/user/dashboard/organizer", icon: LayoutDashboard },
    { name: "Events", href: "/user/dashboard/organizer/events", icon: Calendar },
    { name: "Categories", href: "/user/dashboard/organizer/categories", icon: Folder },
  ];

  // Mark as hydrated after first client render
  useEffect(() => {
    setHydrated(true);
  }, []);

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

  // Show spinner before hydration
  if (!hydrated) {
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
                className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors ${
                  pathname === href
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <Icon size={18} className="shrink-0" /> {name}
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

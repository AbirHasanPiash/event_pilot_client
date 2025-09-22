"use client";

import Link from "next/link";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Menu, X, User, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function ThemeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);
  // Close on outside click or Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={!mounted}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center border-0 bg-transparent shadow-none
                   focus:outline-none hover:text-yellow-500 hover:scale-105 dark:hover:text-yellow-500 dark:hover:scale-105 dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
        <Sun
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1.2rem] w-[1.2rem] transition-all duration-200
                     scale-100 rotate-0 dark:scale-0 dark:-rotate-90"
        />
        <Moon
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1.2rem] w-[1.2rem] transition-all duration-200
                     scale-0 rotate-90 dark:scale-100 dark:rotate-0"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
                 shadow-lg rounded-xl py-2 text-sm z-50"
            role="menu"
          >
            <button
              onClick={() => {
                setTheme("light");
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-600
                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
              role="menuitem"
            >
              Light
            </button>

            <button
              onClick={() => {
                setTheme("dark");
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-600
                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
              role="menuitem"
            >
              Dark
            </button>

            <button
              onClick={() => {
                setTheme("system");
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-600
                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
              role="menuitem"
            >
              System
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const toggleDropdown = () => setDropdownOpen((p) => !p);

  const handleDashboardRedirect = () => {
    if (!user) return;
    if (user.role === "admin") router.push("/user/dashboard/admin");
    else if (user.role === "organizer")
      router.push("/user/dashboard/organizer");
    else router.push("/user/dashboard/attendee");
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-indigo-500/50 dark:border-indigo-400/40
                 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center text-xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          >
            <span className="text-indigo-600">Event</span>
            <span className="text-gray-900 dark:text-white">Pilot</span>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-700 dark:text-gray-300">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-indigo-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {!user ? (
              <div className="hidden md:flex gap-3 text-sm">
                <Link
                  href="/auth/login"
                  className="px-4 py-1 font-medium dark:text-white hover:text-indigo-600 dark:hover:text-indigo-600 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1 font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="User menu"
                >
                  <User size={20} />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
                                 shadow-lg rounded-xl py-2 text-sm z-50"
                    >
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-600
                                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
                      >
                        Profile
                      </Link>

                      <button
                        onClick={() => {
                          handleDashboardRedirect();
                          setDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-600
                                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
                      >
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-500 hover:text-red-600
                                   focus:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-800"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center text-gray-700 dark:text-gray-300
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-white dark:bg-neutral-900 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {user?.role === "organizer" && (
                <Link
                  href="/create"
                  className="block text-center px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  onClick={() => setIsOpen(false)}
                >
                  Create Event
                </Link>
              )}

              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/user/profile"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => {
                      handleDashboardRedirect();
                      setIsOpen(false);
                    }}
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-indigo-600
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                  >
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700 text-left
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1 py-0.5"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

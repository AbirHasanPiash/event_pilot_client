"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const router = useRouter();

  const handleDashboardRedirect = () => {
    if (!user) return;

    if (user.role === "admin") router.push("/user/dashboard/admin");
    else if (user.role === "organizer") router.push("/user/dashboard/organizer");
    else router.push("/user/dashboard/attendee");
  };

  // Close dropdown when clicking outside
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
    <header className="w-full border-b border-indigo-500
    fixed top-0 left-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center text-xl font-bold">
            <span className="text-indigo-600">Event</span>
            <span className="text-gray-900 dark:text-white">Pilot</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-700 dark:text-gray-300">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-indigo-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Auth Buttons */}
            {!user ? (
              <div className="hidden md:flex gap-3 text-sm">
                <Link
                  href="/auth/login"
                  className="px-4 py-1 font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1 font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
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
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg py-2 text-sm z-50"
                    >
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600"
                      >
                        Profile
                      </Link>

                      <button
                        onClick={handleDashboardRedirect}
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600"
                      >
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-400 hover:text-red-700"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden inline-flex items-center justify-center text-gray-700 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-black px-6 py-4 border-t border-gray-200 dark:border-white/10"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {user?.role === "organizer" && (
                <Link
                  href="/create"
                  className="block text-center px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  onClick={() => setIsOpen(false)}
                >
                  Create Event
                </Link>
              )}

              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  {user.role === "organizer" && (
                    <Link
                      href="/dashboard"
                      className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700"
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

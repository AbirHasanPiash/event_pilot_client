"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="max-w-md w-full bg-gray-50 dark:bg-zinc-900 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-700 dark:text-red-500 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          You do not have permission to view this page.  
          Please contact an administrator if you think this is a mistake.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          <Home size={18} />
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

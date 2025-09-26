"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Hero() {
  const { user } = useAuth();
  const router = useRouter();

  const handleOrganizerClick = () => {
    if (!user) {
      router.push("/auth/register");
      return;
    }

    if (user.role === "admin") {
      router.push("/user/dashboard/admin/events");
    }else if (user.role === "organizer") {
      router.push("/user/dashboard/organizer/events");
    } else if (user.role === "attendee") {
      router.push("/user/request-organizer");
    } else {
      toast.error("Only registered users can apply as an organizer.");
    }
  };

  return (
    <section className="relative isolate overflow-hidden bg-white dark:bg-black pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div className="w-[36rem] aspect-[1155/678] bg-gradient-to-tr from-indigo-300/30 via-purple-400/30 to-pink-300/30 dark:from-indigo-500/20 dark:via-purple-600/20 dark:to-pink-500/20 rounded-full opacity-50" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Organize Events <br className="hidden sm:inline" />
              <span className="text-indigo-600"> Effortlessly</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto md:mx-0">
              From planning to ticketing to feedback,{" "}
              <span className="font-semibold text-indigo-600">Event</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Pilot
              </span>{" "}
              is your complete event management platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handleOrganizerClick}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm sm:text-base font-semibold shadow-md hover:bg-indigo-700 transition-colors"
              >
                Create an Event
              </button>
              <Link
                href="/events"
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/20 text-sm sm:text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[30rem]"
          >
            <Image
              src="/event_img.jpeg"
              alt="Event illustration"
              width={800}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-2xl object-cover shadow-lg"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

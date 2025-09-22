"use client";

import { motion } from "framer-motion";
import { CalendarDays, ShieldCheck, ThumbsUp, Users } from "lucide-react";

const features = [
  {
    title: "Effortless Scheduling",
    icon: CalendarDays,
    description:
      "Create and manage events with intuitive scheduling tools and real-time updates.",
  },
  {
    title: "Robust Security",
    icon: ShieldCheck,
    description:
      "Your event data is protected with enterprise-grade security and encryption.",
  },
  {
    title: "User-Friendly Interface",
    icon: ThumbsUp,
    description:
      "Simple, clean, and responsive design for both organizers and attendees.",
  },
  {
    title: "Collaborative Management",
    icon: Users,
    description:
      "Invite your team, delegate tasks, and manage responsibilities effortlessly.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function WhyChooseUs() {
  return (
    <section className="relative py-28 bg-white dark:bg-black">
      <div className="max-w-7xl relative mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={container}
          className="text-center mb-20"
        >
          <motion.h2
            variants={item}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
          >
            Why Choose{" "}
            <span className="text-indigo-600">Event</span>
            <span className="text-gray-900 dark:text-white">Pilot</span>
          </motion.h2>
          <motion.p
            variants={item}
            className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400"
          >
            We’re more than just an event tool. We’re your complete solution for
            successful and stress-free event management.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={item}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="relative group bg-white dark:bg-gray-900 backdrop-blur-xl p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800"
              >
                {/* Icon wrapper */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

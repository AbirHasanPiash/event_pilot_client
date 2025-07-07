"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ShieldCheck,
  ThumbsUp,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Effortless Scheduling",
    icon: <CalendarDays className="w-6 h-6 text-indigo-600" />,
    description: "Create and manage events with intuitive scheduling tools and real-time updates.",
  },
  {
    title: "Robust Security",
    icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
    description: "Your event data is protected with enterprise-grade security and encryption.",
  },
  {
    title: "User-Friendly Interface",
    icon: <ThumbsUp className="w-6 h-6 text-indigo-600" />,
    description: "Simple, clean, and responsive design for both organizers and attendees.",
  },
  {
    title: "Collaborative Management",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    description: "Invite your team, delegate tasks, and manage responsibilities effortlessly.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={container}
          className="text-center mb-16"
        >
          <motion.h2
            variants={item}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Why Choose <span className="text-indigo-600">EventPilot</span>
          </motion.h2>
          <motion.p
            variants={item}
            className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-400"
          >
            We’re more than just an event tool. We’re your complete solution for successful and stress-free event management.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

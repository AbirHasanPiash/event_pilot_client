"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Users, CalendarDays, Sparkles, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const values = [
  {
    title: "Effortless Scheduling",
    desc: "Plan, update, and manage events with just a few clicks.",
    icon: CalendarDays,
  },
  {
    title: "Engaged Community",
    desc: "Connect organizers, speakers, and attendees in real time.",
    icon: Users,
  },
  {
    title: "Modern Experience",
    desc: "A sleek, intuitive interface that works beautifully across devices.",
    icon: Sparkles,
  },
  {
    title: "Secure & Reliable",
    desc: "Your data is safe with enterprise-grade protection.",
    icon: ShieldCheck,
  },
];

export default function AboutPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/events");
    } else {
      router.push("/auth/register");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-30 space-y-24">
        {/* Hero */}
        <section className="text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            About <span className="text-indigo-600">Event</span>
            <span className="text-gray-900 dark:text-white">Pilot</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300"
          >
            EventPilot is your smart companion for effortless event management.
            From creating events to engaging attendees, we help organizers and
            participants connect seamlessly in one powerful platform.
          </motion.p>
        </section>

        {/* Mission / Values - Timeline style */}
        <section className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
          <div className="space-y-12">
            {values.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-16"
              >
                <div className="absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-2xl sm:text-3xl font-bold">Our Story</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              EventPilot was born from a simple idea: make event organization
              stress-free and enjoyable. We realized that both organizers and
              attendees struggled with fragmented tools, and decided to create a
              single, unified platform that puts people first.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Today, EventPilot powers events of all sizes — from small meetups
              to large-scale conferences — helping people connect, share, and
              grow.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 relative">
              <Image
                src="/about-event.jpeg"
                alt="People enjoying an event"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="relative text-center py-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 relative z-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to elevate your events?
            </h2>
            <p className="max-w-2xl mx-auto text-lg opacity-90">
              Join EventPilot today and take the first step toward smarter, more
              impactful event management.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold shadow hover:bg-gray-100 transition inline-block"
            >
              Get Started
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Get in <span className="text-indigo-600">Touch</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
            Have questions, feedback, or collaboration ideas? We’d love to hear
            from you.
          </p>
        </motion.div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white/70 dark:bg-gray-900/70 backdrop-blur-md"
          >
            <form className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  placeholder=" "
                  className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <label
                  htmlFor="name"
                  className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-indigo-500"
                >
                  Your Name
                </label>
              </div>

              <div className="relative">
                <input
                  type="email"
                  id="email"
                  placeholder=" "
                  className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-indigo-500"
                >
                  Email Address
                </label>
              </div>

              <div className="relative">
                <textarea
                  id="message"
                  placeholder=" "
                  rows={4}
                  className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  required
                />
                <label
                  htmlFor="message"
                  className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-indigo-500"
                >
                  Message
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 dark:hover:bg-indigo-500 transition"
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>support@eventpilot.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>+1 (234) 567-890</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>123 Event Street, Innovation City</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Connect with Us</h2>
              <div className="flex gap-5">
                {[
                  {
                    href: "https://twitter.com",
                    icon: Twitter,
                    label: "Twitter",
                  },
                  {
                    href: "https://linkedin.com",
                    icon: Linkedin,
                    label: "LinkedIn",
                  },
                  { href: "https://github.com", icon: Github, label: "GitHub" },
                ].map(({ href, icon: Icon, label }) => (
                  <motion.div
                    key={href}
                    whileHover={{ scale: 1.15, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={href}
                      target="_blank"
                      aria-label={label}
                      className="group relative flex items-center justify-center p-4 rounded-full 
                   border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-900 
                   shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      {/* Glow effect on hover */}
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-20 blur-lg transition"></span>

                      {/* Icon */}
                      <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:scale-110" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const logos = [
  { name: "Google", src: "/logos/google.svg" },
  { name: "Microsoft", src: "/logos/microsoft.svg" },
  { name: "Amazon", src: "/logos/amazon.svg" },
  { name: "Meta", src: "/logos/meta.svg" },
  { name: "Airbnb", src: "/logos/airbnb.svg" },
  { name: "Netflix", src: "/logos/netflix.svg" },
  { name: "Shopify", src: "/logos/shopify.svg" },
  { name: "Stripe", src: "/logos/stripe.svg" },
  { name: "Slack", src: "/logos/slack.svg" },
  { name: "Spotify", src: "/logos/spotify.svg" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TrustedBy() {
  return (
    <section
      className="relative bg-white dark:bg-black pb-16 sm:pb-24"
      aria-labelledby="trusted-by-heading"
    >
      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
              Trusted by teams at
            </p>
            <h2
              id="trusted-by-heading"
              className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
            >
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Leading organizations
              </span>{" "}
              worldwide
            </h2>
          </div>

          {/* Logos grid */}
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={container}
            className="
              grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5
              gap-x-6 gap-y-8 sm:gap-y-12 md:gap-x-10 lg:gap-x-14
              items-center justify-items-center
            "
          >
            {logos.map((brand) => (
              <motion.li
                key={brand.name}
                variants={item}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                className="flex items-center justify-center w-full"
                aria-label={brand.name}
              >
                <div
                  className="
                    relative flex items-center justify-center
                    h-14 sm:h-16 md:h-20 w-36 sm:w-40 md:w-44
                    rounded-xl border border-gray-100 dark:border-gray-800
                    bg-white dark:bg-gray-900
                    shadow-sm hover:shadow-md
                    transition-transform duration-300
                  "
                >
                  <Image
                    src={brand.src}
                    alt={brand.name}
                    width={160}
                    height={40}
                    sizes="
                      (max-width: 640px) 120px,
                      (max-width: 768px) 140px,
                      (max-width: 1024px) 160px,
                      180px
                    "
                    className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                    priority
                  />
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {/* Sub-copy */}
          <p className="mt-10 sm:mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Powering conferences, product launches, and corporate offsites with{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              reliability, security, and scale.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

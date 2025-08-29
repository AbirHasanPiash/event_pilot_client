import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white dark:bg-black py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          {/* Left Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Organize Events, <br className="hidden sm:inline" />
              Effortlessly with{" "}
              <span className="text-indigo-600">EventPilot</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Manage your events with ease — from planning to ticketing to
              feedback. EventPilot is your complete event management platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                href="/create"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Create an Event
              </Link>
              <Link
                href="/events"
                className="rounded-full border border-gray-300 dark:border-white/20 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[28rem]">
            <Image
              src="/event_img.jpeg"
              alt="Event"
              width={800}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-md object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Decorative Gradient Blur */}
      <div
        className="absolute inset-x-0 top-0 -z-10 blur-3xl"
        aria-hidden="true"
      >
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-indigo-200/30 via-purple-300/30 to-pink-200/30 opacity-40 dark:opacity-20 rounded-full" />
      </div>
    </section>
  );
}

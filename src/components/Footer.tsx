import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand and Tagline */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold">
              <span className="text-indigo-600">Event</span>
              <span className="text-gray-900 dark:text-white">Pilot</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Seamless event management made simple.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/events" className="hover:text-indigo-600 transition-colors">Events</Link>
            <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
          </nav>

          {/* Social Icons */}
          <div className="flex gap-4 text-gray-600 dark:text-gray-400">
            <SocialIcon href="https://github.com/yourusername">
              <Github size={20} />
            </SocialIcon>
            <SocialIcon href="https://linkedin.com/in/yourprofile">
              <Linkedin size={20} />
            </SocialIcon>
            <SocialIcon href="https://twitter.com/yourhandle">
              <Twitter size={20} />
            </SocialIcon>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-600">
          &copy; {new Date().getFullYear()} EventPilot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-indigo-600 transition-colors"
    >
      {children}
    </Link>
  );
}

import Link from "next/link";
import { Github, Linkedin, X } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-indigo-500 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand and Tagline */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="flex items-center text-xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            >
              <span className="text-indigo-600">Event</span>
              <span className="text-gray-900 dark:text-white">Pilot</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Seamless event management made simple.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 text-gray-600 dark:text-gray-400">
            <SocialIcon href="https://github.com/AbirHasanPiash">
              <Github size={20} />
            </SocialIcon>
            <SocialIcon href="https://www.linkedin.com/in/a-h-piash/">
              <Linkedin size={20} />
            </SocialIcon>
            <SocialIcon href="https://twitter.com/yourhandle">
              <X size={20} />
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

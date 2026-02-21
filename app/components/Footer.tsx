import { Link } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import {
  Clock,
  BookOpen,
  Moon,
  Calendar,
  Compass,
  Sparkles,
  Smile,
  Heart,
  ArrowRight,
} from "lucide-react";

const featureLinks = [
  { label: "Prayer Times", to: "/prayers", icon: Clock },
  { label: "Quran Reader", to: "/quran", icon: BookOpen },
  { label: "Dhikr Counter", to: "/dhikr", icon: Moon },
  { label: "Islamic Calendar", to: "/calendar", icon: Calendar },
  { label: "Qibla Finder", to: "/qibla", icon: Compass },
  { label: "99 Names of Allah", to: "/names", icon: Sparkles },
  { label: "Spiritual Feelings", to: "/feelings", icon: Smile },
];

export default function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="relative bg-hero-warm text-white overflow-hidden">
      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 pattern-islamic opacity-40 pointer-events-none" />

      {/* Decorative top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Main footer content */}
      <div className="relative container-faith pt-16 pb-8 md:pt-20 md:pb-10">
        {/* Top section — Brand + CTA */}
        {!isAuthenticated && (
          <div className="mb-14 md:mb-16 text-center">
            <p className="font-amiri text-gold/80 text-sm tracking-widest uppercase mb-3">
              Bismillah
            </p>
            <h3 className="font-playfair text-2xl md:text-3xl font-semibold mb-3 text-white/95">
              Begin Your Spiritual Journey
            </h3>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Create a free account to sync your progress, save bookmarks, and
              personalize your experience.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 mb-5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:border-gold/30 transition-colors duration-300">
                <span className="text-white text-lg">&#9789;</span>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">
                  Siraat
                </span>
                <span className="text-lg font-light tracking-tight text-gold ml-0.5">
                  - A Bridge
                </span>
              </div>
            </Link>
            <p className="text-[0.8125rem] text-white/40 leading-relaxed max-w-xs">
              Your comprehensive spiritual companion. Access prayer times,
              Quran, dhikr tracking, and more — all in one beautiful platform.
            </p>
          </div>

          {/* Features column */}
          <div className="md:col-span-4 lg:col-span-5">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gold/70 mb-5">
              Features
            </h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {featureLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex items-center gap-2 text-[0.8125rem] text-white/50 hover:text-white transition-colors duration-200 group"
                    >
                      <Icon
                        size={14}
                        strokeWidth={1.6}
                        className="text-white/30 group-hover:text-gold/70 transition-colors duration-200"
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick links column */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gold/70 mb-5">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/"
                  className="text-[0.8125rem] text-white/50 hover:text-white transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/auth/login"
                      className="text-[0.8125rem] text-white/50 hover:text-white transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth/register"
                      className="text-[0.8125rem] text-white/50 hover:text-white transition-colors duration-200"
                    >
                      Create Account
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/prayers"
                    className="text-[0.8125rem] text-white/50 hover:text-white transition-colors duration-200"
                  >
                    My Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[0.6875rem] text-white/25 tracking-wide">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
            <p className="text-[0.6875rem] text-white/25 tracking-wide flex items-center gap-1.5">
              Made with{" "}
              <Heart size={10} className="text-gold/60 fill-gold/60" /> for the
              Ummah
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

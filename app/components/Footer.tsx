import { Link, useLocation } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { useFaith } from "~/contexts/FaithContext";
import { FAITH_CONFIGS } from "~/utils/faithConfig";
import { Heart, ArrowRight, Crown, Sparkles } from "lucide-react";

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const { config: userConfig } = useFaith();
  const location = useLocation();

  const onIslamPage = location.pathname.startsWith("/islam");
  const onHinduPage = location.pathname.startsWith("/hindu");
  const onFaithPage = onIslamPage || onHinduPage;

  // URL trumps the saved preference on faith-specific pages so the footer
  // matches the content the visitor is actually looking at.
  const faithConfig = onIslamPage
    ? FAITH_CONFIGS.muslim
    : onHinduPage
      ? FAITH_CONFIGS.hindu
      : userConfig;
  const faith = faithConfig.key;
  const featureLinks = faithConfig.navLinks.filter(
    (l) => l.to !== faithConfig.pathPrefix,
  );
  const dashboardHref = faithConfig.pathPrefix;

  // Pick a chrome that matches the page the visitor is on. Faith-specific
  // pages keep their Islamic-green footer; neutral pages get a neutral one.
  const shellClasses = onFaithPage
    ? "bg-hero-warm"
    : "bg-hero-neutral";
  const accentClass = onFaithPage ? "text-gold" : "text-[#E0B470]";
  const accentSubtleClass = onFaithPage ? "text-gold/70" : "text-[#E0B470]/75";
  const decorPattern = onFaithPage ? "pattern-islamic opacity-40" : "pattern-stars opacity-50";

  return (
    <footer className={`relative ${shellClasses} text-white overflow-hidden`}>
      <div className={`absolute inset-0 ${decorPattern} pointer-events-none`} />

      {/* Decorative top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative container-faith pt-16 pb-8 md:pt-20 md:pb-10">
        {/* Top section — Brand + CTA */}
        {!isAuthenticated && (
          <div className="mb-14 md:mb-16 text-center">
            {onIslamPage && (
              <p className="font-amiri text-gold/80 text-sm tracking-widest uppercase mb-3">
                Bismillah
              </p>
            )}
            <h3 className="font-playfair text-2xl md:text-3xl font-semibold mb-3 text-white/95">
              {onFaithPage ? "Begin your spiritual journey" : "Begin where you are."}
            </h3>
            <p className="text-white/70 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              {onFaithPage
                ? "Create a free account to sync your progress, save bookmarks, and personalize your experience."
                : "Free to start, free to switch traditions. Sync your progress on any device."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white text-sm font-semibold hover:bg-white/15 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/auth/login"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border ${
                  onFaithPage
                    ? "border-gold/30 text-gold hover:bg-gold/10"
                    : "border-[#E0B470]/35 text-[#E0B470] hover:bg-[#E0B470]/10"
                } text-sm font-semibold transition-all duration-300`}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <img
                src="/logo.png"
                alt="Siraat"
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl ring-1 ring-white/10 group-hover:ring-white/25 transition"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-white">
                  Siraat
                </span>
                <span className={`text-lg font-light tracking-tight ${accentClass} ml-0.5`}>
                  - A Bridge
                </span>
              </div>
            </Link>
            <p className="text-[0.8125rem] text-white/70 leading-relaxed max-w-xs">
              {onIslamPage
                ? "Your Islamic spiritual companion. Prayer times, Quran, dhikr, hadiths and more — all in one place."
                : onHinduPage
                  ? "Mantras, scriptures, Panchang and festivals — Siraat for Hindu seekers, in development."
                  : "A multi-faith spiritual companion. Choose your tradition, build your daily practice — one bridge between you and your faith."}
            </p>
          </div>

          {/* Middle column — features on faith pages, traditions on neutral pages */}
          <div className="md:col-span-4 lg:col-span-5">
            {onFaithPage && featureLinks.length > 1 ? (
              <>
                <h4 className={`text-xs font-semibold tracking-widest uppercase ${accentSubtleClass} mb-5`}>
                  Features
                </h4>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {featureLinks.map((link, i) => {
                    const Icon = link.icon;
                    return (
                      <li key={`${link.to}-${i}`}>
                        <Link
                          to={link.to}
                          className="inline-flex items-center gap-2 text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200 group"
                        >
                          <Icon
                            size={14}
                            strokeWidth={1.6}
                            className={`text-white/60 group-hover:${accentClass} transition-colors duration-200`}
                          />
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <h4 className={`text-xs font-semibold tracking-widest uppercase ${accentSubtleClass} mb-5`}>
                  Traditions
                </h4>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      to="/islam"
                      className="inline-flex items-center gap-2 text-[0.8125rem] text-white/80 hover:text-white transition-colors duration-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Islam — live
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/hindu"
                      className="inline-flex items-center gap-2 text-[0.8125rem] text-white/65 hover:text-white/85 transition-colors duration-200"
                    >
                      <Sparkles size={11} className={accentClass} />
                      Hinduism — coming soon
                    </Link>
                  </li>
                  <li className="text-[0.75rem] text-white/40 pt-2">
                    More on the roadmap: Christianity, Buddhism, Sikhism, Judaism
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Quick links column */}
          <div className="md:col-span-3">
            <h4 className={`text-xs font-semibold tracking-widest uppercase ${accentSubtleClass} mb-5`}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/"
                  className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/auth/login"
                      className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth/register"
                      className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                    >
                      Create Account
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to={dashboardHref}
                    className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                  >
                    My Dashboard
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/about"
                  className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[0.8125rem] text-white/75 hover:text-white transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/subscribe"
                  className={`inline-flex items-center gap-1.5 text-[0.8125rem] ${accentClass} hover:opacity-100 opacity-85 transition-opacity duration-200`}
                >
                  <Crown size={12} />
                  Premium
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[0.6875rem] text-white/60 tracking-wide">
              &copy; {new Date().getFullYear()} Siraat. All rights reserved.
            </p>
            <p className="text-[0.6875rem] text-white/60 tracking-wide flex items-center gap-1.5">
              Made with{" "}
              <Heart size={10} className={`${accentClass} opacity-70 fill-current`} />
              {onIslamPage
                ? "for the Ummah"
                : onHinduPage
                  ? "for every seeker"
                  : "for every path"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

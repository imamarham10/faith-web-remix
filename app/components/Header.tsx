import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { useFaith } from "~/contexts/FaithContext";
import { FAITH_CONFIGS } from "~/utils/faithConfig";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Crown,
} from "lucide-react";

export default function Header() {
  const { config: userConfig } = useFaith();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isPremium, logout } = useAuth();

  // On faith-specific pages (/islam/*, /hindu/*) the URL drives which nav we
  // render — independent of the user's saved preference.
  const onIslamPage = location.pathname.startsWith("/islam");
  const onHinduPage = location.pathname.startsWith("/hindu");

  const faithConfig = onIslamPage
    ? FAITH_CONFIGS.muslim
    : onHinduPage
      ? FAITH_CONFIGS.hindu
      : userConfig;

  // The neutral landing has its own faith picker; we hide chrome nav there
  // so the page is the only thing asking the visitor to choose a tradition.
  const isNeutralLanding = location.pathname === "/";
  const navLinks = isNeutralLanding ? [] : faithConfig.navLinks;

  // Auth entry points carry the section's faith so the sign-in experience
  // matches where the visitor came from — and stays neutral from the landing.
  const authSearch = onIslamPage ? "?faith=islam" : onHinduPage ? "?faith=hindu" : "";

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (path: string) => {
    // Faith-specific home (e.g. /islam, /hindu) needs exact match so it doesn't
    // light up for every sub-route.
    if (path === faithConfig.pathPrefix || path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-surface/95 backdrop-blur-xl shadow-sm border-b border-border-light"
            : "bg-surface border-b border-border-light"
        }`}
      >
        <div className="container-faith">
          <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <img
                src="/logo.png"
                alt="Siraat"
                width={36}
                height={36}
                className="w-9 h-9 rounded-xl shadow-sm shrink-0"
              />
              <div className="whitespace-nowrap leading-none">
                <span className="text-lg font-bold tracking-tight text-text">
                  Siraat
                </span>
                <span className="text-lg font-light tracking-tight text-[#9A7B3A] ml-0.5 hidden 2xl:inline">
                  - A Bridge
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 min-w-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                // Active-pill color forks 3-ways like chrome — burgundy on
                // /hindu/*, green on /islam/* (and neutral defaults), midnight
                // on the neutral landing where nav is hidden anyway.
                const activeClass = onHinduPage
                  ? "bg-[#6B1F2A]/10 text-[#6B1F2A]"
                  : "bg-primary-50 text-primary";
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      active
                        ? activeClass
                        : "text-text-secondary hover:text-text hover:bg-black/[0.03]"
                    }`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/[0.03] transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        onHinduPage
                          ? "bg-gradient-to-br from-[#6B1F2A] to-[#8B3344]"
                          : "bg-hero-gradient"
                      }`}
                    >
                      <span className="text-white text-xs font-semibold">
                        {(user.name || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-text-muted transition-transform hidden sm:block ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border-light py-2 z-50 animate-slide-down">
                        <div className="px-4 py-2.5 border-b border-border-light">
                          <p className="text-sm font-semibold text-text truncate">
                            {user.name || user.fullName || "User"}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/subscribe"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-black/[0.03]"
                        >
                          <Crown size={15} className={isPremium ? "text-amber-500" : "text-text-secondary"} />
                          <span className={isPremium ? "text-amber-600 font-medium" : "text-text-secondary"}>
                            {isPremium ? "Premium Active" : "Upgrade to Premium"}
                          </span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-black/[0.03] transition-colors"
                        >
                          <Settings size={15} />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to={`/auth/login${authSearch}`}
                  className={
                    isNeutralLanding
                      ? "hidden sm:inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[#221A13] text-white hover:bg-[#35281B] transition-colors whitespace-nowrap"
                      : onHinduPage
                        ? "hidden sm:inline-flex btn-hindu-primary text-sm px-4 py-2 whitespace-nowrap"
                        : "hidden sm:inline-flex btn-primary text-sm px-4 py-2 whitespace-nowrap"
                  }
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-black/[0.03] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={`mobile-drawer ${mobileOpen ? "open" : ""} safe-bottom`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Siraat"
                width={36}
                height={36}
                className="w-9 h-9 rounded-xl"
              />
              <span className="text-lg font-bold text-text">Siraat</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl hover:bg-black/[0.03]"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
                    active
                      ? "bg-primary-50 text-primary"
                      : "text-text-secondary hover:bg-black/[0.03] hover:text-text"
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-border-light">
            {user ? (
              <div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.name || user.fullName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  to="/subscribe"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/[0.03] transition-colors mt-1"
                >
                  <Crown size={18} className={isPremium ? "text-amber-500" : "text-text-secondary"} />
                  <span className={`text-sm font-medium ${isPremium ? "text-amber-600" : "text-text-secondary"}`}>
                    {isPremium ? "Premium Active" : "Upgrade to Premium"}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/5 w-full transition-colors mt-1"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-4">
                <Link
                  to={`/auth/login${authSearch}`}
                  className="btn-primary w-full text-center block"
                >
                  Sign In
                </Link>
                <Link
                  to={`/auth/register${authSearch}`}
                  className="btn-secondary w-full text-center block"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

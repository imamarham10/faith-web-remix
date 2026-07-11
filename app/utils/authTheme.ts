import {
  BookOpen,
  Moon,
  Compass,
  Clock,
  Calendar,
  Flower2,
  Sunrise,
  HeartHandshake,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Faith-aware theming for the auth screens.
 *
 * The auth pages are faith-NEUTRAL by default (entered from the main
 * landing page). When the user arrives from inside a faith section, the
 * Header/Footer links carry `?faith=islam|hindu` and the decorative panel
 * adopts that tradition's voice. The form itself never changes — only the
 * ambiance.
 */
export type AuthFaith = "islam" | "hindu" | "neutral";

export function resolveAuthFaith(search: URLSearchParams): AuthFaith {
  const raw = (search.get("faith") || "").toLowerCase();
  if (raw === "islam" || raw === "muslim") return "islam";
  if (raw === "hindu" || raw === "hinduism") return "hindu";
  return "neutral";
}

/**
 * Query suffix Header/Footer append to /auth/* links based on the section
 * the visitor is currently browsing. Main landing (and any non-faith page)
 * yields "" → neutral auth.
 */
export function authFaithSearch(pathname: string): string {
  if (pathname.startsWith("/islam")) return "?faith=islam";
  if (pathname.startsWith("/hindu")) return "?faith=hindu";
  return "";
}

interface AuthPill {
  icon: LucideIcon;
  label: string;
}

export interface AuthTheme {
  /** Decorative panel background class */
  panelBg: string;
  /** Pattern overlay class(es) */
  pattern: string;
  loginHeading: string;
  loginBody: string;
  registerHeading: string;
  registerBody: string;
  loginPills: AuthPill[];
  registerFeatures: AuthPill[];
  /** Footer line of the decorative panel */
  quote: { text: string; className: string; dir?: "rtl" | "ltr"; caption?: string };
}

export const AUTH_THEMES: Record<AuthFaith, AuthTheme> = {
  neutral: {
    panelBg: "bg-hero-neutral",
    pattern: "pattern-stars",
    loginHeading: "Welcome back to your practice",
    loginBody:
      "One thoughtful companion for daily practice — whatever tradition you follow.",
    registerHeading: "Begin where you are",
    registerBody:
      "One account for every tradition on Siraat. Pick your path now, or explore first — you can always change it.",
    loginPills: [
      { icon: Sunrise, label: "Daily rhythm" },
      { icon: BookOpen, label: "Sacred texts" },
      { icon: HeartHandshake, label: "Reflection" },
    ],
    registerFeatures: [
      { icon: Sunrise, label: "Practice times tuned to your location" },
      { icon: BookOpen, label: "Scripture with faithful translations" },
      { icon: HeartHandshake, label: "Counters, goals and gentle streaks" },
    ],
    quote: {
      text: "One companion. Every faith.",
      className: "text-white/40 text-sm tracking-wide",
    },
  },

  islam: {
    panelBg: "bg-hero-gradient",
    pattern: "pattern-islamic opacity-30",
    loginHeading: "Welcome back to your spiritual journey",
    loginBody:
      "Continue your path with prayer tracking, Quran reading, and dhikr — all in one place.",
    registerHeading: "Start your spiritual journey today",
    registerBody:
      "Track prayers, read the Quran with translations, and keep your dhikr — built for daily practice.",
    loginPills: [
      { icon: BookOpen, label: "Quran Reader" },
      { icon: Moon, label: "Dhikr Counter" },
      { icon: Compass, label: "Qibla Finder" },
    ],
    registerFeatures: [
      { icon: Clock, label: "Track all 5 daily prayers" },
      { icon: BookOpen, label: "Read Quran with translations" },
      { icon: Moon, label: "Daily dhikr goals & streaks" },
    ],
    quote: {
      text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      className: "font-amiri text-white/40 text-base",
      dir: "rtl",
    },
  },

  hindu: {
    panelBg: "bg-hero-hindu",
    pattern: "pattern-kolam",
    loginHeading: "Welcome back to your sadhana",
    loginBody:
      "Continue your practice with the Gita, japa, Panchang and the day's sandhya times — all in one place.",
    registerHeading: "Begin your sadhana today",
    registerBody:
      "Read the Bhagavad Gita verse by verse, count your japa, and never miss a tithi or festival.",
    loginPills: [
      { icon: BookOpen, label: "Gita Reader" },
      { icon: Flower2, label: "Japa Mala" },
      { icon: Calendar, label: "Panchang" },
    ],
    registerFeatures: [
      { icon: Calendar, label: "Daily Panchang & festival alerts" },
      { icon: BookOpen, label: "Gita with Sanskrit & translation" },
      { icon: Landmark, label: "Stotras, temples & sacred stories" },
    ],
    quote: {
      text: "धर्मो रक्षति रक्षितः",
      className: "text-white/40 text-base",
      caption: "Dharma protects those who protect it",
    },
  },
};

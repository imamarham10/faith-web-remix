import {
  Clock,
  BookOpen,
  Moon,
  Calendar,
  Compass,
  Heart,
  Smile,
  BookMarked,
  Library,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Faith identifiers — match backend `UserPreference.faith` values.
 * Adherent labels: a Muslim follows Islam; a Hindu follows Hinduism.
 */
export type FaithKey = "muslim" | "hindu";

export interface FaithNavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface FaithConfig {
  key: FaithKey;
  /** Religion name shown to users (e.g., "Islam", "Hinduism") */
  displayName: string;
  /** Adherent label (e.g., "Muslim", "Hindu") */
  adherentLabel: string;
  /** URL prefix for this faith's routes */
  pathPrefix: string;
  /** True if content is not yet built — show coming-soon placeholders */
  comingSoon: boolean;
  /** Header / nav links */
  navLinks: FaithNavLink[];
  /** Tagline shown on faith picker card */
  tagline: string;
  /** Greeting shown on faith-specific home */
  greetingEnglish: string;
  greetingNative?: string;
}

export const FAITH_CONFIGS: Record<FaithKey, FaithConfig> = {
  muslim: {
    key: "muslim",
    displayName: "Islam",
    adherentLabel: "Muslim",
    pathPrefix: "/islam",
    comingSoon: false,
    tagline: "Prayer times, Quran, Hadiths, Dhikr & more",
    greetingEnglish: "Assalamu Alaikum",
    greetingNative: "السلام عليكم",
    navLinks: [
      { to: "/islam", label: "Home", icon: Heart },
      { to: "/islam/prayers", label: "Prayers", icon: Clock },
      { to: "/islam/quran", label: "Quran", icon: BookOpen },
      { to: "/islam/duas", label: "Duas", icon: BookMarked },
      { to: "/islam/hadiths", label: "Hadiths", icon: Library },
      { to: "/islam/dhikr", label: "Dhikr", icon: Moon },
      { to: "/islam/calendar", label: "Calendar", icon: Calendar },
      { to: "/islam/qibla", label: "Qibla", icon: Compass },
      { to: "/islam/feelings", label: "Feelings", icon: Smile },
    ],
  },
  hindu: {
    key: "hindu",
    displayName: "Hinduism",
    adherentLabel: "Hindu",
    pathPrefix: "/hindu",
    comingSoon: true,
    tagline: "Mantras, scriptures, Panchang & festivals — coming soon",
    greetingEnglish: "Namaste",
    greetingNative: "नमस्ते",
    navLinks: [
      { to: "/hindu", label: "Home", icon: Heart },
      { to: "/hindu", label: "Coming Soon", icon: Sparkles },
    ],
  },
};

export const FAITH_KEYS: FaithKey[] = ["muslim", "hindu"];

/** Default faith when user has no preference and no anon cookie set. */
export const DEFAULT_FAITH: FaithKey = "muslim";

export function getFaithConfig(key: string | null | undefined): FaithConfig {
  if (key === "hindu") return FAITH_CONFIGS.hindu;
  return FAITH_CONFIGS.muslim;
}

export function isValidFaithKey(key: unknown): key is FaithKey {
  return key === "muslim" || key === "hindu";
}

/** Storage key for anonymous-user faith choice (persisted in localStorage). */
export const ANON_FAITH_STORAGE_KEY = "siraat:anon-faith";

/**
 * Canonical deityKey vocabulary shared across Hindu stotras / temples / stories
 * (see team/hindu-completion-spec.md — conventions header).
 */
export const DEITY_KEYS = [
  "ganesha",
  "shiva",
  "vishnu",
  "krishna",
  "rama",
  "hanuman",
  "devi",
  "durga",
  "lakshmi",
  "saraswati",
  "murugan",
  "surya",
  "ayyappa",
] as const;

export type DeityKey = (typeof DEITY_KEYS)[number];

export function deityLabel(key?: string | null): string {
  if (!key) return "";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Badge color combos drawn from the Hindu palette already used on
 * hindu.panchang.tsx (gold, saffron, violet, maroon, deep).
 */
const BADGE_GOLD = "bg-[#FAF1D9] text-[#7A5B19] border-[#E8D5A0]";
const BADGE_SAFFRON = "bg-[#FDEEDC] text-[#A05A1C] border-[#F3D9B8]";
const BADGE_VIOLET = "bg-[#EFE9F7] text-[#6B4F8C] border-[#DCD2EC]";
const BADGE_MAROON = "bg-[#FBE9EA] text-[#8A2B36] border-[#E8C2C6]";
const BADGE_DEEP = "bg-[#2A0A12]/[0.06] text-[#3A0F18] border-[#3A0F18]/15";

const DEITY_BADGES: Record<string, string> = {
  ganesha: BADGE_SAFFRON,
  shiva: BADGE_VIOLET,
  vishnu: BADGE_GOLD,
  krishna: BADGE_VIOLET,
  rama: BADGE_GOLD,
  hanuman: BADGE_SAFFRON,
  devi: BADGE_MAROON,
  durga: BADGE_MAROON,
  lakshmi: BADGE_GOLD,
  saraswati: BADGE_VIOLET,
  murugan: BADGE_SAFFRON,
  surya: BADGE_SAFFRON,
  ayyappa: BADGE_DEEP,
};

export function deityBadgeClass(key?: string | null): string {
  return (key && DEITY_BADGES[key]) || BADGE_DEEP;
}

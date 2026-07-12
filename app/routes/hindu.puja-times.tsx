import { useEffect, useMemo, useState } from "react";
import {
  Sunrise,
  Sunset,
  Sun,
  MapPin,
  Sparkles,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  Flame,
  TrendingUp,
} from "lucide-react";
import { hinduPujaTimesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

type SandhyaName = "pratah" | "madhyahna" | "sayam";

interface TimeBand {
  start: string;
  end: string;
}

interface SandhyaInfo {
  name: SandhyaName;
  nameSanskrit: string;
  nameEnglish: string;
  band: TimeBand;
  isCurrent: boolean;
}

interface PujaTimesData {
  date: string;
  timezone: string;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  sandhyas: SandhyaInfo[];
  next?: { sandhya: SandhyaName; startsInSeconds: number };
}

interface PujaStats {
  total: number;
  onTime: number;
  late: number;
  missed: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

// ---------- Helpers ----------

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209, label: "New Delhi" };

const SANDHYA_DESCRIPTIONS: Record<SandhyaName, string> = {
  pratah: "Dawn worship — connect with Brahma's serene morning light",
  madhyahna: "Midday worship — at the sun's zenith",
  sayam: "Dusk worship — honor the day's transition",
};

/**
 * The backend's panchang-ts library returns "wall-clock-as-UTC" timestamps.
 * Format using UTC to render the wall-clock the backend computed.
 */
const formatWallTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const formatTimeBand = (band: TimeBand | null | undefined): string => {
  if (!band) return "—";
  return `${formatWallTime(band.start)} – ${formatWallTime(band.end)}`;
};

const formatGregorianDate = (isoDate: string): string => {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dt);
};

const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "Starting now";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
};

const sandhyaLabel = (name: SandhyaName): string =>
  ({ pratah: "Pratah", madhyahna: "Madhyahna", sayam: "Sayam" }[name]);

// ---------- Meta ----------

export function meta() {
  return [
    { title: "Sandhya & Puja Times | Siraat" },
    {
      name: "description",
      content:
        "Three daily Sandhya windows based on your location — Pratah, Madhyahna, and Sayam.",
    },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function HinduPujaTimes() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<PujaTimesData | null>(null);
  const [stats, setStats] = useState<PujaStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string>(DEFAULT_LOCATION.label);
  const [logging, setLogging] = useState<SandhyaName | null>(null);
  const [loggedToday, setLoggedToday] = useState<Record<SandhyaName, boolean>>({
    pratah: false,
    madhyahna: false,
    sayam: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchTimes = async (lat: number, lng: number, label: string) => {
      setLocationLabel(label);
      try {
        const res = await hinduPujaTimesAPI.getToday(lat, lng, tz);
        const payload = (res.data?.data ?? res.data) as PujaTimesData;
        setData(payload);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to load Sandhya times",
        );
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchTimes(
            latitude,
            longitude,
            `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          );
        },
        () => {
          fetchTimes(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label);
        },
        { timeout: 5000 },
      );
    } else {
      fetchTimes(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label);
    }
  }, []);

  // Stats fetch (auth-only)
  useEffect(() => {
    if (!isAuthenticated) {
      setStats(null);
      return;
    }
    hinduPujaTimesAPI
      .getStats()
      .then((res) => {
        const payload = (res.data?.data ?? res.data) as PujaStats;
        setStats(payload);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Mark which sandhyas user already logged today
  useEffect(() => {
    if (!isAuthenticated || !data) return;
    const today = data.date;
    hinduPujaTimesAPI
      .getLogs(today, today)
      .then((res) => {
        const list = (res.data?.data ?? res.data) as Array<{ sandhya: SandhyaName }>;
        if (Array.isArray(list)) {
          const map: Record<SandhyaName, boolean> = {
            pratah: false,
            madhyahna: false,
            sayam: false,
          };
          for (const l of list) map[l.sandhya] = true;
          setLoggedToday(map);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, data]);

  const handleLog = async (s: SandhyaInfo) => {
    if (!data || logging) return;
    setLogging(s.name);
    const status: "on_time" | "late" | "missed" = s.isCurrent ? "on_time" : "late";
    try {
      await hinduPujaTimesAPI.logSandhya(s.name, data.date, status);
      setLoggedToday((prev) => ({ ...prev, [s.name]: true }));
      setToast(`${sandhyaLabel(s.name)} Sandhya logged`);
      // Refresh stats
      hinduPujaTimesAPI
        .getStats()
        .then((res) => setStats((res.data?.data ?? res.data) as PujaStats))
        .catch(() => {});
    } catch (e: any) {
      setToast(e?.response?.data?.message || "Could not log Sandhya");
    } finally {
      setLogging(null);
      setTimeout(() => setToast(null), 2400);
    }
  };

  const nextLabel = useMemo(() => {
    if (!data?.next) return null;
    return `${sandhyaLabel(data.next.sandhya)} Sandhya in ${formatCountdown(
      data.next.startsInSeconds,
    )}`;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Sparkles size={12} />
              Sandhya
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
              Sandhya Times
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 text-sm sm:text-base mb-5">
              <span className="inline-flex items-center gap-2">
                <Calendar size={15} className="text-[#E8D5A0]" />
                {data ? formatGregorianDate(data.date) : "—"}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} className="text-[#E8D5A0]" />
                {locationLabel}
              </span>
              {data?.timezone && (
                <span className="inline-flex items-center gap-2">
                  <Clock size={15} className="text-[#E8D5A0]" />
                  {data.timezone}
                </span>
              )}
            </div>
            {nextLabel && (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-[#E8D5A0] animate-pulse" />
                <span className="text-sm font-medium tracking-wide">
                  Next: {nextLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container-faith py-10 md:py-14">
        {loading && <PageLoading />}

        {!loading && error && <PageError message={error} />}

        {!loading && !error && data && (
          <div className="space-y-8 md:space-y-10">
            {/* Sandhya cards */}
            <section aria-labelledby="sandhya-heading">
              <SectionTitle
                id="sandhya-heading"
                eyebrow="Trisandhya"
                title="The Three Sandhyas"
                subtitle="Daily worship windows anchored to the sun's position"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                {data.sandhyas.map((s) => (
                  <SandhyaCard
                    key={s.name}
                    sandhya={s}
                    showLogButton={isAuthenticated}
                    isLogged={loggedToday[s.name]}
                    isLogging={logging === s.name}
                    onLog={() => handleLog(s)}
                  />
                ))}
              </div>
            </section>

            {/* Sun row */}
            <section aria-labelledby="sun-heading">
              <SectionTitle
                id="sun-heading"
                eyebrow="Surya"
                title="Sun Position"
                subtitle="Today's sunrise, solar noon, and sunset for your location"
              />
              <SunRow
                sunrise={data.sunrise}
                solarNoon={data.solarNoon}
                sunset={data.sunset}
              />
            </section>

            {/* Stats — auth only */}
            {isAuthenticated && stats && (
              <section aria-labelledby="stats-heading">
                <SectionTitle
                  id="stats-heading"
                  eyebrow="Sadhana"
                  title="Your Practice"
                  subtitle="Track your Sandhya consistency over time"
                />
                <StatsRow stats={stats} />
              </section>
            )}

            {!isAuthenticated && (
              <SignedOutCallout />
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-5 py-3 rounded-full bg-[#3A0F18] text-white text-sm font-medium shadow-lg flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-[#E8D5A0]" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Section title ----------

function SectionTitle({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-1.5">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-playfair text-2xl md:text-3xl font-bold text-[#3A0F18] leading-tight"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[#6B5642] mt-1.5 max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}

// ---------- Sandhya card ----------

function SandhyaCard({
  sandhya,
  showLogButton,
  isLogged,
  isLogging,
  onLog,
}: {
  sandhya: SandhyaInfo;
  showLogButton: boolean;
  isLogged: boolean;
  isLogging: boolean;
  onLog: () => void;
}) {
  const accent =
    sandhya.name === "pratah"
      ? "border-[#E8D5A0] bg-gradient-to-br from-white to-[#FBF6EC]"
      : sandhya.name === "madhyahna"
        ? "border-[#C8A55A]/40 bg-gradient-to-br from-white to-[#FAF1D9]"
        : "border-[#6B1F2A]/15 bg-gradient-to-br from-white to-[#F4E7C4]";

  const iconWrap =
    sandhya.name === "pratah"
      ? "bg-[#FAF1D9] text-[#9A7B3A]"
      : sandhya.name === "madhyahna"
        ? "bg-[#FAE9C2] text-[#7A5B19]"
        : "bg-[#F4E7C4] text-[#6B1F2A]";

  const Icon =
    sandhya.name === "pratah" ? Sunrise : sandhya.name === "madhyahna" ? Sun : Sunset;

  return (
    <article
      className={`relative rounded-2xl border ${accent} p-6 md:p-7 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] overflow-hidden flex flex-col`}
    >
      {/* Active pill */}
      {sandhya.isCurrent && (
        <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3A0F18] text-white text-[10px] font-semibold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8D5A0] animate-pulse" />
          Active now
        </span>
      )}

      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconWrap} mb-5`}
      >
        <Icon size={22} />
      </div>

      <p
        className="text-3xl md:text-4xl leading-tight text-[#3A0F18] font-semibold mb-1.5"
        style={{ fontFamily: "var(--font-devanagari)" }}
        lang="sa"
      >
        {sandhya.nameSanskrit}
      </p>
      <p className="text-base font-semibold text-[#1A1D23] tracking-tight">
        {sandhya.nameEnglish}
      </p>
      <p className="text-xs text-[#6B5642] mt-1.5 leading-relaxed">
        {SANDHYA_DESCRIPTIONS[sandhya.name]}
      </p>

      <div className="mt-5 pt-5 border-t border-[#F1E7D2]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9A7B3A] font-semibold mb-1.5">
          Window
        </p>
        <p className="text-xl font-semibold text-[#3A0F18] tabular-nums leading-tight">
          {formatTimeBand(sandhya.band)}
        </p>
      </div>

      {showLogButton && (
        <button
          type="button"
          onClick={onLog}
          disabled={isLogged || isLogging}
          className={`mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isLogged
              ? "bg-[#FAF1D9] text-[#7A5B19] border border-[#E8D5A0] cursor-default"
              : isLogging
                ? "bg-[#3A0F18]/70 text-white cursor-wait"
                : "bg-[#3A0F18] text-white hover:bg-[#6B1F2A]"
          }`}
        >
          {isLogged ? (
            <>
              <CheckCircle2 size={15} />
              Logged today
            </>
          ) : isLogging ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Logging…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Mark as performed
            </>
          )}
        </button>
      )}
    </article>
  );
}

// ---------- Sun row ----------

function SunRow({
  sunrise,
  solarNoon,
  sunset,
}: {
  sunrise: string;
  solarNoon: string;
  sunset: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
      <SunCard icon={<Sunrise size={18} />} label="Sunrise" time={sunrise} />
      <SunCard icon={<Sun size={18} />} label="Solar Noon" time={solarNoon} />
      <SunCard icon={<Sunset size={18} />} label="Sunset" time={sunset} />
    </div>
  );
}

function SunCard({
  icon,
  label,
  time,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-5 md:p-6 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FAF1D9] text-[#9A7B3A]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9A7B3A] font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-xl md:text-2xl font-semibold text-[#3A0F18] tabular-nums leading-tight">
          {formatWallTime(time)}
        </p>
      </div>
    </div>
  );
}

// ---------- Stats ----------

function StatsRow({ stats }: { stats: PujaStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
      <StatCard
        icon={<CheckCircle2 size={18} />}
        label="Total Logged"
        value={stats.total}
        tone="default"
      />
      <StatCard
        icon={<Flame size={18} />}
        label="Current Streak"
        value={`${stats.currentStreak}d`}
        tone="warm"
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label="Longest Streak"
        value={`${stats.longestStreak}d`}
        tone="default"
      />
      <StatCard
        icon={<Sparkles size={18} />}
        label="On Time"
        value={`${stats.completionRate}%`}
        tone="warm"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "default" | "warm";
}) {
  const iconWrap =
    tone === "warm"
      ? "bg-[#FAF1D9] text-[#9A7B3A]"
      : "bg-[#F4EAD2] text-[#6B1F2A]";
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-5 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconWrap} mb-3`}
      >
        {icon}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#9A7B3A] font-semibold mb-1">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-[#3A0F18] tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
}

// ---------- Signed-out callout ----------

function SignedOutCallout() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#FBF6EC] to-[#F4E7C4] border border-[#E8D5A0] p-6 md:p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white text-[#9A7B3A] flex items-center justify-center mx-auto mb-3 border border-[#E8D5A0]">
        <Sparkles size={20} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-1.5">
        Sign in to track your Sandhyas
      </h3>
      <p className="text-sm text-[#6B5642] max-w-md mx-auto">
        Log your daily worship and watch your streak grow. Build a consistent
        practice with Pratah, Madhyahna, and Sayam Sandhyas.
      </p>
    </div>
  );
}

// ---------- Loading & error states ----------

function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
      <p className="text-sm text-[#6B5642]">
        Calculating today's Sandhya windows for your location…
      </p>
    </div>
  );
}

function PageError({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} />
      </div>
      <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Sandhya times unavailable
      </h2>
      <p className="text-sm text-[#6B5642]">{message}</p>
    </div>
  );
}

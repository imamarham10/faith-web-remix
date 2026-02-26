import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { Link, useLoaderData } from "react-router";
import {
  Clock,
  BookOpen,
  Moon,
  Calendar,
  Compass,
  ChevronRight,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  Flame,
  Check,
} from "lucide-react";
import { prayerAPI, calendarAPI, namesAPI, muhammadNamesAPI, dhikrAPI, quranAPI } from "~/services/api";
import { getDailyInspiration } from "~/utils/dailyInspiration";
import { FeelingsWidget } from "~/components/FeelingsWidget";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";


function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Assalamu Alaikum";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 20) return "Good Evening";
  return "Assalamu Alaikum";
}

function getGreetingArabic(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "السلام عليكم";
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  if (hour < 20) return "مساء النور";
  return "السلام عليكم";
}

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

/** Get the current date string (yyyy-MM-dd) in the device's local timezone */
function getLocalDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Map the device timezone to a Hijri calendar adjustment:
 *   0 = standard/Gulf/Umm al-Qura  (Ramadan 1 = Feb 18, 2026)
 *   1 = India/Pakistan/Bangladesh/Sri Lanka  (Ramadan 1 = Feb 19, 2026)
 */
function getCalendarAdjust(): number {
  if (typeof window === "undefined") return 0;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const indiaRegion = ["Asia/Kolkata", "Asia/Calcutta", "Asia/Karachi", "Asia/Dhaka", "Asia/Colombo"];
  return indiaRegion.includes(tz) ? 1 : 0;
}

/** Parse time from API — handles ISO timestamps and HH:mm */
function parseTimeToHHMM(val: string | undefined | null): string | null {
  if (!val) return null;
  const s = val.trim();
  if (s.includes("T")) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
  }
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return null;
}

function formatTo12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Normalize API response into { PrayerName: "HH:mm" } */
function normalizePrayerTimes(apiData: any): Record<string, string> {
  const raw = apiData?.times || apiData?.timings || apiData || {};
  const normalized: Record<string, string> = {};
  Object.entries(raw).forEach(([key, val]) => {
    let k = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    if (k === "Zuhr") k = "Dhuhr";
    const parsed = parseTimeToHHMM(val as string);
    if (parsed) normalized[k] = parsed;
  });
  return normalized;
}

const features = [
  {
    title: "Prayer Times",
    description: "Accurate prayer times based on your location with countdown",
    icon: Clock,
    link: "/prayers",
    color: "bg-primary/10 text-primary",
    iconBg: "bg-primary",
  },
  {
    title: "Quran",
    description: "Read the Holy Quran with translations and bookmarks",
    icon: BookOpen,
    link: "/quran",
    color: "bg-amber-500/10 text-amber-600",
    iconBg: "bg-amber-500",
  },
  {
    title: "Dhikr",
    description: "Track your daily remembrance with counters and goals",
    icon: Moon,
    link: "/dhikr",
    color: "bg-purple-500/10 text-purple-600",
    iconBg: "bg-purple-500",
  },
  {
    title: "Calendar",
    description: "Hijri calendar with Islamic events and date conversion",
    icon: Calendar,
    link: "/calendar",
    color: "bg-rose-500/10 text-rose-600",
    iconBg: "bg-rose-500",
  },
  {
    title: "Qibla",
    description: "Find the Qibla direction from anywhere in the world",
    icon: Compass,
    link: "/qibla",
    color: "bg-sky-500/10 text-sky-600",
    iconBg: "bg-sky-500",
  },
];

interface PrayerTimings {
  Fajr?: string;
  Dhuhr?: string;
  Asr?: string;
  Maghrib?: string;
  Isha?: string;
}

interface DailyName {
  nameArabic: string;
  name: string;
  transliteration: string;
  meaning: string;
}

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const today = new Date().toISOString().split('T')[0];

  const [calendarRes, eventsRes, dailyNameRes, emotionsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/islam/calendar/today`),
    fetch(`${API_BASE}/api/v1/islam/calendar/events/upcoming?days=90`),
    fetch(`${API_BASE}/api/v1/islam/names/daily`),
    fetch(`${API_BASE}/api/v1/islam/feelings`),
  ]);

  // Calendar today — extract hijri date info
  let calendarToday: any = null;
  if (calendarRes.status === "fulfilled" && calendarRes.value.ok) {
    try {
      const json = await calendarRes.value.json();
      calendarToday = json.data || json;
    } catch {}
  }

  // Upcoming events
  let upcomingEvents: any[] = [];
  if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
    try {
      const json = await eventsRes.value.json();
      const data = json.data || json;
      const eventsList = Array.isArray(data) ? data : data?.events || [];
      upcomingEvents = eventsList.slice(0, 5);
    } catch {}
  }

  // Daily name of Allah
  let dailyName: { nameArabic: string; name: string; transliteration: string; meaning: string } | null = null;
  if (dailyNameRes.status === "fulfilled" && dailyNameRes.value.ok) {
    try {
      const json = await dailyNameRes.value.json();
      const data = json.data || json;
      if (data && typeof data === "object") {
        const nameArabic = (data.nameArabic ?? data.name_arabic ?? "") as string;
        const name = (data.nameEnglish ?? data.name ?? "") as string;
        const transliteration = (data.nameTranslit ?? data.name_translit ?? "") as string;
        const meaning = (data.meaning ?? "") as string;
        if (name || nameArabic) {
          dailyName = { nameArabic, name, transliteration, meaning };
        }
      }
    } catch {}
  }

  // All emotions for FeelingsWidget
  let emotions: any[] = [];
  if (emotionsRes.status === "fulfilled" && emotionsRes.value.ok) {
    try {
      const json = await emotionsRes.value.json();
      const data = json.data || json;
      if (Array.isArray(data)) {
        emotions = data;
      }
    } catch {}
  }

  return { calendarToday, upcomingEvents, dailyName, emotions };
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  // Derive initial hijri date from loader's calendarToday
  const initialHijri = (() => {
    const h = loaderData?.calendarToday?.hijri || loaderData?.calendarToday;
    if (!h) return "";
    const day = h.hijriDay || h.day || h.date || "";
    const month = h.hijriMonthName || h.monthName || h.month_name || h.month?.en || h.month?.name || "";
    const year = h.hijriYear || h.year || "";
    if (day && year) return `${day} ${month} ${year} AH`;
    return "";
  })();

  // Derive initial today events from loader
  const initialTodayEvents = (() => {
    const h = loaderData?.calendarToday?.hijri || loaderData?.calendarToday;
    if (h?.events && h.events.length > 0) return h.events;
    return [];
  })();

  const [hijriDate, setHijriDate] = useState<string>(initialHijri);
  const [todayEvents, setTodayEvents] = useState<any[]>(initialTodayEvents);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [locationName, setLocationName] = useState("Locating...");
  const [isPastIsha, setIsPastIsha] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(loaderData?.upcomingEvents?.length ? loaderData.upcomingEvents : []);
  const [eventsLoading, setEventsLoading] = useState(!loaderData?.upcomingEvents?.length);
  const [dailyName, setDailyName] = useState<DailyName | null>(loaderData?.dailyName || null);
  const [dailyNameLoading, setDailyNameLoading] = useState(!loaderData?.dailyName);
  const [muhammadDailyName, setMuhammadDailyName] = useState<DailyName | null>(null);

  // Logged-in dashboard state
  const [prayerStreak, setPrayerStreak] = useState<number>(0);
  const [todayPrayerLogs, setTodayPrayerLogs] = useState<Record<string, string>>({});
  const [dhikrTotal, setDhikrTotal] = useState<number>(0);
  const [topCounter, setTopCounter] = useState<{ name: string; phraseArabic?: string; count: number; targetCount?: number } | null>(null);
  const [latestBookmark, setLatestBookmark] = useState<{ surahId: number; verseNumber: number } | null>(null);

  // Fetch calendar data (today's date + upcoming events)
  // Client-side fetch refines with local timezone adjustment (loader uses UTC)
  useEffect(() => {
    // Compute "today" client-side to avoid server UTC clock mismatch
    const localToday = getLocalDateString();

    const calendarAdjust = getCalendarAdjust();

    // Always refine Hijri date client-side with timezone-aware conversion
    calendarAPI
      .convertToHijri(localToday, undefined, calendarAdjust)
      .then((res) => {
        const payload = res.data?.data || res.data;
        const h = payload?.hijri || payload;
        if (h) {
          const day = h.hijriDay || h.day || h.date || "";
          const month =
            h.hijriMonthName || h.monthName || h.month_name || h.month?.en || h.month?.name || "";
          const year = h.hijriYear || h.year || "";
          if (day && year) {
            setHijriDate(`${day} ${month} ${year} AH`);
          }
        }
      })
      .catch(() => {});

    // Fetch events from getToday (events data is still useful)
    calendarAPI
      .getToday(undefined, calendarAdjust)
      .then((res) => {
        const payload = res.data?.data || res.data;
        const h = payload?.hijri || payload;
        if (h?.events && h.events.length > 0) {
          setTodayEvents(h.events);
        }
      })
      .catch(() => {});

    // Upcoming events — skip if loader already provided data
    if (!loaderData?.upcomingEvents?.length) {
      setEventsLoading(true);
      calendarAPI
        .getUpcomingEvents(90, undefined, calendarAdjust)
        .then((res) => {
          const data = res.data?.data || res.data;
          const eventsList = Array.isArray(data) ? data : data?.events || [];
          setUpcomingEvents(eventsList.slice(0, 5));
        })
        .catch(() => {})
        .finally(() => setEventsLoading(false));
    }
  }, []);

  // Asma ul Husna — daily name (with fallback from full list by day of year)
  // Skip client-side fetch for daily name if loader already provided it
  useEffect(() => {
    const mapApiToDaily = (raw: any): DailyName | null => {
      if (!raw || typeof raw !== "object") return null;
      const d = raw as Record<string, unknown>;
      const nameArabic = (d.nameArabic ?? d.name_arabic ?? "") as string;
      const name = (d.nameEnglish ?? d.name ?? "") as string;
      const transliteration = (d.nameTranslit ?? d.name_translit ?? "") as string;
      const meaning = (d.meaning ?? "") as string;
      if (!name && !nameArabic) return null;
      return { nameArabic, name, transliteration, meaning };
    };

    if (!loaderData?.dailyName) {
      setDailyNameLoading(true);
      Promise.allSettled([namesAPI.getDailyName(), namesAPI.getAllNames()])
        .then(([dailyRes, allRes]) => {
          if (dailyRes.status === "fulfilled") {
            const data = dailyRes.value.data?.data ?? dailyRes.value.data;
            const mapped = mapApiToDaily(data);
            if (mapped) {
              setDailyName(mapped);
              return;
            }
          }
          const allData = allRes.status === "fulfilled" ? allRes.value.data : null;
          const list = Array.isArray(allData) ? allData : allData?.data ?? allData?.names ?? [];
          if (list.length > 0) {
            const dayOfYear = Math.floor(
              (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
            );
            const item = list[dayOfYear % list.length] as Record<string, unknown>;
            setDailyName(mapApiToDaily(item) ?? null);
          }
        })
        .finally(() => setDailyNameLoading(false));
    }

    // Fetch Muhammad daily name (not in loader — always client-side)
    muhammadNamesAPI.getDailyName()
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data && typeof data === "object") {
          const d = data as Record<string, unknown>;
          const nameArabic = (d.nameArabic ?? "") as string;
          const name = (d.nameEnglish ?? d.name ?? "") as string;
          const transliteration = (d.nameTranslit ?? "") as string;
          const meaning = (d.meaning ?? "") as string;
          if (name || nameArabic) {
            setMuhammadDailyName({ nameArabic, name, transliteration, meaning });
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch prayer times with Isha auto-advance
  useEffect(() => {
    const fetchPrayers = (lat: number, lng: number, locName: string) => {
      setLocationName(locName);
      const today = new Date().toISOString().split("T")[0];

      prayerAPI
        .getTimes(lat, lng, today)
        .then((res) => {
          const apiData = res.data?.data || res.data;
          const normalized = normalizePrayerTimes(apiData);

          // Check if past Isha — fetch tomorrow
          if (normalized.Isha) {
            const now = new Date();
            const [h, m] = normalized.Isha.split(":").map(Number);
            const ishaTime = new Date();
            ishaTime.setHours(h, m, 0, 0);

            if (now > ishaTime) {
              setIsPastIsha(true);
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split("T")[0];

              prayerAPI
                .getTimes(lat, lng, tomorrowStr)
                .then((nextRes) => {
                  const nextData = nextRes.data?.data || nextRes.data;
                  setPrayerTimes(normalizePrayerTimes(nextData));
                })
                .catch(() => setPrayerTimes(normalized));
              return;
            }
          }

          setIsPastIsha(false);
          setPrayerTimes(normalized);
        })
        .catch(() => {});
    };

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchPrayers(latitude, longitude, `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
      },
      () => {
        fetchPrayers(21.4225, 39.8262, "Mecca, SA");
      }
    );
  }, []);

  // Find next prayer
  useEffect(() => {
    if (!prayerTimes) return;

    const findNext = () => {
      const now = new Date();
      for (const name of PRAYER_NAMES) {
        const timeStr = (prayerTimes as any)[name] || (prayerTimes as any)[name.toLowerCase()];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(":").map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(h, m, 0, 0);
        if (prayerDate > now) {
          setNextPrayer({ name, time: timeStr });
          return;
        }
      }
      const fajrTime = (prayerTimes as any).Fajr || (prayerTimes as any).fajr || "05:00";
      setNextPrayer({ name: "Fajr", time: fajrTime });
    };

    findNext();
    const interval = setInterval(findNext, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  // Countdown timer
  useEffect(() => {
    if (!nextPrayer) return;

    const updateCountdown = () => {
      const now = new Date();
      const [h, m] = nextPrayer.time.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  // Fetch personalized dashboard data for logged-in users
  useEffect(() => {
    if (!isAuthenticated) return;

    const today = getLocalDateString();

    // Prayer stats + today's logs
    Promise.allSettled([
      prayerAPI.getStats(),
      prayerAPI.getLogs(today, today),
    ]).then(([statsRes, logsRes]) => {
      if (statsRes.status === "fulfilled") {
        const data = statsRes.value.data?.data ?? statsRes.value.data;
        setPrayerStreak(data?.streak ?? data?.currentStreak ?? data?.current_streak ?? 0);
      }
      if (logsRes.status === "fulfilled") {
        const data = logsRes.value.data?.data ?? logsRes.value.data;
        const logs = Array.isArray(data) ? data : [];
        const logMap: Record<string, string> = {};
        logs.forEach((log: any) => {
          const name = (log.prayerName || log.prayer_name || "").toLowerCase();
          logMap[name] = log.status;
        });
        setTodayPrayerLogs(logMap);
      }
    });

    // Dhikr stats + counters
    Promise.allSettled([
      dhikrAPI.getStats(),
      dhikrAPI.getCounters(),
    ]).then(([statsRes, countersRes]) => {
      if (statsRes.status === "fulfilled") {
        const data = statsRes.value.data?.data ?? statsRes.value.data;
        setDhikrTotal(data?.totalCount ?? data?.totalDhikr ?? 0);
      }
      if (countersRes.status === "fulfilled") {
        const data = countersRes.value.data?.data ?? countersRes.value.data;
        const counters = Array.isArray(data) ? data : [];
        if (counters.length > 0) {
          setTopCounter(counters[0]);
        }
      }
    });

    // Latest Quran bookmark
    quranAPI.getBookmarks()
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const bookmarks = Array.isArray(data) ? data : [];
        if (bookmarks.length > 0) {
          const latest = bookmarks[0];
          setLatestBookmark({ surahId: latest.surahId, verseNumber: latest.verseNumber });
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Siraat - Your Spiritual Companion",
        "description": "A comprehensive Islamic spiritual companion with prayer times, Quran reader, dhikr counter, and more.",
        "url": "https://www.siraat.website"
      }} />
      {/* Hero Section */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Greeting */}
            <div className="animate-fade-in-up">
              <p className="font-amiri text-white/80 text-lg mb-1">{getGreetingArabic()}</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3 leading-tight">
                {getGreeting()}
                <span className="block text-base sm:text-lg font-medium font-jakarta text-white/80 mt-2">
                  Siraat — Your Islamic Spiritual Companion
                </span>
              </h1>

              {/* Today's Date Info */}
              <div className="space-y-1 mb-6">
                {hijriDate && (
                  <p className="text-white/90 text-sm sm:text-base flex items-center gap-2">
                    <Calendar size={16} className="text-gold-light" />
                    {hijriDate}
                  </p>
                )}
                <p className="text-white/90 text-xs sm:text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  {new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date())}
                </p>
              </div>

              {/* Today's Events */}
              {todayEvents.length > 0 && (
                <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-white/90 text-[11px] uppercase tracking-wider mb-1.5">
                    Today's Events
                  </p>
                  {todayEvents.map((event: any, i: number) => (
                    <p key={i} className="text-white/90 text-sm">
                      {event.name || event}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-lg mb-8">
                Your comprehensive spiritual companion. Track prayers, read Quran, count dhikr, and
                stay connected to your faith.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/prayers"
                  className="inline-flex items-center gap-2 bg-white text-primary-dark font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all text-sm shadow-lg"
                >
                  <Clock size={16} />
                  Prayer Times
                </Link>
                <Link
                  to="/quran"
                  className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm border border-white/20"
                >
                  <BookOpen size={16} />
                  Read Quran
                </Link>
              </div>
            </div>

            {/* Right - Next Prayer Card */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/15">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white/90 text-xs uppercase tracking-wider font-semibold">
                        Next Prayer
                      </p>
                      {isPastIsha && (
                        <span className="text-[11px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full">
                          Tomorrow
                        </span>
                      )}
                    </div>
                    <p className="text-white text-2xl sm:text-3xl font-bold mt-1">
                      {nextPrayer?.name || "—"}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Clock size={24} className="text-gold-light" />
                  </div>
                </div>

                {countdown && (
                  <div className="mb-6">
                    <p className="text-white/90 text-xs mb-2 uppercase tracking-wider">
                      Countdown
                    </p>
                    <div className="flex gap-2">
                      {countdown.split(":").map((unit, i) => (
                        <div key={i} className="bg-white/10 rounded-xl px-4 py-3 text-center flex-1">
                          <span className="text-white text-2xl sm:text-3xl font-bold tabular-nums">
                            {unit}
                          </span>
                          <p className="text-white/90 text-[11px] uppercase mt-0.5">
                            {["hrs", "min", "sec"][i]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Prayer Times */}
                {prayerTimes && (
                  <div className="space-y-2">
                    {PRAYER_NAMES.map((name) => {
                      const time =
                        (prayerTimes as any)[name] || (prayerTimes as any)[name.toLowerCase()];
                      const isNext = nextPrayer?.name === name;
                      const isPassed = (() => {
                        if (!time || isPastIsha) return false;
                        const [h, m] = time.split(":").map(Number);
                        const now = new Date();
                        const t = new Date();
                        t.setHours(h, m, 0, 0);
                        return now > t;
                      })();

                      return (
                        <div
                          key={name}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                            isNext
                              ? "bg-white/15 text-white font-semibold"
                              : isPassed
                              ? "text-white/80"
                              : "text-white/90"
                          }`}
                        >
                          <span>{name}</span>
                          <span className="tabular-nums">{time ? formatTo12h(time) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <MapPin size={12} />
                    {locationName}
                  </div>
                  <Link
                    to="/prayers"
                    className="text-xs text-white/90 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Names of the Day — two side-by-side cards */}
      <section className="container-faith -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <DailyNameCard
            to="/names"
            label="Name of Allah"
            icon={<Sparkles size={20} />}
            iconColor="text-primary"
            iconBg="bg-primary/10 group-hover:bg-primary"
            name={dailyName}
            loading={dailyNameLoading}
          />
          <DailyNameCard
            to="/names/muhammad"
            label="Name of the Prophet ﷺ"
            icon={<Star size={20} />}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10 group-hover:bg-amber-500"
            name={muhammadDailyName}
            loading={dailyNameLoading}
            animationDelay="0.06s"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="card-elevated p-4 sm:p-5 text-center group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-text">{feature.title}</h3>
                <p className="text-xs text-text-muted mt-1 hidden sm:block line-clamp-2">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Logged-in dashboard */}
        {isAuthenticated && (
          <div className="mt-6 md:mt-8">
            <div className="section-header mb-4">
              <div>
                <h2 className="section-title">Your Dashboard</h2>
                <p className="section-subtitle">Today's spiritual overview</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Prayer streak card */}
              <Link to="/prayers" className="card-elevated p-5 group hover:border-primary/20 transition-all">
                {/* Streak header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                      Prayer Streak
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text tabular-nums">{prayerStreak}</span>
                      <span className="text-sm text-text-muted">days</span>
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${prayerStreak > 0 ? "bg-amber-500/10" : "bg-border-light"}`}>
                    <Flame size={20} className={prayerStreak > 0 ? "text-amber-500" : "text-text-muted"} />
                  </div>
                </div>

                {/* Today's prayers */}
                <div className="border-t border-border-light pt-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                      Today
                    </p>
                    <p className="text-[11px] text-text-muted tabular-nums">
                      {Object.keys(todayPrayerLogs).length}/5 prayed
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { key: "fajr", label: "Fajr" },
                      { key: "dhuhr", label: "Dhuhr" },
                      { key: "asr", label: "Asr" },
                      { key: "maghrib", label: "Mghrb" },
                      { key: "isha", label: "Isha" },
                    ].map(({ key, label }) => {
                      const status = todayPrayerLogs[key];
                      const logged = !!status;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-full h-2 rounded-full transition-colors ${
                              status === "on_time" ? "bg-success" :
                              status === "late" ? "bg-amber-400" :
                              status === "qada" ? "bg-orange-400" :
                              "bg-border-light"
                            }`}
                          />
                          <span className={`text-[11px] font-medium truncate w-full text-center ${logged ? "text-text-secondary" : "text-text-muted"}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Link>

              {/* Dhikr counter card */}
              <Link to="/dhikr" className="card-elevated p-5 group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Moon size={18} className="text-purple-500" />
                  </div>
                  <span className="text-2xl font-bold text-text tabular-nums">
                    {dhikrTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text mb-1">Total Dhikr</p>
                {topCounter ? (
                  <>
                    <p className="text-xs text-text-muted mb-2">
                      Active: {topCounter.name}
                    </p>
                    <div className="w-full bg-border-light h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((topCounter.count || 0) / (topCounter.targetCount || 33)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1.5">
                      {topCounter.count || 0} / {topCounter.targetCount || 33}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">Start counting dhikr</p>
                )}
              </Link>

              {/* Last read Quran / resume */}
              <Link
                to={latestBookmark ? `/quran/${latestBookmark.surahId}?verse=${latestBookmark.verseNumber}` : "/quran"}
                className="card-elevated p-5 group hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-amber-500" />
                  </div>
                  <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold text-text mb-1">
                  {latestBookmark ? "Resume Quran" : "Read Quran"}
                </p>
                {latestBookmark ? (
                  <p className="text-xs text-text-muted">
                    Last bookmarked: Surah {latestBookmark.surahId}, Verse {latestBookmark.verseNumber}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">Browse all 114 Surahs</p>
                )}
                <div className="mt-3">
                  <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg">
                    {latestBookmark ? "Continue reading →" : "Start reading →"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Feelings Widget - Premium Feature */}
      <section className="container-faith py-12 md:py-16 -mb-8">
        <div className="section-header">
          <div>
            <h2 className="section-title">Inner Peace</h2>
            <p className="section-subtitle">A spiritual guide for your emotions</p>
          </div>
        </div>
        <FeelingsWidget />
      </section>

      {/* Daily Inspiration + Upcoming Events */}
      <section className="container-faith py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Daily Verse */}
          <div className="lg:col-span-2">
            <div className="section-header">
              <div>
                <h2 className="section-title">Daily Inspiration</h2>
                <p className="section-subtitle">Start your day with guidance</p>
              </div>
            </div>
            <DailyInspirationCard />
          </div>

          {/* Sidebar - Upcoming Events from API */}
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">Coming Up</h2>
                <p className="section-subtitle">Islamic events</p>
              </div>
              <Link
                to="/calendar"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                All <ChevronRight size={14} />
              </Link>
            </div>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((item: any, i: number) => {
                  const evt = item.event || item;
                  const daysUntil = item.daysUntil;
                  return (
                    <div key={evt.id || i} className="card p-4 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
                        <Star size={16} className="text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-text">{evt.name}</h4>
                          {evt.nameArabic && (
                            <span className="font-amiri text-sm text-text-muted">
                              {evt.nameArabic}
                            </span>
                          )}
                        </div>
                        {evt.description && (
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                            {evt.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          {(evt.hijriDay || evt.hijriMonth) && (
                            <p className="text-[11px] text-text-muted">
                              {evt.hijriDay} {evt.hijriMonth}
                            </p>
                          )}
                          {daysUntil !== undefined && (
                            <p className="text-[11px] text-primary font-medium">
                              {daysUntil === 0 ? "Today" : `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <UpcomingEventCard
                  name="Ramadan"
                  arabicName="رمضان"
                  description="The blessed month of fasting"
                  icon={<Star size={16} className="text-gold" />}
                />
                <UpcomingEventCard
                  name="Laylat al-Qadr"
                  arabicName="ليلة القدر"
                  description="The Night of Decree"
                  icon={<Moon size={16} className="text-purple-500" />}
                />
                <UpcomingEventCard
                  name="Eid al-Fitr"
                  arabicName="عيد الفطر"
                  description="Festival of breaking the fast"
                  icon={<Sparkles size={16} className="text-amber-500" />}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explore Features */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="section-header">
          <div>
            <h2 className="section-title">Explore Features</h2>
            <p className="section-subtitle">Everything you need for your spiritual journey</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 stagger-children">
          <FeatureCard
            icon={<Clock size={22} />}
            title="Prayer Times"
            description="Get accurate prayer times based on your location with real-time countdown and notifications."
            link="/prayers"
            badge="Essential"
          />
          <FeatureCard
            icon={<BookOpen size={22} />}
            title="Quran Reader"
            description="Browse all 114 Surahs with Arabic text, translations, search, and bookmarks."
            link="/quran"
            badge="Essential"
          />
          <FeatureCard
            icon={<Moon size={22} />}
            title="Dhikr Counter"
            description="Create counters for different adhkar, set daily goals, and track your progress."
            link="/dhikr"
            badge="Popular"
          />
          <FeatureCard
            icon={<Calendar size={22} />}
            title="Islamic Calendar"
            description="View Hijri dates, convert between calendars, and never miss an important Islamic event."
            link="/calendar"
          />
          <FeatureCard
            icon={<Compass size={22} />}
            title="Qibla Finder"
            description="Find the precise direction to the Kaaba from anywhere in the world using your device."
            link="/qibla"
          />
          <FeatureCard
            icon={<Star size={22} />}
            title="Prayer Tracking"
            description="Log your daily prayers, track your streak, and see your completion statistics."
            link="/prayers"
            badge="New"
          />
        </div>
      </section>

      {/* Why Siraat */}
      <section className="container-faith py-10 md:py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text mb-6">Your Complete Islamic Companion</h2>
          <div className="space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Siraat is a free, ad-free, and privacy-respecting Islamic companion built for the global Muslim Ummah. Whether you are observing your five daily prayers at home, reading Quran during your commute, or counting dhikr before bed, Siraat brings every essential tool together in one place so you can focus entirely on your worship without distractions or interruptions.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Accuracy matters when it comes to acts of worship. Siraat calculates prayer times using internationally recognized methods including the Islamic Society of North America (ISNA), the Muslim World League (MWL), and the Egyptian General Authority of Survey, ensuring reliable schedules no matter where you are. The built-in Quran reader features the trusted Saheeh International English translation alongside clear Arabic script, while the Islamic calendar provides precise Hijri date conversion so you never miss the start of Ramadan, Eid, or any significant occasion.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Beyond the essentials, Siraat offers a comprehensive dhikr counter with customizable goals and progress tracking, a Qibla finder that works from anywhere in the world using your device compass, and a curated collection of daily duas and Names of Allah to deepen your connection with your faith. Every feature is designed with simplicity and sincerity, giving Muslims of all ages and backgrounds a dependable companion on the path to spiritual growth.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function DailyNameCard({
  to,
  label,
  icon,
  iconColor,
  iconBg,
  name,
  loading,
  animationDelay,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  name: DailyName | null;
  loading: boolean;
  animationDelay?: string;
}) {
  return (
    <Link
      to={to}
      className="card-elevated p-5 flex items-center gap-4 group animate-fade-in-up"
      style={animationDelay ? { animationDelay } : undefined}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 transition-colors`}
      >
        <span className={`${iconColor} group-hover:text-white transition-colors`}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          {label}
        </p>
        {loading ? (
          <>
            <div className="h-4 w-20 bg-border-light rounded animate-pulse mb-1.5" />
            <div className="h-3 w-32 bg-border-light rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-border-light rounded animate-pulse" />
          </>
        ) : name ? (
          <>
            <p className="font-amiri text-xl text-text leading-snug mb-0.5 text-right" dir="rtl">
              {name.nameArabic}
            </p>
            <p className="text-sm font-semibold text-text truncate">{name.name}</p>
            <p className="text-xs text-text-muted mt-0.5 truncate">{name.transliteration}</p>
          </>
        ) : (
          <>
            <div className="h-4 w-16 bg-border-light rounded mb-1.5" />
            <div className="h-3 w-28 bg-border-light rounded mb-1" />
            <div className="h-3 w-20 bg-border-light rounded" />
          </>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={15}
        className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </Link>
  );
}

function UpcomingEventCard({
  name,
  arabicName,
  description,
  icon,
}: {
  name: string;
  arabicName: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-4 flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-text">{name}</h4>
          <span className="font-amiri text-sm text-text-muted">{arabicName}</span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  link,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  badge?: string;
}) {
  return (
    <Link to={link} className="card-elevated p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          {icon}
        </div>
        {badge && <span className="badge badge-primary">{badge}</span>}
      </div>
      <h3 className="text-base font-semibold text-text mb-1.5 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Explore <ChevronRight size={14} />
      </div>
    </Link>
  );
}

function DailyInspirationCard() {
  const [inspiration, setInspiration] = useState<{
    text: string;
    source: string;
    arabic?: string;
    translation?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyInspiration()
      .then(setInspiration)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-6 sm:p-8 flex items-center justify-center min-h-50">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!inspiration) {
    // Fallback UI if fetch fails or no results
    return (
        <div className="card-elevated p-6 sm:p-8 pattern-islamic">
            <div className="relative">
            <Sparkles size={20} className="text-gold mb-4" />
            <blockquote
                className="font-amiri text-2xl sm:text-3xl text-text leading-relaxed mb-4 text-right"
                dir="rtl"
            >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </blockquote>
            <p className="text-text-secondary text-base leading-relaxed mb-2">
                "In the name of Allah, the Most Gracious, the Most Merciful."
            </p>
            <p className="text-text-muted text-sm">Surah Al-Fatihah 1:1</p>
            <div className="mt-6 flex gap-3">
                <Link to="/quran" className="btn-primary text-sm">
                Read Quran
                <ArrowRight size={14} />
                </Link>
            </div>
            </div>
        </div>
    );
  }

  return (
    <div className="card-elevated p-6 sm:p-8 pattern-islamic">
      <div className="relative">
        <Sparkles size={20} className="text-gold mb-4" />
        {inspiration.arabic && (
            <blockquote
            className="font-amiri text-2xl sm:text-3xl text-text leading-relaxed mb-4 text-right"
            dir="rtl"
            >
            {inspiration.arabic}
            </blockquote>
        )}
        <p className="text-text-secondary text-base leading-relaxed mb-2">
          "{inspiration.translation || inspiration.text}"
        </p>
        <p className="text-text-muted text-sm">{inspiration.source}</p>
        <div className="mt-6 flex gap-3">
          <Link to="/quran" className="btn-primary text-sm">
            Read Quran
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

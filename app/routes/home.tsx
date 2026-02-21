import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
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
} from "lucide-react";
import { prayerAPI, calendarAPI, namesAPI } from "~/services/api";
import { getDailyInspiration } from "~/utils/dailyInspiration";
import { FeelingsWidget } from "~/components/FeelingsWidget";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FaithApp - Your Spiritual Companion" },
    {
      name: "description",
      content:
        "A comprehensive Islamic spiritual companion with prayer times, Quran reader, dhikr counter, and more.",
    },
  ];
}

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

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [hijriDate, setHijriDate] = useState<string>("");
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [locationName, setLocationName] = useState("Locating...");
  const [isPastIsha, setIsPastIsha] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [dailyName, setDailyName] = useState<DailyName | null>(null);
  const [dailyNameLoading, setDailyNameLoading] = useState(true);

  // Fetch calendar data (today's date + upcoming events)
  useEffect(() => {
    // Compute "today" client-side to avoid server UTC clock mismatch
    const localToday = getLocalDateString();

    // Get accurate Hijri date by converting the real local date
    calendarAPI
      .convertToHijri(localToday)
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
      .getToday()
      .then((res) => {
        const payload = res.data?.data || res.data;
        const h = payload?.hijri || payload;
        if (h?.events && h.events.length > 0) {
          setTodayEvents(h.events);
        }
      })
      .catch(() => {});

    // Upcoming events from API
    setEventsLoading(true);
    calendarAPI
      .getUpcomingEvents(90)
      .then((res) => {
        const data = res.data?.data || res.data;
        const eventsList = Array.isArray(data) ? data : data?.events || [];
        setUpcomingEvents(eventsList.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  // Asma ul Husna — daily name (with fallback from full list by day of year)
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

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero Section */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Greeting */}
            <div className="animate-fade-in-up">
              <p className="font-amiri text-white/70 text-lg mb-1">{getGreetingArabic()}</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3 leading-tight">
                {getGreeting()}
              </h1>

              {/* Today's Date Info */}
              <div className="space-y-1 mb-6">
                {hijriDate && (
                  <p className="text-white/80 text-sm sm:text-base flex items-center gap-2">
                    <Calendar size={16} className="text-gold-light" />
                    {hijriDate}
                  </p>
                )}
                <p className="text-white/50 text-xs sm:text-sm flex items-center gap-2">
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
                  <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                    Today's Events
                  </p>
                  {todayEvents.map((event: any, i: number) => (
                    <p key={i} className="text-white/80 text-sm">
                      {event.name || event}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg mb-8">
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
                      <p className="text-white/60 text-xs uppercase tracking-wider font-semibold">
                        Next Prayer
                      </p>
                      {isPastIsha && (
                        <span className="text-[10px] bg-white/20 text-white/70 px-2 py-0.5 rounded-full">
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
                    <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">
                      Countdown
                    </p>
                    <div className="flex gap-2">
                      {countdown.split(":").map((unit, i) => (
                        <div key={i} className="bg-white/10 rounded-xl px-4 py-3 text-center flex-1">
                          <span className="text-white text-2xl sm:text-3xl font-bold tabular-nums">
                            {unit}
                          </span>
                          <p className="text-white/40 text-[10px] uppercase mt-0.5">
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
                              ? "text-white/30"
                              : "text-white/60"
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
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <MapPin size={12} />
                    {locationName}
                  </div>
                  <Link
                    to="/prayers"
                    className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asma ul Husna — daily name widget */}
      <section className="container-faith -mt-6 relative z-10">
        <Link
          to="/names"
          className="card-elevated p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 group animate-fade-in-up"
        >
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Sparkles size={22} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                Asma ul Husna
              </p>
              {dailyNameLoading ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading today's name...</span>
                </div>
              ) : dailyName ? (
                <>
                  <p className="font-amiri text-xl sm:text-2xl text-text mb-0.5" dir="rtl">
                    {dailyName.nameArabic}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-text">
                    {dailyName.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {dailyName.transliteration} — {dailyName.meaning}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">Reflect on the 99 Names of Allah</p>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-primary flex items-center gap-1 shrink-0 self-start sm:self-center group-hover:gap-2 transition-all">
            View all <ChevronRight size={14} />
          </span>
        </Link>

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
                            <p className="text-[10px] text-text-muted">
                              {evt.hijriDay} {evt.hijriMonth}
                            </p>
                          )}
                          {daysUntil !== undefined && (
                            <p className="text-[10px] text-primary font-medium">
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

      {/* CTA — only for guests (footer handles this for authenticated users) */}
      {!isAuthenticated && (
        <section className="bg-hero-gradient text-white pattern-islamic">
          <div className="container-faith py-14 md:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-playfair mb-4 max-w-2xl mx-auto">
              Begin Your Spiritual Journey Today
            </h2>
            <p className="text-white/70 text-base sm:text-lg max-w-lg mx-auto mb-8">
              Create a free account to sync your progress, save bookmarks, and personalize your
              experience.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-primary-dark font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-lg"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/25 transition-all border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
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
      <div className="card-elevated p-6 sm:p-8 flex items-center justify-center min-h-[200px]">
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

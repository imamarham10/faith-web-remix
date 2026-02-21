import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
  MapPin,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  TrendingUp,
  ChevronDown,
  Search,
  LocateFixed,
  Flame,
  BarChart3,
  History,
  AlertCircle,
} from "lucide-react";
import { prayerAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const PRAYER_META: Record<string, { icon: typeof Sun; gradient: string; label: string }> = {
  Fajr: { icon: Sunrise, gradient: "from-indigo-500 to-blue-600", label: "Dawn" },
  Dhuhr: { icon: Sun, gradient: "from-amber-400 to-yellow-500", label: "Midday" },
  Asr: { icon: Sun, gradient: "from-orange-400 to-amber-500", label: "Afternoon" },
  Maghrib: { icon: Sunset, gradient: "from-pink-500 to-rose-600", label: "Sunset" },
  Isha: { icon: Moon, gradient: "from-violet-500 to-purple-600", label: "Night" },
};

interface CityOption {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

const POPULAR_CITIES: CityOption[] = [
  { name: "Mecca", country: "Saudi Arabia", lat: 21.4225, lng: 39.8262 },
  { name: "Medina", country: "Saudi Arabia", lat: 24.4672, lng: 39.6024 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.5433, lng: 39.1728 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773 },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531 },
  { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
  { name: "Muscat", country: "Oman", lat: 23.588, lng: 58.3829 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869 },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011 },
  { name: "Lahore", country: "Pakistan", lat: 31.5204, lng: 74.3587 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867 },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Amman", country: "Jordan", lat: 31.9454, lng: 35.9284 },
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.389 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
];

/** Parse time from API response — handles ISO timestamps, HH:mm, HH:mm:ss */
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

/** Convert HH:mm to 12-hour format */
function formatTo12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Normalize API prayer time response into { PrayerName: "HH:mm" } */
function normalizePrayerTimes(apiData: any): Record<string, string> {
  const raw = apiData?.times || apiData?.timings || apiData || {};
  const normalized: Record<string, string> = {};
  Object.entries(raw).forEach(([key, val]) => {
    let k = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    if (k === "Zuhr") k = "Dhuhr";
    if (k === "Sunrise" || k === "Sunset" || k === "Midnight" || k === "Imsak") return;
    const parsed = parseTimeToHHMM(val as string);
    if (parsed) normalized[k] = parsed;
  });
  return normalized;
}

export default function PrayersPage() {
  const { user } = useAuth();
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Select Location");
  const [nextPrayer, setNextPrayer] = useState<string>("Fajr");
  const [countdown, setCountdown] = useState({ h: "00", m: "00", s: "00" });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const [isPastIsha, setIsPastIsha] = useState(false);
  const [loggedPrayers, setLoggedPrayers] = useState<Set<string>>(new Set());

  // Current prayer from API
  const [currentPrayer, setCurrentPrayer] = useState<any>(null);

  // Stats from API
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Prayer logs from API
  const [prayerLogs, setPrayerLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Log status picker
  const [showStatusPicker, setShowStatusPicker] = useState<string | null>(null);

  // Active tab for bottom section
  const [activeTab, setActiveTab] = useState<"progress" | "stats" | "history">("progress");

  // Location dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationName(
          `My Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`
        );
        setDetectingLocation(false);
        setShowLocationDropdown(false);
      },
      () => {
        setLocation({ lat: 21.4225, lng: 39.8262 });
        setLocationName("Mecca, Saudi Arabia");
        setDetectingLocation(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const selectCity = (city: CityOption) => {
    setLocation({ lat: city.lat, lng: city.lng });
    setLocationName(`${city.name}, ${city.country}`);
    setShowLocationDropdown(false);
    setCitySearch("");
  };

  // Fetch prayer times (with auto-advance to next day if past Isha)
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setError(null);

    const isUserSelectingToday =
      format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    prayerAPI
      .getTimes(location.lat, location.lng, dateStr)
      .then((res) => {
        const apiData = res.data?.data || res.data;
        const normalized = normalizePrayerTimes(apiData);

        // Check if we're past Isha — if so, fetch tomorrow's times
        if (isUserSelectingToday && normalized.Isha) {
          const now = new Date();
          const [h, m] = normalized.Isha.split(":").map(Number);
          const ishaTime = new Date();
          ishaTime.setHours(h, m, 0, 0);

          if (now > ishaTime) {
            setIsPastIsha(true);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDateStr = format(nextDay, "yyyy-MM-dd");

            prayerAPI
              .getTimes(location.lat, location.lng, nextDateStr)
              .then((nextRes) => {
                const nextApiData = nextRes.data?.data || nextRes.data;
                setTimings(normalizePrayerTimes(nextApiData));
                setDisplayedDate(nextDay);
              })
              .catch(() => {
                setTimings(normalized);
                setDisplayedDate(selectedDate);
              })
              .finally(() => setLoading(false));
            return;
          }
        }

        setIsPastIsha(false);
        setTimings(normalized);
        setDisplayedDate(selectedDate);
      })
      .catch(() => setError("Failed to fetch prayer times."))
      .finally(() => setLoading(false));
  }, [location, selectedDate]);

  // Fetch current prayer info from API
  useEffect(() => {
    if (!location) return;
    prayerAPI
      .getCurrent(location.lat, location.lng)
      .then((res) => {
        const data = res.data?.data || res.data;
        setCurrentPrayer(data);
      })
      .catch(() => {});
  }, [location]);

  // Fetch prayer stats (authenticated users only)
  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    prayerAPI
      .getStats()
      .then((res) => {
        const data = res.data?.data || res.data;
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user]);

  // Fetch prayer logs (authenticated users only)
  useEffect(() => {
    if (!user) return;
    setLogsLoading(true);
    // Fetch last 30 days of logs
    const endDate = format(new Date(), "yyyy-MM-dd");
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startDate = format(start, "yyyy-MM-dd");
    prayerAPI
      .getLogs(startDate, endDate)
      .then((res) => {
        const data = res.data?.data || res.data;
        const logs = Array.isArray(data) ? data : data?.logs || [];
        setPrayerLogs(logs);

        // Mark today's logged prayers
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const todayLogs = logs.filter(
          (log: any) => log.date === todayStr || log.date?.startsWith(todayStr)
        );
        const loggedNames = new Set<string>(
          todayLogs.map((log: any) => {
            const name = log.prayerName || log.prayer_name || "";
            return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          })
        );
        setLoggedPrayers(loggedNames);
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [user]);

  // Find next prayer
  useEffect(() => {
    if (!timings) return;
    const findNext = () => {
      const now = new Date();
      for (const name of PRAYER_NAMES) {
        const t = timings[name];
        if (!t) continue;
        const [h, m] = t.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        if (d > now) {
          setNextPrayer(name);
          return;
        }
      }
      setNextPrayer("Fajr");
    };
    findNext();
    const iv = setInterval(findNext, 60000);
    return () => clearInterval(iv);
  }, [timings]);

  // Countdown timer
  useEffect(() => {
    if (!timings || !nextPrayer) return;
    const update = () => {
      const t = timings[nextPrayer];
      if (!t) return;
      const now = new Date();
      const [h, m] = t.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      setCountdown({
        h: Math.floor(diff / 3600000)
          .toString()
          .padStart(2, "0"),
        m: Math.floor((diff % 3600000) / 60000)
          .toString()
          .padStart(2, "0"),
        s: Math.floor((diff % 60000) / 1000)
          .toString()
          .padStart(2, "0"),
      });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [timings, nextPrayer]);

  const handleLogPrayer = useCallback(
    async (name: string, status: "on_time" | "late" | "qada" = "on_time") => {
      if (!user) return;
      try {
        await prayerAPI.logPrayer(
          name.toLowerCase(),
          format(displayedDate, "yyyy-MM-dd"),
          status
        );
        setLoggedPrayers((prev) => new Set(prev).add(name));
        setShowStatusPicker(null);
        // Refresh stats
        prayerAPI
          .getStats()
          .then((res) => setStats(res.data?.data || res.data))
          .catch(() => {});
      } catch {}
    },
    [user, displayedDate]
  );

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const filteredCities = citySearch.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
          c.country.toLowerCase().includes(citySearch.toLowerCase())
      )
    : POPULAR_CITIES;

  // Group logs by date for history view
  const groupedLogs = prayerLogs.reduce(
    (acc: Record<string, any[]>, log: any) => {
      const date = log.date?.split("T")[0] || log.date || "unknown";
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const sortedLogDates = Object.keys(groupedLogs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-prayer text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in-up">
              {/* Location Selector */}
              <div className="relative mb-4" ref={dropdownRef}>
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-xl border border-white/10"
                >
                  <MapPin size={14} />
                  <span className="max-w-[240px] truncate">{locationName}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLocationDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-border-light z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-3 border-b border-border-light">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="Search city..."
                          className="input-with-left-icon w-full pr-3 py-2.5 text-sm text-text bg-bg rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      onClick={detectCurrentLocation}
                      disabled={detectingLocation}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-medium hover:bg-primary/5 transition-colors border-b border-border-light"
                    >
                      {detectingLocation ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LocateFixed size={16} />
                      )}
                      {detectingLocation ? "Detecting..." : "Use My Current Location"}
                    </button>

                    <div className="max-h-64 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={`${city.name}-${city.country}`}
                          onClick={() => selectCity(city)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/2 transition-colors"
                        >
                          <MapPin size={14} className="text-text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate">{city.name}</p>
                            <p className="text-xs text-text-muted">{city.country}</p>
                          </div>
                        </button>
                      ))}
                      {filteredCities.length === 0 && (
                        <p className="text-center text-sm text-text-muted py-6">No cities found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair mb-2">
                Prayer Times
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-white/60 text-sm">
                  {format(displayedDate, "EEEE, d MMMM yyyy")}
                </p>
                {isPastIsha && (
                  <span className="inline-block bg-white/20 text-white/80 text-xs px-2.5 py-1 rounded-full font-medium">
                    Tomorrow (past Isha)
                  </span>
                )}
              </div>

              {/* Current Prayer Period */}
              {currentPrayer && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 inline-flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">
                      Current Period
                    </p>
                    <p className="text-white text-sm font-semibold">
                      {currentPrayer.currentPrayer ||
                        currentPrayer.current_prayer ||
                        currentPrayer.current ||
                        "—"}
                    </p>
                  </div>
                  {(currentPrayer.nextPrayer || currentPrayer.next_prayer) && (
                    <>
                      <div className="w-px h-8 bg-white/15" />
                      <div>
                        <p className="text-white/50 text-[10px] uppercase tracking-wider">
                          Coming Up
                        </p>
                        <p className="text-white text-sm font-semibold">
                          {currentPrayer.nextPrayer || currentPrayer.next_prayer}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Next Prayer Countdown */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Next Prayer</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-3xl font-bold text-white">{nextPrayer}</p>
                  {timings?.[nextPrayer] && (
                    <span className="text-white/60 text-sm tabular-nums">
                      {formatTo12h(timings[nextPrayer])}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {[
                    { val: countdown.h, label: "hrs" },
                    { val: countdown.m, label: "min" },
                    { val: countdown.s, label: "sec" },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center flex-1">
                      <span className="text-2xl font-bold tabular-nums text-white">{val}</span>
                      <p className="text-[10px] text-white/40 uppercase">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {/* Date Navigator */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => changeDate(-1)}
            className="p-2.5 rounded-xl hover:bg-black/5 transition-colors"
          >
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {isToday ? "Today" : format(selectedDate, "EEE, d MMM yyyy")}
            </p>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-xs text-primary font-medium mt-0.5"
              >
                Go to Today
              </button>
            )}
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2.5 rounded-xl hover:bg-black/5 transition-colors"
          >
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-text-muted text-sm">Loading prayer times...</p>
          </div>
        ) : error && !timings ? (
          <div className="card-elevated p-8 text-center">
            <AlertCircle size={40} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <button onClick={() => setSelectedDate(new Date())} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : timings ? (
          <>
            {/* Prayer Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
              {PRAYER_NAMES.map((name) => {
                const timeHHMM = timings[name];
                const meta = PRAYER_META[name];
                const Icon = meta.icon;
                const isNext = name === nextPrayer && isToday;
                const isLogged = loggedPrayers.has(name);
                const isPassed = (() => {
                  if (!timeHHMM || !isToday) return false;
                  const [h, m] = timeHHMM.split(":").map(Number);
                  const now = new Date();
                  const t = new Date();
                  t.setHours(h, m, 0, 0);
                  return now > t;
                })();

                return (
                  <div
                    key={name}
                    className={`card-elevated p-5 sm:p-6 relative overflow-hidden transition-all ${
                      isNext ? "ring-2 ring-primary ring-offset-2" : ""
                    } ${isPassed && !isNext ? "opacity-60" : ""}`}
                  >
                    {isNext && (
                      <div className="absolute top-3 right-3">
                        <span className="badge badge-primary text-[10px]">Next</span>
                      </div>
                    )}
                    {isPassed && !isNext && isToday && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] text-text-muted font-medium">Passed</span>
                      </div>
                    )}

                    <div
                      className={`w-12 h-12 rounded-2xl bg-linear-to-br ${meta.gradient} flex items-center justify-center mb-4 shadow-sm`}
                    >
                      <Icon size={20} className="text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-text mb-0.5">{name}</h3>
                    <p className="text-xs text-text-muted mb-3">{meta.label}</p>
                    <p className="text-2xl font-bold text-text tabular-nums">
                      {timeHHMM ? formatTo12h(timeHHMM) : "—"}
                    </p>

                    {/* Prayer Log Buttons */}
                    {user && isToday && (
                      <div className="mt-4 relative">
                        {isLogged ? (
                          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-success/10 text-success">
                            <Check size={14} /> Prayed
                          </div>
                        ) : showStatusPicker === name ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider text-center mb-2">
                              Log status
                            </p>
                            {(
                              [
                                { status: "on_time", label: "On Time", color: "bg-success/10 text-success hover:bg-success/20" },
                                { status: "late", label: "Late", color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" },
                                { status: "qada", label: "Qada", color: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20" },
                              ] as const
                            ).map(({ status, label, color }) => (
                              <button
                                key={status}
                                onClick={() => handleLogPrayer(name, status)}
                                className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${color}`}
                              >
                                {label}
                              </button>
                            ))}
                            <button
                              onClick={() => setShowStatusPicker(null)}
                              className="w-full py-1.5 text-[10px] text-text-muted hover:text-text"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowStatusPicker(name)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Mark as Prayed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Location Summary Bar */}
            <div className="mt-6 card-elevated p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">{locationName}</p>
                  <p className="text-xs text-text-muted">
                    {location?.lat.toFixed(4)}°, {location?.lng.toFixed(4)}°
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationDropdown(true)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Change
              </button>
            </div>

            {/* Stats / History Section (Authenticated Only) */}
            {user && (
              <div className="mt-8">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 bg-bg rounded-xl p-1 mb-6">
                  {[
                    { key: "progress" as const, label: "Today", icon: TrendingUp },
                    { key: "stats" as const, label: "Statistics", icon: BarChart3 },
                    { key: "history" as const, label: "History", icon: History },
                  ].map(({ key, label, icon: TabIcon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === key
                          ? "bg-white text-primary shadow-sm"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      <TabIcon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Today's Progress Tab */}
                {activeTab === "progress" && (
                  <div className="card-elevated p-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text">Today's Progress</h3>
                        <p className="text-xs text-text-muted">
                          {loggedPrayers.size} of 5 prayers completed
                        </p>
                      </div>
                      <div className="ml-auto text-2xl font-bold text-primary tabular-nums">
                        {Math.round((loggedPrayers.size / 5) * 100)}%
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 bg-border-light rounded-full mb-6 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(loggedPrayers.size / 5) * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {PRAYER_NAMES.map((name) => (
                        <div key={name} className="text-center">
                          <div
                            className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-1.5 transition-colors ${
                              loggedPrayers.has(name)
                                ? "bg-success text-white"
                                : "bg-border-light text-text-muted"
                            }`}
                          >
                            {loggedPrayers.has(name) ? <Check size={14} /> : <Clock size={12} />}
                          </div>
                          <p className="text-[11px] text-text-muted font-medium">{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === "stats" && (
                  <div className="animate-fade-in-up">
                    {statsLoading ? (
                      <div className="card-elevated p-8 flex flex-col items-center">
                        <Loader2 size={24} className="animate-spin text-primary mb-2" />
                        <p className="text-sm text-text-muted">Loading statistics...</p>
                      </div>
                    ) : stats ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                          label="Total Prayers"
                          value={stats.totalPrayers ?? stats.total_prayers ?? stats.total ?? 0}
                          icon={<Clock size={18} />}
                          color="text-primary bg-primary/10"
                        />
                        <StatCard
                          label="On Time"
                          value={stats.onTimePrayers ?? stats.on_time_prayers ?? stats.onTime ?? 0}
                          icon={<Check size={18} />}
                          color="text-success bg-success/10"
                        />
                        <StatCard
                          label="Current Streak"
                          value={`${stats.currentStreak ?? stats.current_streak ?? stats.streak ?? 0} days`}
                          icon={<Flame size={18} />}
                          color="text-amber-600 bg-amber-500/10"
                        />
                        <StatCard
                          label="Completion Rate"
                          value={`${Math.round(stats.completionRate ?? stats.completion_rate ?? 0)}%`}
                          icon={<TrendingUp size={18} />}
                          color="text-violet-600 bg-violet-500/10"
                        />

                        {/* Detailed Stats Row */}
                        <div className="col-span-2 lg:col-span-4 card-elevated p-6">
                          <h4 className="text-sm font-semibold text-text mb-4">Breakdown</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                                <Check size={18} className="text-success" />
                              </div>
                              <p className="text-lg font-bold text-text tabular-nums">
                                {stats.onTimePrayers ?? stats.on_time_prayers ?? stats.onTime ?? 0}
                              </p>
                              <p className="text-xs text-text-muted">On Time</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                                <Clock size={18} className="text-amber-600" />
                              </div>
                              <p className="text-lg font-bold text-text tabular-nums">
                                {stats.latePrayers ?? stats.late_prayers ?? stats.late ?? 0}
                              </p>
                              <p className="text-xs text-text-muted">Late</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-2">
                                <AlertCircle size={18} className="text-rose-500" />
                              </div>
                              <p className="text-lg font-bold text-text tabular-nums">
                                {stats.qadaPrayers ?? stats.qada_prayers ?? stats.qada ?? 0}
                              </p>
                              <p className="text-xs text-text-muted">Qada</p>
                            </div>
                          </div>

                          {/* Streak Info */}
                          <div className="mt-6 pt-4 border-t border-border-light flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Flame size={16} className="text-amber-500" />
                              <span className="text-sm text-text-secondary">Longest Streak</span>
                            </div>
                            <span className="text-sm font-bold text-text tabular-nums">
                              {stats.longestStreak ?? stats.longest_streak ?? 0} days
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card-elevated p-8 text-center">
                        <BarChart3 size={32} className="text-text-muted mx-auto mb-3" />
                        <p className="text-text-secondary text-sm">
                          Start logging your prayers to see statistics
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                  <div className="animate-fade-in-up">
                    {logsLoading ? (
                      <div className="card-elevated p-8 flex flex-col items-center">
                        <Loader2 size={24} className="animate-spin text-primary mb-2" />
                        <p className="text-sm text-text-muted">Loading prayer history...</p>
                      </div>
                    ) : sortedLogDates.length > 0 ? (
                      <div className="space-y-4">
                        {sortedLogDates.slice(0, 14).map((date) => {
                          const logs = groupedLogs[date];
                          const dateLabel = (() => {
                            const todayStr = format(new Date(), "yyyy-MM-dd");
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yesterdayStr = format(yesterday, "yyyy-MM-dd");
                            if (date === todayStr) return "Today";
                            if (date === yesterdayStr) return "Yesterday";
                            try {
                              return format(new Date(date), "EEE, d MMM yyyy");
                            } catch {
                              return date;
                            }
                          })();

                          return (
                            <div key={date} className="card-elevated p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-text">{dateLabel}</p>
                                <span className="text-xs text-text-muted">
                                  {logs.length} / 5 prayers
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {logs.map((log: any, idx: number) => {
                                  const pName =
                                    log.prayerName || log.prayer_name || "";
                                  const status = log.status || "on_time";
                                  const statusColor =
                                    status === "on_time"
                                      ? "bg-success/10 text-success"
                                      : status === "late"
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "bg-rose-500/10 text-rose-500";

                                  return (
                                    <div
                                      key={idx}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${statusColor}`}
                                    >
                                      {status === "on_time" && <Check size={12} />}
                                      {status === "late" && <Clock size={12} />}
                                      {status === "qada" && <AlertCircle size={12} />}
                                      <span className="capitalize">{pName}</span>
                                      <span className="opacity-60 capitalize">({status.replace("_", " ")})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="card-elevated p-8 text-center">
                        <History size={32} className="text-text-muted mx-auto mb-3" />
                        <p className="text-text-secondary text-sm">
                          No prayer logs yet. Start marking your prayers!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card-elevated p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-text tabular-nums">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

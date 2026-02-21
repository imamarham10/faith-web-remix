import { useState, useEffect } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Loader2,
  Star,
  ArrowRightLeft,
  Globe,
} from "lucide-react";
import { calendarAPI } from "~/services/api";
import type { IslamicEvent } from "~/types";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "Asia/Riyadh (Saudi Arabia)", value: "Asia/Riyadh" },
  { label: "Asia/Dubai (UAE)", value: "Asia/Dubai" },
  { label: "Asia/Qatar (Qatar)", value: "Asia/Qatar" },
  { label: "Asia/Kuwait (Kuwait)", value: "Asia/Kuwait" },
  { label: "Asia/Muscat (Oman)", value: "Asia/Muscat" },
  { label: "Asia/Bahrain (Bahrain)", value: "Asia/Bahrain" },
  { label: "Asia/Baghdad (Iraq)", value: "Asia/Baghdad" },
  { label: "Asia/Tehran (Iran)", value: "Asia/Tehran" },
  { label: "Asia/Amman (Jordan)", value: "Asia/Amman" },
  { label: "Asia/Damascus (Syria)", value: "Asia/Damascus" },
  { label: "Europe/Istanbul (Turkey)", value: "Europe/Istanbul" },
  { label: "Africa/Cairo (Egypt)", value: "Africa/Cairo" },
  { label: "Africa/Casablanca (Morocco)", value: "Africa/Casablanca" },
  { label: "Africa/Nairobi (Kenya)", value: "Africa/Nairobi" },
  { label: "Africa/Lagos (Nigeria)", value: "Africa/Lagos" },
  { label: "Asia/Jakarta (Indonesia)", value: "Asia/Jakarta" },
  { label: "Asia/Kuala_Lumpur (Malaysia)", value: "Asia/Kuala_Lumpur" },
  { label: "Asia/Kolkata (India)", value: "Asia/Kolkata" },
  { label: "Asia/Karachi (Pakistan)", value: "Asia/Karachi" },
  { label: "Asia/Dhaka (Bangladesh)", value: "Asia/Dhaka" },
  { label: "Europe/London (UK)", value: "Europe/London" },
  { label: "Europe/Paris (France)", value: "Europe/Paris" },
  { label: "Europe/Berlin (Germany)", value: "Europe/Berlin" },
  { label: "America/New_York (USA)", value: "America/New_York" },
  { label: "America/Chicago (USA)", value: "America/Chicago" },
  { label: "America/Denver (USA)", value: "America/Denver" },
  { label: "America/Los_Angeles (USA)", value: "America/Los_Angeles" },
  { label: "America/Toronto (Canada)", value: "America/Toronto" },
  { label: "America/Mexico_City (Mexico)", value: "America/Mexico_City" },
  { label: "America/Sao_Paulo (Brazil)", value: "America/Sao_Paulo" },
  { label: "Australia/Sydney (Australia)", value: "Australia/Sydney" },
  { label: "Pacific/Auckland (New Zealand)", value: "Pacific/Auckland" },
];

/** Get the current date string (yyyy-MM-dd) in a specific IANA timezone */
function getLocalDateString(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

interface CalendarDay {
  gregorianDay: number;
  hijriDay?: number;
  hijriMonth?: string;
  hijriYear?: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek?: string;
  gregorianDate?: string;
  events?: any[];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<IslamicEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hijriToday, setHijriToday] = useState<any>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthData, setMonthData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [convertDate, setConvertDate] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-MM-dd");
  });
  const [convertedHijri, setConvertedHijri] = useState<any>(null);
  const [convertHijri, setConvertHijri] = useState({ year: 1447, month: 8, day: 27 });
  const [convertedGregorian, setConvertedGregorian] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return "UTC";
  });
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);


  // Fetch all calendar data on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Compute "today" client-side in the selected timezone
      // (the API's getToday uses the server clock which may be UTC)
      const localToday = getLocalDateString(selectedTimezone);

      try {
        const [hijriRes, todayRes, eventsRes, upcomingRes, monthRes] = await Promise.allSettled([
          calendarAPI.convertToHijri(localToday, selectedTimezone),
          calendarAPI.getToday(selectedTimezone),
          calendarAPI.getEvents(),
          calendarAPI.getUpcomingEvents(90, selectedTimezone),
          calendarAPI.getGregorianMonth(currentDate.getFullYear(), currentDate.getMonth() + 1, selectedTimezone),
        ]);

        // Use convertToHijri for accurate Hijri date based on the real local date
        let hijriData: any = null;
        if (hijriRes.status === "fulfilled") {
          const payload = hijriRes.value.data?.data || hijriRes.value.data;
          const hijri = payload?.hijri || payload;
          hijriData = {
            ...hijri,
            gregorianDate: localToday,
          };
        }

        // Merge events from getToday (it may still have useful event data)
        if (todayRes.status === "fulfilled") {
          const todayPayload = todayRes.value.data?.data || todayRes.value.data;
          const todayHijri = todayPayload?.hijri || todayPayload;
          if (hijriData && todayHijri?.events) {
            hijriData.events = todayHijri.events;
          }
          if (!hijriData) {
            hijriData = { ...todayHijri, gregorianDate: localToday };
          }
        }

        setHijriToday(hijriData);

        if (eventsRes.status === "fulfilled") {
          const evData = Array.isArray(eventsRes.value.data)
            ? eventsRes.value.data
            : eventsRes.value.data?.data || [];
          setEvents(evData);
        }

        if (upcomingRes.status === "fulfilled") {
          const upData = Array.isArray(upcomingRes.value.data)
            ? upcomingRes.value.data
            : upcomingRes.value.data?.data || [];
          setUpcomingEvents(upData);
        }

        if (monthRes.status === "fulfilled") {
          const data = monthRes.value.data?.data || monthRes.value.data;
          setMonthData(data);
        }
      } catch {
        // Errors are handled silently
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate, selectedTimezone]);

  // Build calendar grid from month data
  useEffect(() => {
    if (monthData && monthData.days) {
      const cells: CalendarDay[] = [];
      // Always compute "today" client-side in the selected timezone
      const today = getLocalDateString(selectedTimezone);

      monthData.days.forEach((day: any) => {
        const isToday = day.gregorianDate === today;
        cells.push({
          gregorianDay: parseInt(day.gregorianDate?.split("-")[2] || "0"),
          hijriDay: day.hijriDay,
          hijriMonth: day.hijriMonthName || day.hijriMonth,
          hijriYear: day.hijriYear,
          isCurrentMonth: true,
          isToday,
          dayOfWeek: day.dayOfWeek,
          gregorianDate: day.gregorianDate,
          events: day.events || [],
        });
      });

      setCalendarDays(cells);
    }
  }, [monthData, selectedTimezone]);

  // Convert date to Hijri
  const handleConvertToHijri = async () => {
    try {
      const res = await calendarAPI.convertToHijri(convertDate);
      setConvertedHijri(res.data?.data || res.data);
    } catch {
      setConvertedHijri(null);
    }
  };

  // Convert Hijri to Gregorian
  const handleConvertToGregorian = async () => {
    try {
      const res = await calendarAPI.convertToGregorian(
        convertHijri.year,
        convertHijri.month,
        convertHijri.day
      );
      setConvertedGregorian(res.data?.data || res.data);
    } catch {
      setConvertedGregorian(null);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const renderGrid = () => {
    return calendarDays.map((cell, idx) => {
      const isFriday = cell.dayOfWeek === "Friday";
      const hasEvents = cell.events && cell.events.length > 0;

      return (
        <button
          key={`${cell.hijriDay}-${cell.hijriMonth || idx}`}
          onClick={() => setSelectedDay(cell)}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-sm group cursor-pointer ${
            cell.isToday
              ? "bg-primary text-white font-bold shadow-sm ring-2 ring-primary ring-offset-2"
              : isFriday
              ? "bg-primary/5 text-primary font-medium hover:bg-primary/10"
              : "hover:bg-black/2 text-text"
          }`}
        >
          <span className="font-semibold text-lg">{cell.gregorianDay}</span>
          <span className="text-[10px] opacity-60">{cell.hijriDay || "—"}</span>
          {hasEvents && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
          )}
        </button>
      );
    });
  };

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="animate-fade-in-up">
              <CalendarIcon size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                Islamic Calendar
              </h1>
              <p className="text-white/60 text-sm">
                Track Hijri dates, convert calendars, and never miss an Islamic event
              </p>
            </div>

            {/* Today's Hijri Date */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Today's Date</p>
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-white/50 mt-2" />
                ) : hijriToday ? (
                  <div className="space-y-3">
                    {/* Hijri Date */}
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Hijri Date</p>
                      <p className="text-xl font-bold text-white">
                        {hijriToday.hijriDay || hijriToday.day} {hijriToday.hijriMonthName || hijriToday.monthName || hijriToday.month_name || ""} {hijriToday.hijriYear || hijriToday.year} AH
                      </p>
                    </div>

                    {/* Gregorian Date — computed client-side to match the selected timezone */}
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Gregorian Date</p>
                      <p className="text-sm text-white/80">
                        {new Intl.DateTimeFormat("en-US", {
                          timeZone: selectedTimezone,
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date())}
                      </p>
                    </div>

                    {/* Events Today */}
                    {hijriToday.events && hijriToday.events.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-white/60 text-xs mb-1.5">Events Today</p>
                        <div className="space-y-1">
                          {hijriToday.events.map((event: any, idx: number) => (
                            <p key={idx} className="text-xs text-white/70">
                              • {event.name || event}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm mt-2">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: selectedTimezone,
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date())}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {/* Calendar Converter */}
        <div className="mb-8">
          <button
            onClick={() => setShowConverter(!showConverter)}
            className="flex items-center gap-2 text-primary font-semibold text-sm mb-4 hover:gap-3 transition-all"
          >
            <ArrowRightLeft size={16} />
            {showConverter ? "Hide Date Converter" : "Show Date Converter"}
          </button>

          {showConverter && (
            <div className="grid md:grid-cols-2 gap-6 card-elevated p-6 mb-8 stagger-children">
              {/* Gregorian to Hijri */}
              <div className="animate-fade-in-up">
                <h3 className="font-semibold text-text mb-4">Gregorian to Hijri</h3>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={convertDate}
                    onChange={(e) => setConvertDate(e.target.value)}
                    className="input-field w-full"
                  />
                  <button
                    onClick={handleConvertToHijri}
                    className="btn-primary w-full"
                  >
                    Convert
                  </button>
                  {convertedHijri && (
                    <div className="bg-primary/5 p-4 rounded-xl">
                      <p className="text-sm text-text-muted mb-1">Hijri Date:</p>
                      <p className="font-semibold text-text">
                        {convertedHijri.day} {convertedHijri.monthName || convertedHijri.month_name || ""} {convertedHijri.year} AH
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hijri to Gregorian */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                <h3 className="font-semibold text-text mb-4">Hijri to Gregorian</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={convertHijri.month}
                      onChange={(e) => setConvertHijri({ ...convertHijri, month: Number(e.target.value) })}
                      placeholder="Month"
                      className="input-field text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={convertHijri.day}
                      onChange={(e) => setConvertHijri({ ...convertHijri, day: Number(e.target.value) })}
                      placeholder="Day"
                      className="input-field text-sm"
                    />
                    <input
                      type="number"
                      min="1400"
                      max="1500"
                      value={convertHijri.year}
                      onChange={(e) => setConvertHijri({ ...convertHijri, year: Number(e.target.value) })}
                      placeholder="Year"
                      className="input-field text-sm"
                    />
                  </div>
                  <button
                    onClick={handleConvertToGregorian}
                    className="btn-primary w-full"
                  >
                    Convert
                  </button>
                  {convertedGregorian && (
                    <div className="bg-primary/5 p-4 rounded-xl">
                      <p className="text-sm text-text-muted mb-1">Gregorian Date:</p>
                      <p className="font-semibold text-text">
                        {convertedGregorian.day} {convertedGregorian.month} {convertedGregorian.year}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            {/* Timezone Selector */}
            <div className="mb-6 relative">
              <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                <Globe size={13} />
                <span>Timezone (Device Location Auto-Detected)</span>
              </div>
              <button
                onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                className="flex items-center gap-2 text-sm font-medium text-text bg-white/50 border border-border-light px-4 py-2.5 rounded-xl hover:bg-white/70 transition-colors w-full justify-between"
              >
                <span>{TIMEZONES.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone}</span>
                <ChevronDown size={14} className={`transition-transform ${showTimezoneDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTimezoneDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-80 bg-white rounded-2xl shadow-2xl border border-border-light z-40 overflow-hidden animate-fade-in-up">
                  {/* Search */}
                  <div className="p-3 border-b border-border-light sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder="Search timezone..."
                      className="input-field w-full text-sm"
                      onChange={() => {
                        // Filter logic can be added here
                      }}
                    />
                  </div>

                  {/* Timezone List */}
                  <div className="max-h-64 overflow-y-auto">
                    {TIMEZONES.map((tz) => (
                      <button
                        key={tz.value}
                        onClick={() => {
                          setSelectedTimezone(tz.value);
                          setShowTimezoneDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-border-light last:border-b-0 hover:bg-primary/5 ${
                          selectedTimezone === tz.value ? "bg-primary/10 font-semibold text-primary" : "text-text"
                        }`}
                      >
                        {tz.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl hover:bg-black/3 transition-colors"
              >
                <ChevronLeft size={20} className="text-text-secondary" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-text">{format(currentDate, "MMMM yyyy")}</h2>
                {!isSameDay(
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                ) && (
                  <button onClick={goToToday} className="text-xs text-primary font-medium mt-0.5">
                    Go to Today
                  </button>
                )}
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl hover:bg-black/3 transition-colors"
              >
                <ChevronRight size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="card-elevated p-4 sm:p-6">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-text-muted uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderGrid()}</div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/5" />
                <span>Friday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Has Events</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Day or Events */}
          <div>
            {selectedDay ? (
              <>
                <div className="section-header mb-4">
                  <div>
                    <h2 className="section-title">
                      {selectedDay.gregorianDay} {format(
                        new Date(selectedDay.gregorianDate || new Date()),
                        "MMMM"
                      )}
                    </h2>
                    <p className="section-subtitle">{selectedDay.dayOfWeek}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Clear
                  </button>
                </div>

                {/* Selected Day Details */}
                <div className="card-elevated p-4 mb-4 space-y-3">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Hijri Date</p>
                    <p className="font-semibold text-text">
                      {selectedDay.hijriDay} {selectedDay.hijriMonth} {selectedDay.hijriYear} AH
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Gregorian Date</p>
                    <p className="font-semibold text-text">
                      {selectedDay.gregorianDate ? format(new Date(selectedDay.gregorianDate), "d MMMM yyyy") : "—"}
                    </p>
                  </div>
                </div>

                {/* Events for Selected Day */}
                {selectedDay.events && selectedDay.events.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-text mb-3">Events ({selectedDay.events.length})</h3>
                    <div className="space-y-3">
                      {selectedDay.events.map((event: any, idx: number) => (
                        <div key={idx} className="card p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                              <Star size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-text">{event.name}</h4>
                              {event.nameArabic && (
                                <p className="font-amiri text-sm text-text-muted">{event.nameArabic}</p>
                              )}
                              {event.description && (
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              {event.importance && (
                                <p className="text-[10px] text-text-muted mt-1 uppercase">
                                  {event.importance}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-4 text-center">
                    <p className="text-text-muted text-sm">No events on this day</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Upcoming Events</h2>
                    <p className="section-subtitle">Next 90 days</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : upcomingEvents.length > 0 || events.length > 0 ? (
                  <div className="space-y-3 stagger-children">
                    {(upcomingEvents.length > 0 ? upcomingEvents : events)
                      .slice(0, 8)
                      .map((item: any, i: number) => {
                        const evt = item.event || item;
                        const daysUntil = item.daysUntil;
                        return (
                          <div key={evt.id || i} className="card p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                <Star size={16} className="text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-text">{evt.name}</h4>
                                {evt.nameArabic && (
                                  <p className="font-amiri text-sm text-text-muted">{evt.nameArabic}</p>
                                )}
                                {evt.description && (
                                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
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
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-text-muted text-sm">No upcoming events</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

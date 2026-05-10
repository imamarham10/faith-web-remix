import { useEffect, useState } from "react";
import {
  Sunrise,
  Sunset,
  Moon,
  Sun,
  MapPin,
  Sparkles,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import { hinduPanchangAPI } from "~/services/api";

// ---------- Types ----------

interface Tithi {
  number: number;
  name: string;
  nameSanskrit: string;
  paksha: "shukla" | "krishna";
  endTime?: string;
}

interface Nakshatra {
  number: number;
  name: string;
  nameSanskrit: string;
  deity: string;
  endTime?: string;
}

interface Yoga {
  number: number;
  name: string;
  nameSanskrit: string;
}

interface Karana {
  number: number;
  name: string;
  nameSanskrit: string;
  isAuspicious: boolean;
}

interface Vaara {
  number: number;
  name: string;
  nameSanskrit: string;
}

interface TimeBand {
  start: string;
  end: string;
}

interface Festival {
  slug: string;
  nameEnglish: string;
  nameSanskrit?: string;
  deityKey?: string;
}

interface UpcomingFestival {
  festival: Festival;
  date: string;
}

interface PanchangData {
  date: string;
  timezone: string;
  tithi: Tithi;
  nakshatra: Nakshatra;
  yoga: Yoga;
  karana: Karana;
  vaara: Vaara;
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  auspicious: {
    brahmaMuhurta: TimeBand;
    abhijitMuhurta: TimeBand | null;
    rahuKaal: TimeBand;
    yamagandam: TimeBand;
    gulika: TimeBand;
  };
  festivals: Festival[];
}

// ---------- Helpers ----------

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209, label: "New Delhi" };

/**
 * The backend's panchang-ts library returns "wall-clock-as-UTC" timestamps.
 * A 5:33 AM IST sunrise comes out as `2026-05-10T05:33:00.000Z`.
 * Treat these as already-localized — format using UTC to render exactly the
 * wall-clock the backend computed, instead of re-shifting to the browser's TZ.
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
  // The backend returns YYYY-MM-DD; render as a friendly long date in user's locale.
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

const titleCase = (s: string): string =>
  s
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");

// ---------- Meta ----------

export function meta() {
  return [
    { title: "Today's Panchang | Siraat" },
    {
      name: "description",
      content:
        "Today's Tithi, Nakshatra, Yoga, Karana and auspicious times — Hindu Panchang based on your location.",
    },
  ];
}

// ---------- Page ----------

export default function HinduPanchang() {
  const [data, setData] = useState<PanchangData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingFestival[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string>(DEFAULT_LOCATION.label);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchPanchang = async (lat: number, lng: number, label: string) => {
      setLocationLabel(label);
      try {
        const res = await hinduPanchangAPI.getToday(lat, lng, tz);
        const payload = (res.data?.data ?? res.data) as PanchangData;
        setData(payload);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load Panchang");
      } finally {
        setLoading(false);
      }
      // Best-effort upcoming festivals; never blocks the main panchang render.
      hinduPanchangAPI
        .upcomingFestivals(lat, lng, 90, tz)
        .then((res) => {
          const payload = res.data?.data ?? res.data;
          setUpcoming((payload?.occurrences ?? []) as UpcomingFestival[]);
        })
        .catch(() => {});
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchPanchang(
            latitude,
            longitude,
            `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          );
        },
        () => {
          fetchPanchang(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label);
        },
        { timeout: 5000 },
      );
    } else {
      fetchPanchang(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Sparkles size={12} />
              Panchang
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
              Today's Panchang
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 text-sm sm:text-base">
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
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container-faith py-10 md:py-14">
        {loading && <PanchangLoading />}

        {!loading && error && <PanchangError message={error} />}

        {!loading && !error && data && (
          <div className="space-y-8 md:space-y-10">
            {/* 5-Anga grid */}
            <section aria-labelledby="anga-heading">
              <SectionTitle
                id="anga-heading"
                eyebrow="Pancha Anga"
                title="The Five Limbs"
                subtitle="The five astrological elements that define today"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                <TithiCard tithi={data.tithi} />
                <NakshatraCard nakshatra={data.nakshatra} />
                <YogaCard yoga={data.yoga} />
                <KaranaCard karana={data.karana} />
                <VaaraCard vaara={data.vaara} />
              </div>
            </section>

            {/* Sun + Moon */}
            <section aria-labelledby="sun-moon-heading">
              <SectionTitle
                id="sun-moon-heading"
                eyebrow="Surya & Chandra"
                title="Sun and Moon"
                subtitle="Today's celestial timings for your location"
              />
              <SunMoonCard
                sunrise={data.sunrise}
                sunset={data.sunset}
                moonrise={data.moonrise}
                moonset={data.moonset}
              />
            </section>

            {/* Auspicious & inauspicious times */}
            <section aria-labelledby="auspicious-heading">
              <SectionTitle
                id="auspicious-heading"
                eyebrow="Muhurta"
                title="Auspicious & Inauspicious Times"
                subtitle="Sacred windows and times to avoid important undertakings"
              />
              <AuspiciousList auspicious={data.auspicious} />
            </section>

            {/* Festivals strip — only when present */}
            {data.festivals && data.festivals.length > 0 && (
              <section aria-labelledby="festivals-heading">
                <SectionTitle
                  id="festivals-heading"
                  eyebrow="Utsava"
                  title="Festivals Today"
                />
                <FestivalsStrip festivals={data.festivals} />
              </section>
            )}

            {/* Upcoming festivals — best-effort, hidden when empty */}
            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-heading">
                <SectionTitle
                  id="upcoming-heading"
                  eyebrow="Aagami Utsava"
                  title="Upcoming Festivals"
                  subtitle="Major festivals occurring in the next 90 days"
                />
                <UpcomingFestivalsList items={upcoming} />
              </section>
            )}
          </div>
        )}
      </div>
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

// ---------- Anga cards ----------

function AngaCardShell({
  label,
  sanskrit,
  english,
  children,
  accent,
}: {
  label: string;
  sanskrit: string;
  english: string;
  children?: React.ReactNode;
  accent?: "default" | "warm" | "deep";
}) {
  const ring =
    accent === "deep"
      ? "border-[#6B1F2A]/15"
      : accent === "warm"
        ? "border-[#C8A55A]/30"
        : "border-[#E8DCC4]";
  return (
    <article
      className={`relative rounded-2xl bg-white border ${ring} p-6 md:p-7 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] overflow-hidden`}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-3">
        {label}
      </p>
      <p
        className="text-3xl md:text-4xl leading-tight text-[#3A0F18] font-semibold mb-1.5"
        style={{ fontFamily: "var(--font-devanagari)" }}
        lang="sa"
      >
        {sanskrit}
      </p>
      <p className="text-base font-semibold text-[#1A1D23] tracking-tight">
        {english}
      </p>
      {children && <div className="mt-4 pt-4 border-t border-[#F1E7D2]">{children}</div>}
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-[11px] uppercase tracking-wider text-[#9A7B3A] font-semibold">
        {label}
      </span>
      <span className="text-[#3A0F18] font-medium tabular-nums text-right">{value}</span>
    </div>
  );
}

function TithiCard({ tithi }: { tithi: Tithi }) {
  const pakshaLabel = tithi.paksha === "shukla" ? "Shukla Paksha" : "Krishna Paksha";
  const pakshaSwatch =
    tithi.paksha === "shukla"
      ? "bg-[#FAF1D9] text-[#7A5B19] border-[#E8D5A0]"
      : "bg-[#2A0A12]/[0.06] text-[#3A0F18] border-[#3A0F18]/15";
  return (
    <AngaCardShell
      label={`Tithi · #${tithi.number}`}
      sanskrit={tithi.nameSanskrit}
      english={titleCase(tithi.name)}
      accent="deep"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#9A7B3A] font-semibold">
            Paksha
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pakshaSwatch}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                tithi.paksha === "shukla" ? "bg-[#C8A55A]" : "bg-[#3A0F18]"
              }`}
            />
            {pakshaLabel}
          </span>
        </div>
        {tithi.endTime && (
          <MetaRow label="Ends at" value={formatWallTime(tithi.endTime)} />
        )}
      </div>
    </AngaCardShell>
  );
}

function NakshatraCard({ nakshatra }: { nakshatra: Nakshatra }) {
  return (
    <AngaCardShell
      label={`Nakshatra · #${nakshatra.number}`}
      sanskrit={nakshatra.nameSanskrit}
      english={titleCase(nakshatra.name)}
    >
      <div className="space-y-2.5">
        {nakshatra.deity && (
          <MetaRow label="Deity" value={titleCase(nakshatra.deity)} />
        )}
        {nakshatra.endTime && (
          <MetaRow label="Ends at" value={formatWallTime(nakshatra.endTime)} />
        )}
      </div>
    </AngaCardShell>
  );
}

function YogaCard({ yoga }: { yoga: Yoga }) {
  return (
    <AngaCardShell
      label={`Yoga · #${yoga.number}`}
      sanskrit={yoga.nameSanskrit}
      english={titleCase(yoga.name)}
    />
  );
}

function KaranaCard({ karana }: { karana: Karana }) {
  return (
    <AngaCardShell
      label={`Karana · #${karana.number}`}
      sanskrit={karana.nameSanskrit}
      english={titleCase(karana.name)}
      accent="warm"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[#9A7B3A] font-semibold">
          Quality
        </span>
        {karana.isAuspicious ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF1D9] text-[#7A5B19] border border-[#E8D5A0]">
            <Sparkles size={11} />
            Auspicious
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBE9EA] text-[#8A2B36] border border-[#E8C2C6]">
            <AlertTriangle size={11} />
            Bhadra
          </span>
        )}
      </div>
    </AngaCardShell>
  );
}

function VaaraCard({ vaara }: { vaara: Vaara }) {
  return (
    <AngaCardShell
      label={`Vaara · Day ${vaara.number}`}
      sanskrit={vaara.nameSanskrit}
      english={titleCase(vaara.name)}
    />
  );
}

// ---------- Sun & Moon card ----------

function SunMoonCard({
  sunrise,
  sunset,
  moonrise,
  moonset,
}: {
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-6 md:p-8 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CelestialRow
          icon={<Sunrise size={20} />}
          label="Sunrise"
          time={sunrise}
          tone="warm"
        />
        <CelestialRow
          icon={<Sunset size={20} />}
          label="Sunset"
          time={sunset}
          tone="warm"
        />
      </div>
      {(moonrise || moonset) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F1E7D2]">
          <CelestialRow
            icon={<Moon size={20} />}
            label="Moonrise"
            time={moonrise}
            tone="cool"
          />
          <CelestialRow
            icon={<Moon size={20} />}
            label="Moonset"
            time={moonset}
            tone="cool"
          />
        </div>
      )}
    </div>
  );
}

function CelestialRow({
  icon,
  label,
  time,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  time?: string;
  tone: "warm" | "cool";
}) {
  const iconWrap =
    tone === "warm"
      ? "bg-[#FAF1D9] text-[#9A7B3A]"
      : "bg-[#EFE9F7] text-[#6B4F8C]";
  return (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconWrap}`}>
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

// ---------- Auspicious times ----------

interface MuhurtaItem {
  key: string;
  label: string;
  band: TimeBand | null;
  tone: "good" | "warn";
  description: string;
}

function AuspiciousList({
  auspicious,
}: {
  auspicious: PanchangData["auspicious"];
}) {
  const items: MuhurtaItem[] = [
    {
      key: "brahmaMuhurta",
      label: "Brahma Muhurta",
      band: auspicious.brahmaMuhurta,
      tone: "good",
      description: "Pre-dawn window ideal for meditation and study",
    },
    {
      key: "abhijitMuhurta",
      label: "Abhijit Muhurta",
      band: auspicious.abhijitMuhurta,
      tone: "good",
      description: "Midday window of universal auspiciousness",
    },
    {
      key: "rahuKaal",
      label: "Rahu Kaal",
      band: auspicious.rahuKaal,
      tone: "warn",
      description: "Avoid starting new ventures",
    },
    {
      key: "yamagandam",
      label: "Yamagandam",
      band: auspicious.yamagandam,
      tone: "warn",
      description: "Inauspicious for important work",
    },
    {
      key: "gulika",
      label: "Gulika Kaal",
      band: auspicious.gulika,
      tone: "warn",
      description: "Inauspicious window",
    },
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] overflow-hidden shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
      <ul className="divide-y divide-[#F1E7D2]">
        {items.map((item) => (
          <MuhurtaRow key={item.key} item={item} />
        ))}
      </ul>
    </div>
  );
}

function MuhurtaRow({ item }: { item: MuhurtaItem }) {
  const isGood = item.tone === "good";
  const rowBg = isGood ? "bg-[#FBF6EC]" : "bg-white";
  const dotColor = isGood ? "bg-[#C8A55A]" : "bg-[#A33B47]";
  const labelColor = isGood ? "text-[#7A5B19]" : "text-[#8A2B36]";
  const Icon = isGood ? Sparkles : AlertTriangle;

  // Abhijit Muhurta is null on Wednesdays.
  if (!item.band) {
    return (
      <li className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${rowBg}`}>
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isGood ? "bg-[#FAF1D9] text-[#9A7B3A]" : "bg-[#FBE9EA] text-[#A33B47]"
          }`}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${labelColor}`}>{item.label}</p>
          <p className="text-xs text-[#6B5642] mt-0.5">Not observed today</p>
        </div>
        <span className="text-sm text-[#9A7B3A] tabular-nums">—</span>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${rowBg}`}>
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isGood ? "bg-[#FAF1D9] text-[#9A7B3A]" : "bg-[#FBE9EA] text-[#A33B47]"
        }`}
        aria-hidden
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden />
          <p className={`text-sm font-semibold ${labelColor}`}>{item.label}</p>
        </div>
        <p className="text-xs text-[#6B5642] mt-0.5">{item.description}</p>
      </div>
      <span className="text-sm sm:text-base font-semibold text-[#3A0F18] tabular-nums whitespace-nowrap">
        {formatTimeBand(item.band)}
      </span>
    </li>
  );
}

// ---------- Festivals strip ----------

function FestivalsStrip({ festivals }: { festivals: Festival[] }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#FBF6EC] to-[#F4E7C4] border border-[#E8D5A0] p-6 md:p-7">
      <ul className="flex flex-wrap gap-3">
        {festivals.map((f) => (
          <li
            key={f.slug}
            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/90 border border-[#E8D5A0] shadow-sm"
          >
            <Sparkles size={14} className="text-[#9A7B3A]" />
            <div>
              <p className="text-sm font-semibold text-[#3A0F18] leading-tight">
                {f.nameEnglish}
              </p>
              {f.nameSanskrit && (
                <p
                  className="text-xs text-[#6B5642] leading-tight mt-0.5"
                  style={{ fontFamily: "var(--font-devanagari)" }}
                  lang="sa"
                >
                  {f.nameSanskrit}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Upcoming festivals list ----------

function UpcomingFestivalsList({ items }: { items: UpcomingFestival[] }) {
  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((o) => (
        <li
          key={`${o.festival.slug}-${o.date}`}
          className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 rounded-2xl bg-white border border-[#E8DCC4] shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FAF1D9] text-[#9A7B3A] shrink-0"
              aria-hidden
            >
              <Sparkles size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#3A0F18] leading-tight truncate">
                {o.festival.nameEnglish}
              </p>
              {o.festival.nameSanskrit && (
                <p
                  className="text-xs text-[#6B5642] leading-tight mt-0.5 truncate"
                  style={{ fontFamily: "var(--font-devanagari)" }}
                  lang="sa"
                >
                  {o.festival.nameSanskrit}
                </p>
              )}
            </div>
          </div>
          <time
            className="text-sm sm:text-base font-semibold text-[#3A0F18] tabular-nums whitespace-nowrap shrink-0"
            dateTime={o.date}
          >
            {formatGregorianDate(o.date)}
          </time>
        </li>
      ))}
    </ul>
  );
}

// ---------- Loading & error states ----------

function PanchangLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
      <p className="text-sm text-[#6B5642]">Calculating today's Panchang for your location…</p>
    </div>
  );
}

function PanchangError({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} />
      </div>
      <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Panchang unavailable
      </h2>
      <p className="text-sm text-[#6B5642]">{message}</p>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router";
import {
  BarChart3,
  Calendar,
  Check,
  Flame,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { hinduJapaAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";

export function meta() {
  return [
    { title: "Japa & Mantra Counter | Siraat" },
    {
      name: "description",
      content:
        "Track your daily mantra recitations with mala-style counters and goals.",
    },
  ];
}

type Mantra = {
  sanskrit: string;
  transliteration: string;
  english: string;
  category: "mahamantra" | "gayatri" | "shanti" | "beej" | "devotional";
  deityKey?: string;
};

type Counter = {
  id: string;
  userId: string;
  name: string;
  mantraSanskrit?: string | null;
  mantraEnglish?: string | null;
  count: number;
  targetCount?: number | null;
  deityKey?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Goal = {
  id: string;
  userId: string;
  mantraSanskrit: string;
  targetCount: number;
  period: "daily" | "weekly" | "monthly";
  startDate: string;
  endDate: string;
  currentCount?: number;
  progressPercent?: number;
  daysRemaining?: number;
  isComplete?: boolean;
};

type Stats = {
  totalCount: number;
  dailyAverage: number;
  currentStreak: number;
  longestStreak: number;
  mostRecitedPhrase: string | null;
};

type HistoryEntry = {
  id: string;
  userId: string;
  mantra: string;
  count: number;
  date: string;
  createdAt: string;
};

const INCREMENTS = [1, 5, 27, 108];

const CATEGORY_ORDER: Array<Mantra["category"]> = [
  "mahamantra",
  "gayatri",
  "beej",
  "shanti",
  "devotional",
];

const CATEGORY_LABEL: Record<Mantra["category"], string> = {
  mahamantra: "Mahamantra",
  gayatri: "Gayatri",
  beej: "Beej",
  shanti: "Shanti",
  devotional: "Devotional",
};

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/japa/mantras`);
    if (!res.ok) return { mantras: [] as Mantra[] };
    const json = await res.json();
    const mantras: Mantra[] = Array.isArray(json) ? json : json?.data ?? [];
    return { mantras };
  } catch {
    return { mantras: [] as Mantra[] };
  }
}

export default function HinduJapaPage() {
  const { user } = useAuth();
  const { mantras: loaderMantras } = useLoaderData<typeof loader>();

  if (!user) {
    return <GuestJapa mantras={loaderMantras || []} />;
  }
  return <AuthedJapa initialMantras={loaderMantras || []} />;
}

/* ============================================================
   Authenticated experience
   ============================================================ */
function AuthedJapa({ initialMantras }: { initialMantras: Mantra[] }) {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mantras, setMantras] = useState<Mantra[]>(initialMantras);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "stats" | "history">(
    "goals",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showMantraPicker, setShowMantraPicker] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, g, h, s] = await Promise.allSettled([
        hinduJapaAPI.getCounters(),
        hinduJapaAPI.getGoals(),
        hinduJapaAPI.getHistory(),
        hinduJapaAPI.getStats(),
      ]);
      if (c.status === "fulfilled") {
        const d = c.value.data;
        setCounters(Array.isArray(d) ? d : d?.data || []);
      }
      if (g.status === "fulfilled") {
        const d = g.value.data;
        setGoals(Array.isArray(d) ? d : d?.data || []);
      }
      if (h.status === "fulfilled") {
        const d = h.value.data;
        setHistory(Array.isArray(d) ? d : d?.data || []);
      }
      if (s.status === "fulfilled") {
        const d = s.value.data;
        setStats((d?.data as Stats) || (d as Stats) || null);
      }
    } catch {
      // swallow; UI stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (mantras.length === 0) {
      hinduJapaAPI
        .getMantras()
        .then((res) => {
          const d = res.data;
          setMantras(Array.isArray(d) ? d : d?.data || []);
        })
        .catch(() => {});
    }
  }, [mantras.length]);

  const totalCounters = counters.length;

  const incrementCounter = useCallback(
    async (counter: Counter, delta: number) => {
      const prevCount = counter.count;
      const nextCount = prevCount + delta;
      // Optimistic UI
      setCounters((cs) =>
        cs.map((c) => (c.id === counter.id ? { ...c, count: nextCount } : c)),
      );
      try {
        const res = await hinduJapaAPI.updateCounter(counter.id, {
          count: nextCount,
        });
        const updated = res.data?.data || res.data;
        if (updated) {
          setCounters((cs) =>
            cs.map((c) => (c.id === counter.id ? { ...c, ...updated } : c)),
          );
        }
        // Background refresh of stats so streaks stay current
        hinduJapaAPI
          .getStats()
          .then((sr) => {
            const d = sr.data;
            setStats((d?.data as Stats) || (d as Stats) || null);
          })
          .catch(() => {});
      } catch {
        // Revert on failure
        setCounters((cs) =>
          cs.map((c) => (c.id === counter.id ? { ...c, count: prevCount } : c)),
        );
      }
    },
    [],
  );

  const resetCounter = useCallback(async (counter: Counter) => {
    try {
      const res = await hinduJapaAPI.updateCounter(counter.id, { count: 0 });
      const updated = res.data?.data || res.data;
      setCounters((cs) =>
        cs.map((c) =>
          c.id === counter.id ? { ...c, ...(updated || { count: 0 }) } : c,
        ),
      );
    } catch {}
  }, []);

  const deleteCounter = useCallback(async (counter: Counter) => {
    try {
      await hinduJapaAPI.deleteCounter(counter.id);
      setCounters((cs) => cs.filter((c) => c.id !== counter.id));
    } catch {}
  }, []);

  const createCounter = useCallback(
    async (data: {
      name: string;
      mantraSanskrit?: string;
      mantraEnglish?: string;
      targetCount?: number;
      deityKey?: string;
    }) => {
      try {
        const res = await hinduJapaAPI.createCounter(data);
        const created = res.data?.data || res.data;
        if (created) setCounters((cs) => [created, ...cs]);
        setShowCreate(false);
      } catch {}
    },
    [],
  );

  const createGoal = useCallback(
    async (data: {
      mantraSanskrit: string;
      targetCount: number;
      period: "daily" | "weekly" | "monthly";
    }) => {
      const today = new Date();
      const start = today.toISOString();
      const end = new Date(today);
      if (data.period === "daily") end.setDate(end.getDate() + 1);
      else if (data.period === "weekly") end.setDate(end.getDate() + 7);
      else end.setMonth(end.getMonth() + 1);
      try {
        const res = await hinduJapaAPI.createGoal({
          mantraSanskrit: data.mantraSanskrit,
          targetCount: data.targetCount,
          period: data.period,
          startDate: start,
          endDate: end.toISOString(),
        });
        const created = res.data?.data || res.data;
        if (created) setGoals((gs) => [created, ...gs]);
        setShowCreateGoal(false);
      } catch {}
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Sparkles size={12} />
              Mantra Counter
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
              Japa
            </h1>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
              Track your daily mantra recitations. Each turn of the mala is 108
              beads — sacred, steady, returning.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <Sparkles size={12} className="text-[#E8D5A0]" />
                {stats?.totalCount?.toLocaleString() ?? 0} total japa
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <Flame size={12} className="text-[#E8B86E]" />
                {stats?.currentStreak ?? 0} day streak
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-medium">
                <Target size={12} className="text-[#E8D5A0]" />
                {totalCounters} counter{totalCounters !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats summary card */}
      <section className="container-faith -mt-6 relative z-10 mb-8">
        <div className="rounded-2xl bg-white shadow-md border border-[#E5D9B7] p-4 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStat
              icon={<Sparkles size={17} />}
              label="Total Japa"
              value={stats?.totalCount?.toLocaleString() ?? "0"}
              tone="burgundy"
            />
            <SummaryStat
              icon={<Flame size={17} />}
              label="Current Streak"
              value={`${stats?.currentStreak ?? 0} days`}
              tone="ember"
            />
            <SummaryStat
              icon={<TrendingUp size={17} />}
              label="Daily Average"
              value={stats?.dailyAverage ?? 0}
              tone="leaf"
            />
            <SummaryStat
              icon={<Target size={17} />}
              label="Active Goals"
              value={goals.length}
              tone="gold"
            />
          </div>
        </div>
      </section>

      <div className="container-faith pb-16 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-[#7B2C2C] mb-3" size={32} />
            <p className="text-sm text-[#5A4A3A]">Loading your mala…</p>
          </div>
        ) : (
          <>
            {/* Counters */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2A1410]">
                  Your Counters
                </h2>
                <p className="text-sm text-[#7A6651] mt-0.5">
                  {totalCounters} active counter
                  {totalCounters !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors shadow-sm"
              >
                <Plus size={15} />
                Add counter
              </button>
            </div>

            {counters.length > 0 ? (
              <div className="space-y-4 mb-12">
                {counters.map((counter) => (
                  <CounterCard
                    key={counter.id}
                    counter={counter}
                    onIncrement={(d) => incrementCounter(counter, d)}
                    onReset={() => resetCounter(counter)}
                    onDelete={() => deleteCounter(counter)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[#E5D9B7] p-10 text-center mb-12">
                <div className="w-14 h-14 rounded-full bg-[#FBE9D6] flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={22} className="text-[#7B2C2C]" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-[#2A1410] mb-1">
                  Begin your sadhana
                </h3>
                <p className="text-sm text-[#7A6651] mb-5">
                  Pick a mantra from the dictionary or create your own counter
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowMantraPicker(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5D9B7] text-[#2A1410] text-sm font-semibold hover:border-[#7B2C2C]/40 transition-colors"
                  >
                    Browse mantras
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors"
                  >
                    <Plus size={15} />
                    New counter
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white border border-[#E5D9B7] rounded-xl p-1 mb-6 max-w-md">
              {(["goals", "stats", "history"] as const).map((tab) => {
                const Icon =
                  tab === "goals"
                    ? Target
                    : tab === "stats"
                      ? BarChart3
                      : History;
                const labels = {
                  goals: "Goals",
                  stats: "Stats",
                  history: "History",
                };
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#7B2C2C] text-white shadow-sm"
                        : "text-[#5A4A3A] hover:text-[#2A1410]"
                    }`}
                  >
                    <Icon size={14} />
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {activeTab === "goals" && (
              <GoalsTab
                goals={goals}
                onCreateGoal={() => setShowCreateGoal(true)}
              />
            )}
            {activeTab === "stats" && <StatsTab stats={stats} />}
            {activeTab === "history" && <HistoryTab history={history} />}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateCounterModal
          mantras={mantras}
          onClose={() => setShowCreate(false)}
          onCreate={createCounter}
        />
      )}
      {showCreateGoal && (
        <CreateGoalModal
          counters={counters}
          mantras={mantras}
          onClose={() => setShowCreateGoal(false)}
          onCreate={createGoal}
        />
      )}
      {showMantraPicker && (
        <Modal onClose={() => setShowMantraPicker(false)}>
          <h3 className="font-playfair text-xl font-bold text-[#2A1410] mb-1">
            Mantra Library
          </h3>
          <p className="text-xs text-[#7A6651] mb-5">
            20 traditional mantras grouped by category
          </p>
          <MantraGrid
            mantras={mantras}
            onSelect={(m) => {
              setShowMantraPicker(false);
              setShowCreate(true);
              // Pre-fill via window event hack would be ugly; defer to user re-picking.
              // Simpler: drop this and rely on the picker inside the create modal.
              void m;
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   Counter card with mala-style increment buttons
   ============================================================ */
function CounterCard({
  counter,
  onIncrement,
  onReset,
  onDelete,
}: {
  counter: Counter;
  onIncrement: (delta: number) => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const [pulse, setPulse] = useState<number | null>(null);
  const target = counter.targetCount || 108;
  const progress = Math.min((counter.count / target) * 100, 100);
  const isComplete = counter.count >= target;

  const handleIncrement = (delta: number) => {
    onIncrement(delta);
    setPulse(delta);
    window.setTimeout(() => setPulse(null), 220);
  };

  return (
    <div
      className={`rounded-2xl bg-white border p-5 sm:p-6 transition-all ${
        isComplete
          ? "border-[#E8B86E]/60 shadow-[0_0_0_1px_rgba(232,184,110,0.4)]"
          : "border-[#E5D9B7] hover:border-[#7B2C2C]/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-playfair text-lg font-bold text-[#2A1410]">
              {counter.name}
            </h3>
            {isComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FBE9D6] text-[#A8581F] text-[10px] font-bold uppercase tracking-wider">
                <Check size={10} /> Mala complete
              </span>
            )}
            {counter.deityKey && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#7B2C2C]/8 text-[#7B2C2C] text-[10px] font-medium uppercase tracking-wider">
                {counter.deityKey}
              </span>
            )}
          </div>
          {counter.mantraSanskrit && (
            <p className="font-playfair text-2xl text-[#7B2C2C] leading-snug mb-1">
              {counter.mantraSanskrit}
            </p>
          )}
          {counter.mantraEnglish && (
            <p className="text-sm text-[#5A4A3A] italic">
              {counter.mantraEnglish}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onReset}
            title="Reset count"
            className="p-2 rounded-lg text-[#7A6651] hover:bg-[#FBE9D6] hover:text-[#2A1410] transition-colors"
            aria-label="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onDelete}
            title="Delete counter"
            className="p-2 rounded-lg text-[#7A6651] hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-2">
        <span
          className={`font-playfair text-5xl sm:text-6xl font-bold tabular-nums text-[#2A1410] transition-transform duration-200 ${
            pulse !== null ? "scale-110" : ""
          }`}
        >
          {counter.count.toLocaleString()}
        </span>
        <span className="text-sm text-[#7A6651]">
          / {target.toLocaleString()}
        </span>
        <span className="ml-auto text-xs font-semibold text-[#7B2C2C] tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Mala bead progress bar */}
      <div className="relative w-full h-2.5 rounded-full overflow-hidden bg-[#F1E5C6] mb-5">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isComplete
              ? "linear-gradient(90deg, #E8B86E, #C8902F)"
              : "linear-gradient(90deg, #7B2C2C, #A8581F)",
          }}
        />
      </div>

      {/* Mala increment buttons */}
      <div className="grid grid-cols-4 gap-2">
        {INCREMENTS.map((delta) => {
          const isMala = delta === 108;
          const isPulsing = pulse === delta;
          return (
            <button
              key={delta}
              onClick={() => handleIncrement(delta)}
              className={`relative py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                isMala
                  ? "bg-[#7B2C2C] text-white shadow-md hover:bg-[#6A2424] hover:shadow-lg"
                  : "bg-white border border-[#E5D9B7] text-[#2A1410] hover:border-[#7B2C2C]/40 hover:bg-[#FBE9D6]/40"
              } ${isPulsing ? "ring-2 ring-[#E8B86E] ring-offset-2 ring-offset-white" : ""}`}
            >
              <span className="block text-base font-bold tabular-nums">
                +{delta}
              </span>
              {isMala && (
                <span className="block text-[9px] font-medium uppercase tracking-wider text-white/80 mt-0.5">
                  Full mala
                </span>
              )}
              {!isMala && delta === 27 && (
                <span className="block text-[9px] font-medium uppercase tracking-wider text-[#7A6651] mt-0.5">
                  Quarter
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Tabs
   ============================================================ */
function GoalsTab({
  goals,
  onCreateGoal,
}: {
  goals: Goal[];
  onCreateGoal: () => void;
}) {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-10 text-center">
        <Target size={36} className="text-[#7B2C2C]/40 mx-auto mb-3" />
        <h3 className="font-playfair text-lg font-bold text-[#2A1410] mb-1">
          Set your first goal
        </h3>
        <p className="text-sm text-[#7A6651] mb-5">
          Create daily, weekly, or monthly mantra goals to build consistency
        </p>
        <button
          onClick={onCreateGoal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors"
        >
          <Plus size={15} />
          Create goal
        </button>
      </div>
    );
  }

  const periodLabel: Record<Goal["period"], string> = {
    daily: "today",
    weekly: "this week",
    monthly: "this month",
  };

  return (
    <div className="space-y-3 mb-6">
      {goals.map((goal) => {
        const current = goal.currentCount ?? 0;
        const percent =
          goal.progressPercent ??
          Math.min(Math.round((current / goal.targetCount) * 100), 100);
        const done = goal.isComplete ?? current >= goal.targetCount;
        const days = goal.daysRemaining;

        return (
          <div
            key={goal.id}
            className={`rounded-2xl bg-white border p-5 transition-all ${
              done ? "border-[#E8B86E]/60" : "border-[#E5D9B7]"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-playfair text-lg text-[#7B2C2C] leading-snug truncate">
                  {goal.mantraSanskrit}
                </p>
                <p className="text-xs text-[#7A6651] mt-0.5">
                  {periodLabel[goal.period]}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {done && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8B86E]/15 text-[#A8581F] text-[10px] font-bold uppercase tracking-wider">
                    <Check size={10} /> Done
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#7B2C2C]/8 text-[#7B2C2C] text-[10px] font-medium uppercase tracking-wider">
                  {goal.period}
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-[#F1E5C6] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  done ? "bg-[#E8B86E]" : "bg-[#7B2C2C]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#7A6651]">
              <span className="font-medium tabular-nums text-[#2A1410]">
                {current.toLocaleString()} /{" "}
                {goal.targetCount.toLocaleString()}
              </span>
              <span>
                {done
                  ? "Goal reached"
                  : days !== undefined
                    ? `${days} day${days !== 1 ? "s" : ""} left`
                    : ""}
              </span>
            </div>
          </div>
        );
      })}
      <button
        onClick={onCreateGoal}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-dashed border-[#7B2C2C]/30 text-[#7B2C2C] text-sm font-semibold hover:bg-[#FBE9D6]/40 transition-colors"
      >
        <Plus size={15} />
        Add goal
      </button>
    </div>
  );
}

function StatsTab({ stats }: { stats: Stats | null }) {
  if (!stats || stats.totalCount === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-10 text-center">
        <BarChart3 size={36} className="text-[#7B2C2C]/40 mx-auto mb-3" />
        <h3 className="font-playfair text-lg font-bold text-[#2A1410] mb-1">
          No stats yet
        </h3>
        <p className="text-sm text-[#7A6651]">
          Start counting to see your sadhana statistics
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-5">
        <div className="w-10 h-10 rounded-xl bg-[#7B2C2C]/8 flex items-center justify-center mb-3">
          <Sparkles size={18} className="text-[#7B2C2C]" />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#2A1410] tabular-nums">
          {stats.totalCount.toLocaleString()}
        </p>
        <p className="text-xs text-[#7A6651] mt-1">Total Recitations</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-5">
        <div className="w-10 h-10 rounded-xl bg-[#E8B86E]/15 flex items-center justify-center mb-3">
          <Flame size={18} className="text-[#A8581F]" />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#2A1410] tabular-nums">
          {stats.currentStreak}
        </p>
        <p className="text-xs text-[#7A6651] mt-1">Current Streak</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-5">
        <div className="w-10 h-10 rounded-xl bg-[#3A6B4F]/12 flex items-center justify-center mb-3">
          <TrendingUp size={18} className="text-[#3A6B4F]" />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#2A1410] tabular-nums">
          {stats.dailyAverage}
        </p>
        <p className="text-xs text-[#7A6651] mt-1">Daily Average</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-5">
        <div className="w-10 h-10 rounded-xl bg-[#C8902F]/15 flex items-center justify-center mb-3">
          <Target size={18} className="text-[#C8902F]" />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#2A1410] tabular-nums">
          {stats.longestStreak}
        </p>
        <p className="text-xs text-[#7A6651] mt-1">Longest Streak</p>
      </div>
      {stats.mostRecitedPhrase && (
        <div className="lg:col-span-4 rounded-2xl bg-white border border-[#E5D9B7] p-5">
          <p className="text-xs uppercase tracking-wider text-[#7A6651] mb-2 font-semibold">
            Most recited
          </p>
          <p className="font-playfair text-xl text-[#7B2C2C] leading-snug">
            {stats.mostRecitedPhrase}
          </p>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5D9B7] p-10 text-center">
        <History size={36} className="text-[#7B2C2C]/40 mx-auto mb-3" />
        <h3 className="font-playfair text-lg font-bold text-[#2A1410] mb-1">
          No history yet
        </h3>
        <p className="text-sm text-[#7A6651]">
          Your japa activity will appear here once you start counting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl bg-white border border-[#E5D9B7] p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#7B2C2C]/8 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-[#7B2C2C]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-playfair text-base text-[#2A1410] truncate">
              {entry.mantra}
            </p>
            <p className="text-xs text-[#7A6651] mt-0.5">
              {entry.count.toLocaleString()} recitation
              {entry.count !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-xs text-[#7A6651] shrink-0 inline-flex items-center gap-1">
            <Calendar size={11} />
            {new Date(entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Modals
   ============================================================ */
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-[#2A1410]/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-[#E5D9B7]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function MantraGrid({
  mantras,
  onSelect,
}: {
  mantras: Mantra[];
  onSelect: (m: Mantra) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<Mantra["category"], Mantra[]>();
    for (const m of mantras) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return map;
  }, [mantras]);

  if (mantras.length === 0) {
    return (
      <p className="text-sm text-[#7A6651] py-6 text-center">
        Mantra library unavailable
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((cat) => {
        const list = grouped.get(cat);
        if (!list || list.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7B2C2C] font-bold mb-2">
              {CATEGORY_LABEL[cat]}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {list.map((m) => (
                <button
                  key={m.transliteration}
                  onClick={() => onSelect(m)}
                  className="text-left p-3 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] hover:border-[#7B2C2C]/40 hover:bg-white transition-colors"
                >
                  <p className="font-playfair text-base text-[#7B2C2C] leading-snug mb-0.5 truncate">
                    {m.sanskrit}
                  </p>
                  <p className="text-xs text-[#5A4A3A] italic truncate">
                    {m.transliteration}
                  </p>
                  <p className="text-[11px] text-[#7A6651] mt-1 truncate">
                    {m.english}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreateCounterModal({
  mantras,
  onClose,
  onCreate,
}: {
  mantras: Mantra[];
  onClose: () => void;
  onCreate: (data: {
    name: string;
    mantraSanskrit?: string;
    mantraEnglish?: string;
    targetCount?: number;
    deityKey?: string;
  }) => void;
}) {
  const [picked, setPicked] = useState<Mantra | null>(null);
  const [customName, setCustomName] = useState("");
  const [customSanskrit, setCustomSanskrit] = useState("");
  const [target, setTarget] = useState<number>(108);
  const [mode, setMode] = useState<"library" | "custom">("library");

  const handleCreate = () => {
    if (mode === "library" && picked) {
      onCreate({
        name: picked.transliteration,
        mantraSanskrit: picked.sanskrit,
        mantraEnglish: picked.english,
        targetCount: target,
        deityKey: picked.deityKey,
      });
    } else if (mode === "custom" && customName.trim()) {
      onCreate({
        name: customName.trim(),
        mantraSanskrit: customSanskrit.trim() || undefined,
        targetCount: target,
      });
    }
  };

  const canCreate =
    (mode === "library" && picked) ||
    (mode === "custom" && customName.trim().length > 0);

  return (
    <Modal onClose={onClose}>
      <h3 className="font-playfair text-xl font-bold text-[#2A1410] mb-1">
        New Japa Counter
      </h3>
      <p className="text-xs text-[#7A6651] mb-5">
        Pick a mantra from the library or enter your own
      </p>

      <div className="flex items-center gap-1 bg-[#FBF6EC] border border-[#E5D9B7] rounded-xl p-1 mb-5">
        <button
          onClick={() => setMode("library")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            mode === "library"
              ? "bg-white text-[#7B2C2C] shadow-sm"
              : "text-[#7A6651]"
          }`}
        >
          From library
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            mode === "custom"
              ? "bg-white text-[#7B2C2C] shadow-sm"
              : "text-[#7A6651]"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "library" ? (
        <div className="mb-5 max-h-[40vh] overflow-y-auto pr-1">
          <MantraGrid mantras={mantras} onSelect={(m) => setPicked(m)} />
          {picked && (
            <div className="mt-3 p-3 rounded-xl bg-[#7B2C2C]/5 border border-[#7B2C2C]/20">
              <p className="text-[10px] uppercase tracking-wider text-[#7B2C2C] font-bold mb-1">
                Selected
              </p>
              <p className="font-playfair text-base text-[#2A1410]">
                {picked.transliteration}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-1.5">
              Counter name
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Gayatri"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white text-sm text-[#2A1410] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-1.5">
              Mantra (Sanskrit / Devanagari, optional)
            </label>
            <input
              type="text"
              placeholder="ॐ नमः शिवाय"
              value={customSanskrit}
              onChange={(e) => setCustomSanskrit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white text-base font-playfair text-[#2A1410] outline-none transition-colors"
            />
          </div>
        </div>
      )}

      <div className="mb-5">
        <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-2">
          Target count
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {[27, 54, 108, 1008].map((val) => (
            <button
              key={val}
              onClick={() => setTarget(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                target === val
                  ? "bg-[#7B2C2C] text-white"
                  : "bg-[#FBF6EC] border border-[#E5D9B7] text-[#5A4A3A] hover:border-[#7B2C2C]/40"
              }`}
            >
              {val.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          min={1}
          className="w-full px-3 py-2 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white text-sm text-[#2A1410] outline-none transition-colors"
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={!canCreate}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check size={15} />
        Create counter
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full text-center text-xs text-[#7A6651] hover:text-[#2A1410] py-2"
      >
        Cancel
      </button>
    </Modal>
  );
}

function CreateGoalModal({
  counters,
  mantras,
  onClose,
  onCreate,
}: {
  counters: Counter[];
  mantras: Mantra[];
  onClose: () => void;
  onCreate: (data: {
    mantraSanskrit: string;
    targetCount: number;
    period: "daily" | "weekly" | "monthly";
  }) => void;
}) {
  const candidates = useMemo(() => {
    const fromCounters = counters
      .filter((c) => c.mantraSanskrit)
      .map((c) => c.mantraSanskrit as string);
    const fromMantras = mantras.map((m) => m.sanskrit);
    return Array.from(new Set([...fromCounters, ...fromMantras]));
  }, [counters, mantras]);

  const [mantra, setMantra] = useState(candidates[0] || "");
  const [target, setTarget] = useState(108);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <Modal onClose={onClose}>
      <h3 className="font-playfair text-xl font-bold text-[#2A1410] mb-1">
        New Japa Goal
      </h3>
      <p className="text-xs text-[#7A6651] mb-5">
        Set a target count over a daily, weekly, or monthly window
      </p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-1.5">
            Mantra
          </label>
          {candidates.length > 0 ? (
            <select
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white font-playfair text-base text-[#2A1410] outline-none transition-colors"
            >
              {candidates.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              placeholder="ॐ नमः शिवाय"
              className="w-full px-3 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white font-playfair text-base text-[#2A1410] outline-none transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-1.5">
            Target count
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#E5D9B7] focus:border-[#7B2C2C] focus:bg-white text-sm text-[#2A1410] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#7A6651] font-bold mb-2">
            Period
          </label>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  period === p
                    ? "bg-[#7B2C2C] text-white"
                    : "bg-[#FBF6EC] border border-[#E5D9B7] text-[#5A4A3A] hover:border-[#7B2C2C]/40"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onCreate({ mantraSanskrit: mantra, targetCount: target, period })}
        disabled={!mantra.trim() || target < 1}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check size={15} />
        Create goal
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full text-center text-xs text-[#7A6651] hover:text-[#2A1410] py-2"
      >
        Cancel
      </button>
    </Modal>
  );
}

/* ============================================================
   Summary stat tile (used in hero card)
   ============================================================ */
function SummaryStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "burgundy" | "ember" | "leaf" | "gold";
}) {
  const tones: Record<string, string> = {
    burgundy: "text-[#7B2C2C] bg-[#7B2C2C]/8",
    ember: "text-[#A8581F] bg-[#E8B86E]/15",
    leaf: "text-[#3A6B4F] bg-[#3A6B4F]/12",
    gold: "text-[#C8902F] bg-[#C8902F]/15",
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${tones[tone]} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-playfair text-xl font-bold text-[#2A1410] tabular-nums truncate">
          {value}
        </p>
        <p className="text-[11px] text-[#7A6651]">{label}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Guest experience — preview + sign-in CTA
   ============================================================ */
function GuestJapa({ mantras }: { mantras: Mantra[] }) {
  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Sparkles size={12} />
              Mantra Counter
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
              Japa
            </h1>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
              Track your daily mantra recitations. Each turn of the mala is 108
              beads — sacred, steady, returning.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-10 md:py-14 max-w-5xl mx-auto">
        <div className="rounded-2xl bg-white border border-[#E5D9B7] p-6 sm:p-8 mb-10">
          <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h2 className="font-playfair text-2xl font-bold text-[#2A1410] mb-2">
                Sign in to begin
              </h2>
              <p className="text-sm text-[#5A4A3A] leading-relaxed">
                Create custom mala counters with mala-style increment buttons
                (+1, +5, +27, +108), set goals, and track your daily streak.
                Your sadhana, saved.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7B2C2C] text-white text-sm font-semibold hover:bg-[#6A2424] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#E5D9B7] text-[#2A1410] text-sm font-semibold hover:border-[#7B2C2C]/40 transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2A1410]">
            Mantra Library
          </h2>
          <p className="text-sm text-[#7A6651] mt-1">
            Twenty traditional mantras you can use as a starting point
          </p>
        </div>

        <MantraGrid mantras={mantras} onSelect={() => {}} />
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import {
  Plus,
  RotateCcw,
  Trash2,
  Loader2,
  Moon,
  Target,
  Flame,
  BarChart3,
  History,
  TrendingUp,
  Check,
} from 'lucide-react';
import { dhikrAPI } from '~/services/api';
import { useAuth } from '~/contexts/AuthContext';
import type { DhikrCounter, DhikrGoal, DhikrStats, DhikrHistoryEntry, DhikrPhrase } from '~/types';
import { JsonLd } from '~/components/JsonLd';

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${API_BASE}/api/v1/islam/dhikr/phrases`);
    if (!res.ok) return { phrases: [] };
    const json = await res.json();
    return { phrases: json.data || json };
  } catch {
    return { phrases: [] };
  }
}

const PRESET_DHIKR = [
  { name: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', phrase: 'SubhanAllah', target: 33 },
  { name: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', phrase: 'Alhamdulillah', target: 33 },
  { name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', phrase: 'Allahu Akbar', target: 34 },
  {
    name: 'La ilaha illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    phrase: 'La ilaha illallah',
    target: 100,
  },
  { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', phrase: 'Astaghfirullah', target: 100 },
];

export default function DhikrPage() {
  const { user } = useAuth();
  const { phrases: loaderPhrases } = useLoaderData<typeof loader>();
  const [counters, setCounters] = useState<DhikrCounter[]>([]);
  const [active, setActive] = useState<DhikrCounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [localCount, setLocalCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [newTarget, setNewTarget] = useState(33);

  // New state for stats, goals, history
  const [stats, setStats] = useState<DhikrStats | null>(null);
  const [goals, setGoals] = useState<DhikrGoal[]>([]);
  const [history, setHistory] = useState<DhikrHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'goals' | 'stats' | 'history'>('goals');
  const [phrases, setPhrases] = useState<DhikrPhrase[]>(loaderPhrases || []);
  const [phrasesLoading, setPhrasesLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [countersRes, statsRes, goalsRes, historyRes] = await Promise.allSettled([
        dhikrAPI.getCounters(),
        dhikrAPI.getStats(),
        dhikrAPI.getGoals(),
        dhikrAPI.getHistory(),
      ]);

      if (countersRes.status === 'fulfilled') {
        const data = Array.isArray(countersRes.value.data)
          ? countersRes.value.data
          : countersRes.value.data?.data || [];
        setCounters(data);
        if (data.length > 0 && !active) {
          setActive(data[0]);
          setLocalCount(data[0].count || 0);
        }
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data || null);
      }
      if (goalsRes.status === 'fulfilled') {
        const gd = goalsRes.value.data?.data || goalsRes.value.data;
        setGoals(Array.isArray(gd) ? gd : []);
      }
      if (historyRes.status === 'fulfilled') {
        const hd = historyRes.value.data?.data || historyRes.value.data;
        setHistory(Array.isArray(hd) ? hd : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (showCreate && user && phrases.length === 0 && !loaderPhrases?.length) {
      setPhrasesLoading(true);
      dhikrAPI
        .getPhrases()
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setPhrases(data);
        })
        .catch(() => setPhrases([]))
        .finally(() => setPhrasesLoading(false));
    }
  }, [showCreate, user, phrases.length]);

  // Load localStorage count when active counter changes
  useEffect(() => {
    if (active) {
      const stored = localStorage.getItem(`dhikr_${active.id}`);
      const count = stored ? parseInt(stored, 10) : active.count || 0;
      setLocalCount(count);
    }
  }, [active?.id]);

  const handleIncrement = () => {
    if (!active) return;
    const target = active.targetCount || 33;
    const next = localCount + 1;
    if (next > target) return;

    setLocalCount(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 200);

    // Save to localStorage for persistence
    localStorage.setItem(`dhikr_${active.id}`, next.toString());
  };

  const handleReset = () => {
    if (!active) return;
    setLocalCount(0);
    localStorage.removeItem(`dhikr_${active.id}`);
  };

  const handleLogDhikr = async () => {
    if (!active || localCount === 0) return;
    setIsLogging(true);
    try {
      await dhikrAPI.updateCounter(active.id, localCount);
      setCounters(prev => prev.map(c => (c.id === active.id ? { ...c, count: localCount } : c)));
      // Clear localStorage after successful log
      localStorage.removeItem(`dhikr_${active.id}`);
      // Reset UI
      setLocalCount(0);
    } catch (error) {
      console.error('Failed to log dhikr:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await dhikrAPI.deleteCounter(id);
      setCounters(prev => prev.filter(c => c.id !== id));
      if (active?.id === id) {
        setActive(null);
        setLocalCount(0);
      }
    } catch {}
  };

  const handleCreate = async (name: string, phrase: string, target: number) => {
    if (!user || !name.trim() || !phrase.trim()) return;
    try {
      const res = await dhikrAPI.createCounter(name, phrase, target);
      const newCounter = res.data?.data || res.data;
      setCounters(prev => [...prev, newCounter]);
      setActive(newCounter);
      setLocalCount(0);
      setShowCreate(false);
      setNewName('');
      setNewPhrase('');
      setNewTarget(33);
    } catch {}
  };

  const handleCreateGoal = async (
    phrase: string,
    targetCount: number,
    period: 'daily' | 'weekly' | 'monthly',
  ) => {
    if (!user || !phrase.trim()) return;
    try {
      const res = await dhikrAPI.createGoal(phrase, targetCount, period);
      const newGoal = res.data?.data || res.data;
      setGoals(prev => [...prev, newGoal]);
      setShowCreateGoal(false);
    } catch {}
  };

  const selectCounter = (counter: DhikrCounter) => {
    setActive(counter);
    setLocalCount(counter.count || 0);
  };

  const target = active?.targetCount || 33;
  const progress = Math.min((localCount / target) * 100, 100);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (progress / 100) * circumference;
  const isComplete = localCount >= target;

  if (!user) return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Siraat Dhikr Counter",
        "description": "Track your daily dhikr with customizable counters, goals, and streaks.",
        "url": "https://www.siraat.website/dhikr",
        "applicationCategory": "ReligiousApp",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      <GuestDhikr />
    </>
  );

  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Siraat Dhikr Counter",
        "description": "Track your daily dhikr with customizable counters, goals, and streaks.",
        "url": "https://www.siraat.website/dhikr",
        "applicationCategory": "ReligiousApp",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left — Info */}
            <div className="animate-fade-in-up">
              <Moon size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3">
                Dhikr Counter
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-md mb-6">
                Remember Allah with every breath. Track your daily remembrance, set goals, and build
                a consistent practice.
              </p>

              {/* Quick stat badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  <Moon size={12} className="text-gold-light" />
                  {stats?.totalCount || 0} total
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  <Flame size={12} className="text-amber-400" />
                  {stats?.currentStreak || 0} day streak
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  <Target size={12} className="text-emerald-300" />
                  {counters.length} counter{counters.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Right — Active Counter in Glass Card */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {active ? (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/15">
                  <p className="text-white/90 text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Active Counter
                  </p>
                  <p className="text-white text-sm font-semibold mb-1">{active.name}</p>
                  {(active.phraseArabic || active.phraseEnglish) && (
                    <p className="font-amiri text-xl sm:text-2xl text-white/90 mb-4" dir="rtl">
                      {active.phraseArabic || active.phraseEnglish}
                    </p>
                  )}

                  {/* Circular counter */}
                  <div className="relative inline-flex items-center justify-center mb-4 w-full">
                    <svg width="200" height="200" className="transform -rotate-90 mx-auto">
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="5"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke={isComplete ? '#C8A55A' : 'rgba(255,255,255,0.8)'}
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="progress-ring-circle"
                      />
                    </svg>
                    <button
                      onClick={handleIncrement}
                      className={`absolute inset-0 flex flex-col items-center justify-center select-none transition-transform ${pulse ? 'scale-95' : ''}`}
                      disabled={isComplete}>
                      <span
                        className={`text-5xl sm:text-6xl font-bold text-white tabular-nums ${pulse ? 'animate-count-pulse' : ''}`}>
                        {localCount}
                      </span>
                      <span className="text-[11px] text-white/90 mt-0.5">of {target}</span>
                    </button>
                  </div>

                  <p className="text-white/90 text-xs text-center mb-4">
                    Tap the counter to increment
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/90 hover:bg-white/15 text-xs font-medium transition-colors">
                      <RotateCcw size={13} />
                      Reset
                    </button>
                  </div>

                  {isComplete && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-linear-to-tl mask-from-gold mask-to-gold-dark text-lg font-semibold text-white text-center">
                        ✨ Target reached! MashaAllah! ✨
                      </div>
                      {user && (
                        <button
                          onClick={handleLogDhikr}
                          disabled={isLogging}
                          className="w-full px-4 py-3 rounded-xl bg-linear-to-r from-primary to-primary/80 text-white font-semibold text-sm hover:shadow-lg hover:from-primary/90 hover:to-primary/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {isLogging ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Logging...
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              Log Dhikr Record
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/15 text-center">
                  <Moon size={36} className="text-white/80 mx-auto mb-3" />
                  <p className="text-white/90 text-sm mb-4">No counter selected</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
                    <Plus size={15} />
                    Create Counter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="container-faith -mt-6 relative z-10 mb-8">
        <div className="card-elevated p-4 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Moon size={18} />}
              label="Total Recitations"
              value={stats?.totalCount ?? 0}
              color="text-primary bg-primary/10"
            />
            <StatCard
              icon={<Flame size={18} />}
              label="Current Streak"
              value={`${stats?.currentStreak ?? 0} days`}
              color="text-amber-600 bg-amber-500/10"
            />
            <StatCard
              icon={<Target size={18} />}
              label="Active Goals"
              value={goals.length}
              color="text-violet-600 bg-violet-500/10"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Daily Average"
              value={stats?.dailyAverage ?? 0}
              color="text-success bg-success/10"
            />
          </div>
        </div>
      </section>
      <div className="container-faith pb-12 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-text-muted text-sm">Loading counters...</p>
          </div>
        ) : (
          <>
            {/* Counters Grid */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Your Counters</h2>
                <p className="section-subtitle">
                  {counters.length} counter{counters.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-secondary text-sm py-2 px-4">
                <Plus size={14} />
                New
              </button>
            </div>

            {counters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children mb-12">
                {counters.map(counter => {
                  const ct = counter.targetCount || 33;
                  const cp = Math.min((counter.count / ct) * 100, 100);
                  const isActiveCard = active?.id === counter.id;
                  const isDone = cp >= 100;
                  return (
                    <button
                      key={counter.id}
                      onClick={() => selectCounter(counter)}
                      className={`card p-5 text-left transition-all ${
                        isActiveCard ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-border'
                      }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-text truncate">
                              {counter.name}
                            </h3>
                            {isDone && (
                              <span className="badge badge-gold text-[11px]">Complete</span>
                            )}
                          </div>
                          {counter.phraseArabic && (
                            <p
                              className="font-amiri text-base text-text-secondary truncate"
                              dir="rtl">
                              {counter.phraseArabic}
                            </p>
                          )}
                          {counter.phraseEnglish && !counter.phraseArabic && (
                            <p className="text-xs text-text-muted">{counter.phraseEnglish}</p>
                          )}
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(counter.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="w-full bg-border-light h-1.5 rounded-full overflow-hidden mb-2 mt-3">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-gold' : 'bg-primary'}`}
                          style={{ width: `${cp}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>
                          {counter.count} / {ct}
                        </span>
                        <span>{Math.round(cp)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="card-elevated p-10 text-center mb-12">
                <Moon size={36} className="text-text-muted mx-auto mb-3" />
                <h3 className="text-base font-semibold text-text mb-1">Start your dhikr journey</h3>
                <p className="text-sm text-text-muted mb-4">
                  Create your first counter to begin tracking
                </p>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  <Plus size={16} />
                  Create Counter
                </button>
              </div>
            )}

            {/* Tabbed Section */}
            <div className="flex items-center gap-1 bg-bg rounded-xl p-1 mb-6">
              {(['goals', 'stats', 'history'] as const).map(tab => {
                const icons = { goals: Target, stats: BarChart3, history: History };
                const labels = { goals: 'Goals', stats: 'Statistics', history: 'History' };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                      activeTab === tab
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-text-muted hover:text-text'
                    }`}>
                    <Icon size={15} />
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'goals' && (
              <GoalsTab goals={goals} onCreateGoal={() => setShowCreateGoal(true)} />
            )}
            {activeTab === 'stats' && <StatsTab stats={stats} />}
            {activeTab === 'history' && <HistoryTab history={history} />}
          </>
        )}
      </div>
      {/* Create Counter Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <h3 className="text-lg font-semibold text-text mb-5">New Dhikr Counter</h3>

          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-semibold">
            Quick Start
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5 min-h-[140px]">
            {phrasesLoading ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : phrases.length > 0 ? (
              phrases.map(p => {
                const targetMap: Record<string, number> = {
                  tasbih: 33,
                  istighfar: 100,
                  tawhid: 100,
                  salawat: 33,
                  istiadhah: 33,
                  dua: 7,
                  general: 33,
                };
                const target = targetMap[p.category] || 33;
                return (
                  <button
                    key={p.transliteration}
                    onClick={() => handleCreate(p.transliteration, p.arabic, target)}
                    className="card p-3 text-left hover:border-primary/30 transition-colors">
                    <p className="font-amiri text-lg text-text mb-0.5" dir="rtl">
                      {p.arabic}
                    </p>
                    <p className="text-sm font-semibold text-text">{p.transliteration}</p>
                    <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                      <Target size={10} /> {target}x
                    </p>
                  </button>
                );
              })
            ) : (
              PRESET_DHIKR.map(p => (
                <button
                  key={p.name}
                  onClick={() => handleCreate(p.name, p.phrase, p.target)}
                  className="card p-3 text-left hover:border-primary/30 transition-colors">
                  <p className="font-amiri text-lg text-text mb-0.5" dir="rtl">
                    {p.arabic}
                  </p>
                  <p className="text-sm font-semibold text-text">{p.name}</p>
                  <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                    <Target size={10} /> {p.target}x
                  </p>
                </button>
              ))
            )}
          </div>

          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-semibold">
            Or Custom
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Counter name (e.g. Morning Dhikr)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Phrase (e.g. SubhanAllah)"
              value={newPhrase}
              onChange={e => setNewPhrase(e.target.value)}
              className="input-field"
            />
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Target"
                value={newTarget}
                onChange={e => setNewTarget(Number(e.target.value))}
                className="input-field"
                min={1}
              />
              <button
                onClick={() => handleCreate(newName, newPhrase || newName, newTarget)}
                disabled={!newName.trim()}
                className="btn-primary shrink-0 disabled:opacity-50">
                Create
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(false)}
            className="mt-4 w-full text-center text-sm text-text-muted hover:text-text py-2">
            Cancel
          </button>
        </Modal>
      )}
      {/* Create Goal Modal */}
      {showCreateGoal && (
        <CreateGoalModal
          counters={counters}
          onClose={() => setShowCreateGoal(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
}

/* ================================
   Sub-Components
   ================================ */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-text tabular-nums">{value}</p>
        <p className="text-[11px] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function GoalsTab({ goals, onCreateGoal }: { goals: DhikrGoal[]; onCreateGoal: () => void }) {
  if (goals.length === 0) {
    return (
      <div className="card-elevated p-10 text-center">
        <Target size={36} className="text-text-muted mx-auto mb-3" />
        <h3 className="text-base font-semibold text-text mb-1">Set your first goal</h3>
        <p className="text-sm text-text-muted mb-4">
          Create daily, weekly, or monthly dhikr goals to build consistency
        </p>
        <button onClick={onCreateGoal} className="btn-primary">
          <Plus size={16} />
          Create Goal
        </button>
      </div>
    );
  }

  const periodBadge: Record<string, string> = {
    daily: 'badge badge-primary',
    weekly: 'badge badge-gold',
    monthly: 'badge badge-success',
  };

  const periodLabel: Record<string, string> = {
    daily: 'today',
    weekly: 'this week',
    monthly: 'this month',
  };

  return (
    <div>
      <div className="space-y-3 mb-6">
        {goals.map(goal => {
          const current = goal.currentCount ?? 0;
          const percent = goal.progressPercent ?? Math.min(Math.round((current / goal.targetCount) * 100), 100);
          const done = goal.isComplete ?? current >= goal.targetCount;
          const daysLeft = goal.daysRemaining;

          return (
            <div key={goal.id} className={`card-elevated p-5 transition-all ${done ? 'ring-1 ring-success/30' : ''}`}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  {goal.phraseArabic && (
                    <p className="font-amiri text-lg text-text mb-0.5 truncate" dir="rtl">
                      {goal.phraseArabic}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-text">
                    {goal.phraseEnglish || 'Dhikr Goal'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {done && (
                    <span className="badge badge-success flex items-center gap-1">
                      <Check size={10} />
                      Done
                    </span>
                  )}
                  <span className={periodBadge[goal.period] || 'badge badge-primary'}>
                    {goal.period}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="w-full bg-border-light h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className={`font-medium tabular-nums ${done ? 'text-success' : 'text-text'}`}>
                  {current.toLocaleString()} / {goal.targetCount.toLocaleString()}
                  <span className="text-text-muted font-normal ml-1">
                    {periodLabel[goal.period] || ''}
                  </span>
                </span>
                <span>
                  {done
                    ? '🎉 Complete!'
                    : daysLeft !== undefined
                    ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                    : goal.startDate
                    ? `Started ${new Date(goal.startDate).toLocaleDateString()}`
                    : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onCreateGoal} className="btn-secondary w-full">
        <Plus size={15} />
        Add Goal
      </button>
    </div>
  );
}

function StatsTab({ stats }: { stats: DhikrStats | null }) {
  if (!stats) {
    return (
      <div className="card-elevated p-10 text-center">
        <BarChart3 size={36} className="text-text-muted mx-auto mb-3" />
        <h3 className="text-base font-semibold text-text mb-1">No stats yet</h3>
        <p className="text-sm text-text-muted">Start counting dhikr to see your statistics</p>
      </div>
    );
  }

  const totalCount = (stats as any).totalCount ?? (stats as any).totalDhikr ?? 0;
  const byPhrase: Array<{ phraseArabic: string; phraseEnglish: string; count: number }> =
    (stats as any).byPhrase ?? [];

  return (
    <div className="space-y-4">
      {/* 4-card stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-elevated p-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Moon size={17} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-text tabular-nums">{totalCount.toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-1">Total Recitations</p>
        </div>
        <div className="card-elevated p-5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
            <Flame size={17} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-text tabular-nums">{stats.currentStreak ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Current Streak</p>
        </div>
        <div className="card-elevated p-5">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center mb-3">
            <TrendingUp size={17} className="text-success" />
          </div>
          <p className="text-2xl font-bold text-text tabular-nums">{stats.dailyAverage ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Daily Average</p>
        </div>
        <div className="card-elevated p-5">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
            <Target size={17} className="text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-text tabular-nums">{stats.longestStreak ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Longest Streak</p>
        </div>
      </div>

      {/* Phrase breakdown */}
      {byPhrase.length > 0 && (
        <div className="card-elevated p-5">
          <h4 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-primary" />
            Recitation Breakdown
          </h4>
          <div className="space-y-3">
            {byPhrase.slice(0, 5).map((p) => {
              const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
              return (
                <div key={p.phraseArabic}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-text truncate">{p.phraseEnglish}</span>
                      <span className="font-amiri text-sm text-text-muted" dir="rtl">{p.phraseArabic}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary ml-2 shrink-0">
                      {p.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak summary row */}
      <div className="card-elevated p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Flame size={17} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Best Streak</p>
            <p className="text-xs text-text-muted">Your longest consecutive days</p>
          </div>
        </div>
        <p className="text-xl font-bold text-text tabular-nums">
          {stats.longestStreak ?? 0}
          <span className="text-xs font-normal text-text-muted ml-1">days</span>
        </p>
      </div>
    </div>
  );
}

function HistoryTab({ history }: { history: DhikrHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="card-elevated p-10 text-center">
        <History size={36} className="text-text-muted mx-auto mb-3" />
        <h3 className="text-base font-semibold text-text mb-1">No history yet</h3>
        <p className="text-sm text-text-muted">Your dhikr activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map(entry => (
        <div key={entry.id} className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Moon size={16} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text">{entry.phrase || 'Dhikr'}</p>
              {entry.phraseArabic && (
                <span className="font-amiri text-sm text-text-muted">{entry.phraseArabic}</span>
              )}
            </div>
            <p className="text-xs text-text-muted">{entry.count} recitations</p>
          </div>
          <p className="text-xs text-text-muted shrink-0">
            {new Date(entry.date || entry.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-down max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CreateGoalModal({
  counters,
  onClose,
  onCreate,
}: {
  counters: DhikrCounter[];
  onClose: () => void;
  onCreate: (phrase: string, targetCount: number, period: 'daily' | 'weekly' | 'monthly') => void;
}) {
  const [phrase, setPhrase] = useState(counters[0]?.name || '');
  const [targetCount, setTargetCount] = useState(100);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold text-text mb-5">Create Dhikr Goal</h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
            Phrase
          </label>
          {counters.length > 0 ? (
            <select
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              className="input-field">
              {counters.map(c => (
                <option key={c.id} value={c.phraseEnglish || c.name}>
                  {c.name} {c.phraseArabic ? `— ${c.phraseArabic}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. SubhanAllah"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              className="input-field"
            />
          )}
        </div>

        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
            Target Count
          </label>
          <input
            type="number"
            value={targetCount}
            onChange={e => setTargetCount(Number(e.target.value))}
            className="input-field"
            min={1}
          />
        </div>

        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
            Period
          </label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-primary text-white'
                    : 'bg-bg text-text-secondary hover:bg-border-light'
                }`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onCreate(phrase, targetCount, period)}
          disabled={!phrase.trim()}
          className="btn-primary w-full disabled:opacity-50">
          <Check size={16} />
          Create Goal
        </button>
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full text-center text-sm text-text-muted hover:text-text py-2">
        Cancel
      </button>
    </Modal>
  );
}

/* ================================
   Guest Mode
   ================================ */

function GuestDhikr() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [count, setCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [pulse, setPulse] = useState(false);

  const preset = PRESET_DHIKR[selectedPreset];
  const target = preset.target;
  const progress = Math.min((count / target) * 100, 100);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (progress / 100) * circumference;
  const isComplete = count >= target;

  const handleTap = () => {
    if (isComplete) return;
    setCount(c => c + 1);
    setSessionTotal(s => s + 1);
    setPulse(true);
    setTimeout(() => setPulse(false), 200);
  };

  const switchPreset = (index: number) => {
    setSelectedPreset(index);
    setCount(0);
  };

  return (
    <div className="bg-gradient-surface min-h-screen">
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14 text-center">
          <Moon size={28} className="text-gold-light mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">Dhikr Counter</h1>
          <p className="text-white/90 text-sm">Remember Allah with every breath</p>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12 max-w-md mx-auto">
        {/* Preset Switcher */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
          {PRESET_DHIKR.map((p, i) => (
            <button
              key={p.name}
              onClick={() => switchPreset(i)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedPreset === i
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border-light text-text-secondary hover:border-primary/30'
              }`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="card-elevated p-8 sm:p-10 text-center animate-fade-in-up">
          <p className="font-amiri text-2xl sm:text-3xl text-text-secondary mb-1" dir="rtl">
            {preset.arabic}
          </p>
          <p className="text-sm text-text-muted mb-6">{preset.name}</p>

          <div className="relative inline-flex items-center justify-center mb-6">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-border-light"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={`${isComplete ? 'text-gold' : 'text-primary'} progress-ring-circle`}
              />
            </svg>
            <button
              onClick={handleTap}
              className={`absolute inset-0 flex flex-col items-center justify-center select-none transition-transform ${pulse ? 'scale-95' : ''}`}
              disabled={isComplete}>
              <span
                className={`text-5xl sm:text-6xl font-bold text-text tabular-nums ${pulse ? 'animate-count-pulse' : ''}`}>
                {count}
              </span>
              <span className="text-xs text-text-muted mt-1">of {target}</span>
            </button>
          </div>

          <p className="text-xs text-text-muted mb-4">Tap to count</p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCount(0)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/3 text-text-secondary hover:bg-black/6 text-sm font-medium transition-colors">
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          {isComplete && (
            <div className="mt-5 p-3 rounded-xl bg-gold/10 border border-gold/20 text-gold-dark text-sm font-semibold">
              Target reached! MashaAllah!
            </div>
          )}

          {sessionTotal > 0 && (
            <p className="mt-4 text-xs text-text-muted">
              Session total: {sessionTotal} recitations
            </p>
          )}
        </div>

        {/* Educational Introduction */}
        <div className="card-elevated p-6 md:p-8 mt-6">
          <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">What Is Dhikr? The Practice of Remembering Allah</h2>
          <div className="space-y-3">
            <p className="text-text-secondary text-sm leading-relaxed">
              Dhikr (also spelled zikr or thikr) is the Islamic practice of remembering and glorifying Allah through the repetition of sacred phrases, supplications, and divine names. Rooted in the Quran's instruction "Remember Me, and I will remember you" (2:152), dhikr is considered one of the most beloved acts of worship in Islam. It can be performed at any time and in any place, making it an accessible and deeply personal form of devotion for Muslims around the world.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Common dhikr phrases include SubhanAllah ("Glory be to Allah"), Alhamdulillah ("All praise is due to Allah"), Allahu Akbar ("Allah is the Greatest"), La ilaha illallah ("There is no deity except Allah"), and Astaghfirullah ("I seek forgiveness from Allah"). The Prophet Muhammad (peace be upon him) recommended reciting these phrases regularly, often in sets of 33 or 100. Consistent dhikr practice brings spiritual tranquility, strengthens one's connection with Allah, purifies the heart, and serves as a source of protection and inner peace throughout the day.
            </p>
          </div>
        </div>

        {/* Sign in CTA */}
        <div className="card-elevated p-5 mt-6 border border-gold/10">
          <p className="text-sm font-semibold text-text mb-1">Save your progress</p>
          <p className="text-xs text-text-muted mb-3">
            Sign in to save counters, set goals, and track your spiritual journey.
          </p>
          <Link to="/auth/login" className="btn-primary w-full text-center text-sm">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

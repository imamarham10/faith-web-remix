import { useState, useEffect, useRef } from "react";
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Info,
  Loader2,
  Pause,
  Play,
  X,
} from "lucide-react";
import { hinduScripturesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

interface VerseTranslation {
  id?: string;
  languageCode: string;
  authorName?: string;
  text: string;
}

interface ChapterVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  isFeatured?: boolean;
  translations?: VerseTranslation[];
}

interface Chapter {
  id: string;
  chapterNumber: number;
  nameSanskrit: string;
  nameEnglish: string;
  verses: ChapterVerse[];
}

interface TextChapterSummary {
  id: string;
  chapterNumber: number;
  nameSanskrit: string;
  nameEnglish: string;
  verseCount: number;
}

interface TextDetail {
  slug: string;
  nameEnglish: string;
  nameSanskrit: string;
  chapters: TextChapterSummary[];
}

// Canonical verse counts of the standard Gita recension — used to detect
// partially-seeded chapters (v1 ships full text for chapters 1–2 only).
const GITA_EXPECTED_VERSES: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

// ---------- Loader (SSR, public data) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const { slug, chapterNumber } = params;
  if (!slug || !chapterNumber) return { chapter: null, text: null };

  const get = async (path: string) => {
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    } catch {
      return null;
    }
  };

  const [chapter, text] = await Promise.all([
    get(`/api/v1/hindu/scriptures/texts/${slug}/chapters/${chapterNumber}?lang=en`),
    get(`/api/v1/hindu/scriptures/texts/${slug}`),
  ]);

  return {
    chapter: chapter && chapter.chapterNumber != null ? (chapter as Chapter) : null,
    text: text && text.slug ? (text as TextDetail) : null,
  };
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta({
  data,
  params,
}: {
  data?: { chapter: Chapter | null; text: TextDetail | null };
  params: { slug?: string; chapterNumber?: string };
}) {
  const textName = data?.text?.nameEnglish || "Bhagavad Gita";
  const chapterNum = data?.chapter?.chapterNumber ?? params.chapterNumber;
  const chapterName = data?.chapter?.nameEnglish;
  const isRamayana = (params.slug || "").startsWith("ramayana-");
  // Ramayana chapter names already read "Sundara Kanda, Sarga N" — avoid
  // "Chapter N — ..., Sarga N" duplication.
  const title = isRamayana && chapterName
    ? `${chapterName} — Valmiki Ramayana in Sanskrit & English | Siraat`
    : chapterName
      ? `${textName} Chapter ${chapterNum} — ${chapterName} | Siraat`
      : `${textName} Chapter ${chapterNum} | Siraat`;
  const description = isRamayana && chapterName
    ? `Read ${chapterName} of the Valmiki Ramayana shloka by shloka with Devanagari Sanskrit, IAST transliteration, and M.N. Dutt's English translation.`
    : chapterName
      ? `Read ${textName} Chapter ${chapterNum} (${chapterName}) verse by verse with Devanagari Sanskrit, transliteration, and English translation.`
      : `Read ${textName} Chapter ${chapterNum} with Sanskrit, transliteration, and English translation.`;
  const url = `${APP_URL}/hindu/scriptures/${params.slug}/${params.chapterNumber}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Chapter narration ----------

interface ChapterAudio {
  reciterSlug: string;
  name: string;
  language: string;
  credit: string | null;
  url: string;
}

// ---------- Page ----------

export default function ScriptureChapterPage() {
  const { slug = "bhagavad-gita", chapterNumber } = useParams();
  const { chapter: loaderChapter, text: loaderText } = useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chapter, setChapter] = useState<Chapter | null>(loaderChapter);
  const [text, setText] = useState<TextDetail | null>(loaderText);
  const [loading, setLoading] = useState(!loaderChapter);
  const [error, setError] = useState("");

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);

  // Chapter narration (audio)
  const [audioTracks, setAudioTracks] = useState<ChapterAudio[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  useEffect(() => {
    if (!slug || !chapterNumber) return;
    setPlayerOpen(false);
    setTrackIndex(0);
    hinduScripturesAPI
      .getChapterAudio(slug, chapterNumber)
      .then((res) => {
        const data = res.data?.data || res.data;
        setAudioTracks(Array.isArray(data) ? data : []);
      })
      .catch(() => setAudioTracks([]));
  }, [slug, chapterNumber]);

  // Client fetch when SSR loader failed or params change client-side
  useEffect(() => {
    if (!slug || !chapterNumber) return;
    if (loaderChapter && loaderChapter.chapterNumber === Number(chapterNumber)) {
      setChapter(loaderChapter);
      setText(loaderText);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      hinduScripturesAPI.getChapter(slug, chapterNumber),
      hinduScripturesAPI.getText(slug).catch(() => null),
    ])
      .then(([chRes, txtRes]) => {
        const ch = chRes.data?.data || chRes.data;
        const txt = txtRes ? txtRes.data?.data || txtRes.data : null;
        if (ch?.chapterNumber != null) {
          setChapter(ch);
        } else {
          setChapter(null);
          setError("Chapter not found.");
        }
        if (txt?.slug) setText(txt);
      })
      .catch((err) => {
        setChapter(null);
        setError(
          err?.response?.status === 404
            ? "Chapter not found."
            : "Failed to load this chapter. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [slug, chapterNumber, loaderChapter, loaderText]);

  // Load the user's bookmarks so toggles reflect saved state
  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarkedIds(new Set());
      return;
    }
    hinduScripturesAPI
      .getBookmarks()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setBookmarkedIds(
            new Set(
              data
                .map((b: any) => b.verse?.id || b.verseId)
                .filter(Boolean) as string[],
            ),
          );
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Scroll to and highlight ?verse=N
  useEffect(() => {
    const verseParam = searchParams.get("verse");
    if (!verseParam || !chapter || chapter.verses.length === 0) return;
    const verseNum = parseInt(verseParam, 10);
    if (isNaN(verseNum)) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`verse-${verseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedVerse(verseNum);
        setTimeout(() => setHighlightedVerse(null), 15000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [chapter, searchParams]);

  const toggleBookmark = async (verse: ChapterVerse) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const isBookmarked = bookmarkedIds.has(verse.id);
    try {
      if (isBookmarked) {
        await hinduScripturesAPI.deleteBookmark(verse.id);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(verse.id);
          return next;
        });
        setToastMessage("Bookmark removed");
      } else {
        await hinduScripturesAPI.addBookmark(verse.id);
        setBookmarkedIds((prev) => new Set(prev).add(verse.id));
        setToastMessage("Verse saved to bookmarks");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {
      // leave state unchanged on failure
    }
  };

  const chapterNum = Number(chapterNumber);
  const chapterSummaries = text?.chapters || [];
  const totalChapters =
    chapterSummaries.length > 0
      ? Math.max(...chapterSummaries.map((c) => c.chapterNumber))
      : 18;
  const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum < totalChapters ? chapterNum + 1 : null;

  const expectedVerses =
    slug === "bhagavad-gita" ? GITA_EXPECTED_VERSES[chapterNum] : undefined;
  const isPartial =
    !!chapter &&
    expectedVerses != null &&
    chapter.verses.length > 0 &&
    chapter.verses.length < expectedVerses;

  const textName = text?.nameEnglish || "Bhagavad Gita";

  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      {chapter && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              {
                "@type": "ListItem",
                position: 3,
                name: "Scriptures",
                item: `${APP_URL}/hindu/scriptures`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: `${textName} Chapter ${chapter.chapterNumber} — ${chapter.nameEnglish}`,
                item: `${APP_URL}/hindu/scriptures/${slug}/${chapter.chapterNumber}`,
              },
            ],
          }}
        />
      )}

      {/* Bookmark toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#3A0F18] text-white rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
          showToast
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <BookmarkCheck size={16} className="text-[#E8D5A0] shrink-0" />
        {toastMessage}
      </div>

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to={slug === "bhagavad-gita" ? "/hindu/scriptures" : `/hindu/scriptures/${slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            All Chapters
          </Link>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 w-64 bg-white/10 rounded-lg mb-3" />
              <div className="h-5 w-40 bg-white/10 rounded-lg" />
            </div>
          ) : chapter ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm mb-4">
                <BookOpen size={14} className="text-[#E8D5A0]" />
                {textName} · Chapter {chapter.chapterNumber}
              </div>
              <h1 className="font-playfair text-3xl sm:text-4xl font-bold mb-2">
                {chapter.nameEnglish}
              </h1>
              <p
                className="text-2xl sm:text-3xl text-[#E8D5A0] mb-3"
                style={{ fontFamily: "var(--font-devanagari)" }}
                lang="sa"
              >
                {chapter.nameSanskrit}
              </p>
              <p className="text-white/80 text-sm">
                {chapter.verses.length} verse{chapter.verses.length !== 1 ? "s" : ""}
              </p>
              {audioTracks.length > 0 && !playerOpen && (
                <button
                  onClick={() => setPlayerOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-white/12 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Headphones size={15} className="text-[#E8D5A0]" />
                  Listen to this chapter
                </button>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <div className="container-faith py-8 md:py-12 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading verses…</p>
          </div>
        ) : !chapter ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
              Chapter not found
            </h2>
            <p className="text-sm text-[#6B5642] mb-6">
              {error || "This chapter does not exist."}
            </p>
            <Link to="/hindu/scriptures" className="btn-hindu-primary">
              Browse All Chapters
            </Link>
          </div>
        ) : (
          <>
            {/* Partial-content banner */}
            {isPartial && (
              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF1D9] border border-[#E8D5A0] p-4 sm:p-5 mb-6">
                <Info size={18} className="text-[#7A5B19] shrink-0 mt-0.5" />
                <p className="text-sm text-[#7A5B19] leading-relaxed">
                  This chapter currently shows selected key verses — full text
                  coming soon.
                </p>
              </div>
            )}

            {chapter.verses.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E8DCC4] p-10 text-center">
                <BookOpen size={32} className="text-[#9A7B3A] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#3A0F18] mb-1">
                  Verses coming soon
                </h3>
                <p className="text-sm text-[#6B5642] max-w-md mx-auto">
                  The verses of this chapter are being prepared and will be
                  available shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chapter.verses.map((verse) => {
                  const isBookmarked = bookmarkedIds.has(verse.id);
                  const translation = verse.translations?.[0];
                  return (
                    <article
                      key={verse.id}
                      id={`verse-${verse.verseNumber}`}
                      className={`rounded-2xl bg-white border p-5 sm:p-6 shadow-[0_1px_2px_rgba(74,17,25,0.04)] transition-all duration-500 ${
                        highlightedVerse === verse.verseNumber
                          ? "border-[#6B1F2A]/40 ring-2 ring-[#6B1F2A]/30 ring-offset-2 ring-offset-[#FBF6EC]"
                          : "border-[#E8DCC4]"
                      }`}
                    >
                      {/* Verse number (permalink) + bookmark */}
                      <div className="flex items-center justify-between mb-4">
                        <Link
                          to={`/hindu/scriptures/${slug}/${chapter.chapterNumber}/${verse.verseNumber}`}
                          className="w-9 h-9 rounded-lg bg-[#6B1F2A]/8 flex items-center justify-center hover:bg-[#6B1F2A]/15 transition-colors"
                          title={`Verse ${chapter.chapterNumber}.${verse.verseNumber} — Hindi & English meaning`}
                        >
                          <span className="text-xs font-bold text-[#6B1F2A]">
                            {chapter.chapterNumber}.{verse.verseNumber}
                          </span>
                        </Link>
                        <button
                          onClick={() => toggleBookmark(verse)}
                          className="p-2 rounded-lg hover:bg-[#6B1F2A]/5 transition-colors"
                          title={
                            isBookmarked
                              ? "Remove bookmark"
                              : "Bookmark this verse"
                          }
                          aria-label={
                            isBookmarked
                              ? "Remove bookmark"
                              : "Bookmark this verse"
                          }
                        >
                          {isBookmarked ? (
                            <BookmarkCheck size={16} className="text-[#6B1F2A]" />
                          ) : (
                            <Bookmark
                              size={16}
                              className="text-[#9A7B3A] hover:text-[#6B1F2A]"
                            />
                          )}
                        </button>
                      </div>

                      {/* Sanskrit */}
                      {verse.sanskritText && (
                        <p
                          className="text-xl sm:text-2xl text-[#3A0F18] leading-relaxed mb-3 whitespace-pre-line"
                          style={{ fontFamily: "var(--font-devanagari)" }}
                          lang="sa"
                        >
                          {verse.sanskritText}
                        </p>
                      )}

                      {/* Transliteration */}
                      {verse.transliteration && (
                        <p className="text-sm text-[#6B5642] italic leading-relaxed mb-3 whitespace-pre-line">
                          {verse.transliteration}
                        </p>
                      )}

                      {/* Translation */}
                      {translation?.text && (
                        <div className="pt-3 border-t border-[#F1E7D2]">
                          <p className="text-[0.9375rem] text-[#1A1D23] leading-relaxed">
                            {translation.text}
                          </p>
                          {translation.authorName && (
                            <p className="text-xs text-[#9A7B3A] mt-2">
                              — {translation.authorName}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Prev / next chapter nav */}
            <nav
              className="flex items-center justify-between mt-10 pt-6 border-t border-[#E8DCC4]"
              aria-label="Chapter navigation"
            >
              {prevChapter ? (
                <Link
                  to={`/hindu/scriptures/${slug}/${prevChapter}`}
                  className="flex items-center gap-2 text-sm font-semibold text-[#6B1F2A] hover:underline"
                >
                  <ChevronLeft size={16} />
                  Chapter {prevChapter}
                </Link>
              ) : (
                <div />
              )}
              {nextChapter ? (
                <Link
                  to={`/hindu/scriptures/${slug}/${nextChapter}`}
                  className="flex items-center gap-2 text-sm font-semibold text-[#6B1F2A] hover:underline"
                >
                  Chapter {nextChapter}
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </>
        )}
      </div>

      {playerOpen && audioTracks[trackIndex] && (
        <ChapterAudioBar
          tracks={audioTracks}
          trackIndex={trackIndex}
          onTrackChange={setTrackIndex}
          chapterLabel={`Chapter ${chapter?.chapterNumber ?? ""} · ${chapter?.nameEnglish ?? ""}`}
          onClose={() => setPlayerOpen(false)}
        />
      )}
    </div>
  );
}

// ---------- Chapter narration player ----------

function formatClock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TRACK_LABELS: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  sa: "संस्कृत",
};

function ChapterAudioBar({
  tracks,
  trackIndex,
  onTrackChange,
  chapterLabel,
  onClose,
}: {
  tracks: ChapterAudio[];
  trackIndex: number;
  onTrackChange: (i: number) => void;
  chapterLabel: string;
  onClose: () => void;
}) {
  const track = tracks[trackIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setFailed(false);
    setCurrent(0);
    el.play().catch(() => setPlaying(false));
    return () => {
      el.pause();
    };
  }, [track.url]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#3A0F18]/97 backdrop-blur-xl border-t border-[#8B3344]/40 text-white shadow-[0_-8px_30px_rgba(58,15,24,0.35)]">
      <audio
        ref={audioRef}
        src={track.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setBuffering(false);
        }}
      />
      <div className="container-faith py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggle}
            disabled={failed}
            aria-label={playing ? "Pause" : "Play"}
            className="w-11 h-11 rounded-full bg-white text-[#6B1F2A] flex items-center justify-center shrink-0 hover:bg-[#FAF1D9] transition-colors disabled:opacity-40"
          >
            {buffering && !failed ? (
              <Loader2 size={18} className="animate-spin" />
            ) : playing ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {failed ? "Audio unavailable — please try again later" : chapterLabel}
                </p>
                {tracks.length > 1 && (
                  <span className="flex items-center gap-1 shrink-0">
                    {tracks.map((t, i) => (
                      <button
                        key={t.reciterSlug}
                        onClick={() => onTrackChange(i)}
                        aria-pressed={i === trackIndex}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                          i === trackIndex
                            ? "bg-[#E8D5A0] text-[#3A0F18] border-[#E8D5A0]"
                            : "text-white/70 border-white/25 hover:border-white/50"
                        }`}
                        style={
                          t.language !== "en"
                            ? { fontFamily: "var(--font-devanagari)", textTransform: "none" }
                            : undefined
                        }
                      >
                        {TRACK_LABELS[t.language] ?? t.language}
                      </button>
                    ))}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/60 tabular-nums shrink-0">
                {formatClock(current)} / {formatClock(duration)}
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(current, duration || 0)}
              onChange={(e) => {
                const el = audioRef.current;
                if (el) el.currentTime = Number(e.target.value);
              }}
              aria-label="Seek"
              className="w-full h-1 accent-[#E8D5A0] cursor-pointer"
            />
            <p className="text-[11px] text-white/55 truncate mt-0.5">
              {track.name}
              {track.credit ? ` · ${track.credit}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close player"
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
          >
            <X size={16} className="text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
}

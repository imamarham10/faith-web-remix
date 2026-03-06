import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Repeat,
  ChevronDown,
  Settings,
} from "lucide-react";
import type { AudioUrl, QuranReciter } from "~/types";

interface AudioPlayerProps {
  audioUrls: AudioUrl[];
  currentVerseNumber: number;
  onVerseChange: (verseNum: number) => void;
  onClose: () => void;
  reciterName: string;
  surahName: string;
  reciters?: QuranReciter[];
  selectedReciterSlug?: string;
  onReciterChange?: (slug: string) => void;
}

export function AudioPlayer({
  audioUrls,
  currentVerseNumber,
  onVerseChange,
  onClose,
  reciterName,
  surahName,
  reciters,
  selectedReciterSlug,
  onReciterChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playError, setPlayError] = useState(false);
  // Track whether the user has interacted with the audio element (needed for iOS/Android autoplay policy)
  const userHasInteracted = useRef(false);

  const currentIndex = audioUrls.findIndex(
    (a) => a.verseNumber === currentVerseNumber
  );
  const totalVerses = audioUrls.length;

  const currentUrl = currentIndex >= 0 ? audioUrls[currentIndex]?.url : null;

  // Auto-advance: load and play when verse changes (only after first user gesture)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;

    setProgress(0);
    setDuration(0);

    // Only set src and auto-play if user has already tapped play once.
    // On mobile, the FIRST play + src assignment MUST come from a direct
    // user gesture — setting src programmatically beforehand puts the audio
    // element in a "not user-activated" state on some mobile browsers.
    if (userHasInteracted.current) {
      audio.src = currentUrl;
      audio.playbackRate = playbackSpeed;
      setIsLoading(true);
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [currentUrl]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Close menus when tapping outside
  useEffect(() => {
    if (!showReciterMenu && !showMobileMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-player-menu]")) {
        setShowReciterMenu(false);
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [showReciterMenu, showMobileMenu]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) {
      setPlayError(true);
      setTimeout(() => setPlayError(false), 2000);
      return;
    }
    setPlayError(false);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      userHasInteracted.current = true;
      setIsLoading(true);
      // Always set src from user gesture context — on mobile, setting src
      // programmatically (e.g. in useEffect) puts the audio element in a
      // "not user-activated" state, causing play() to reject even from gestures.
      audio.src = currentUrl;
      audio.playbackRate = playbackSpeed;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn("Audio play failed:", err?.message);
          setIsPlaying(false);
          setIsLoading(false);
          setPlayError(true);
          setTimeout(() => setPlayError(false), 2000);
        });
    }
  }, [isPlaying, currentUrl, playbackSpeed]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    if (autoAdvance && currentIndex < totalVerses - 1) {
      onVerseChange(audioUrls[currentIndex + 1].verseNumber);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    userHasInteracted.current = true;
    if (currentIndex > 0) {
      onVerseChange(audioUrls[currentIndex - 1].verseNumber);
    }
  };

  const handleNext = () => {
    userHasInteracted.current = true;
    if (currentIndex < totalVerses - 1) {
      onVerseChange(audioUrls[currentIndex + 1].verseNumber);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
    setProgress(pct * 100);
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  const nextSpeed = () => {
    const idx = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const hasReciters = reciters && reciters.length > 1 && onReciterChange;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        playsInline
      />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-light shadow-lg safe-bottom">
        {/* Progress bar */}
        <div
          className="h-1.5 sm:h-1 bg-primary/10 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="container-faith py-2.5 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Verse info — tapping reciter name opens reciter menu on mobile */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">
                {surahName} - Verse {currentVerseNumber}
              </p>
              <div className="flex items-center gap-2">
                {hasReciters ? (
                  <button
                    data-player-menu
                    onClick={() => {
                      setShowReciterMenu(!showReciterMenu);
                      setShowMobileMenu(false);
                    }}
                    className="text-xs text-primary truncate flex items-center gap-1 sm:pointer-events-none sm:text-text-muted"
                  >
                    {reciterName}
                    <ChevronDown size={10} className="sm:hidden shrink-0" />
                  </button>
                ) : (
                  <p className="text-xs text-text-muted truncate">
                    {reciterName}
                  </p>
                )}
                <span className="text-xs text-text-muted shrink-0">
                  ({currentIndex + 1}/{totalVerses})
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" style={{ touchAction: 'manipulation' }}>
              {/* Speed — desktop */}
              <button
                onClick={nextSpeed}
                className="hidden sm:flex w-8 h-8 rounded-lg hover:bg-black/5 items-center justify-center transition-colors"
                title="Playback speed"
              >
                <span className="text-xs font-bold text-text-secondary">
                  {playbackSpeed}x
                </span>
              </button>

              {/* Auto-advance — desktop */}
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`hidden sm:flex w-8 h-8 rounded-lg hover:bg-black/5 items-center justify-center transition-colors ${
                  autoAdvance ? "text-primary" : "text-text-muted"
                }`}
                title={autoAdvance ? "Auto-advance on" : "Auto-advance off"}
              >
                <Repeat size={14} />
              </button>

              {/* Prev */}
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="w-11 h-11 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <SkipBack size={16} className="text-text" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                  playError
                    ? "bg-error/10 text-error ring-2 ring-error/30"
                    : "bg-primary text-white hover:bg-primary/90 active:bg-primary/80"
                }`}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : playError ? (
                  <X size={18} />
                ) : isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={handleNext}
                disabled={currentIndex >= totalVerses - 1}
                className="w-11 h-11 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <SkipForward size={16} className="text-text" />
              </button>

              {/* Mobile settings button — speed, auto-advance, reciter */}
              <div className="relative sm:hidden" data-player-menu>
                <button
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    setShowReciterMenu(false);
                  }}
                  className="w-11 h-11 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center transition-colors"
                >
                  <Settings size={16} className="text-text-secondary" />
                </button>

                {showMobileMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface rounded-xl shadow-lg border border-border-light overflow-hidden">
                    {/* Speed */}
                    <button
                      onClick={nextSpeed}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/3 active:bg-black/5 transition-colors flex items-center justify-between"
                    >
                      <span className="text-text">Playback Speed</span>
                      <span className="text-xs font-bold text-primary">{playbackSpeed}x</span>
                    </button>

                    {/* Auto-advance */}
                    <button
                      onClick={() => setAutoAdvance(!autoAdvance)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-black/3 active:bg-black/5 transition-colors flex items-center justify-between border-t border-border-light"
                    >
                      <span className="text-text">Auto-advance</span>
                      <span className={`text-xs font-medium ${autoAdvance ? "text-primary" : "text-text-muted"}`}>
                        {autoAdvance ? "On" : "Off"}
                      </span>
                    </button>

                    {/* Reciter list */}
                    {hasReciters && (
                      <>
                        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted bg-black/2 border-t border-border-light">
                          Reciter
                        </div>
                        {reciters.map((r) => (
                          <button
                            key={r.slug}
                            onClick={() => {
                              onReciterChange!(r.slug);
                              setShowMobileMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-black/3 active:bg-black/5 transition-colors ${
                              r.slug === selectedReciterSlug
                                ? "text-primary font-medium"
                                : "text-text"
                            }`}
                          >
                            {r.name}
                            {r.nameArabic && (
                              <span className="text-xs text-text-muted ml-2">
                                {r.nameArabic}
                              </span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Reciter selector — desktop */}
              {hasReciters && (
                <div className="relative hidden sm:block" data-player-menu>
                  <button
                    onClick={() => setShowReciterMenu(!showReciterMenu)}
                    className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <span className="text-xs text-text-secondary max-w-[80px] truncate">
                      Reciter
                    </span>
                    <ChevronDown size={12} className="text-text-muted" />
                  </button>
                  {showReciterMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface rounded-xl shadow-lg border border-border-light overflow-hidden">
                      {reciters.map((r) => (
                        <button
                          key={r.slug}
                          onClick={() => {
                            onReciterChange!(r.slug);
                            setShowReciterMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-black/3 transition-colors ${
                            r.slug === selectedReciterSlug
                              ? "text-primary font-medium"
                              : "text-text"
                          }`}
                        >
                          {r.name}
                          {r.nameArabic && (
                            <span className="text-xs text-text-muted ml-2">
                              {r.nameArabic}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Reciter menu triggered from tapping reciter name on mobile */}
        {showReciterMenu && hasReciters && (
          <div
            className="sm:hidden border-t border-border-light bg-surface max-h-48 overflow-y-auto"
            data-player-menu
          >
            <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted bg-black/2">
              Change Reciter
            </div>
            {reciters.map((r) => (
              <button
                key={r.slug}
                onClick={() => {
                  onReciterChange!(r.slug);
                  setShowReciterMenu(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-black/3 active:bg-black/5 transition-colors ${
                  r.slug === selectedReciterSlug
                    ? "text-primary font-medium"
                    : "text-text"
                }`}
              >
                {r.name}
                {r.nameArabic && (
                  <span className="text-xs text-text-muted ml-2">
                    {r.nameArabic}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden behind the fixed player */}
      <div className="h-24" />
    </>
  );
}

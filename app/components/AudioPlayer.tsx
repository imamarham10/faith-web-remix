import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Repeat,
  ChevronDown,
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
  const [isLoading, setIsLoading] = useState(false);

  const currentIndex = audioUrls.findIndex(
    (a) => a.verseNumber === currentVerseNumber
  );
  const totalVerses = audioUrls.length;

  const currentUrl = currentIndex >= 0 ? audioUrls[currentIndex]?.url : null;

  // Load and play when verse changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    audio.src = currentUrl;
    audio.playbackRate = playbackSpeed;
    setIsLoading(true);
    setProgress(0);
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
  }, [currentUrl]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

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
    if (currentIndex > 0) {
      onVerseChange(audioUrls[currentIndex - 1].verseNumber);
    }
  };

  const handleNext = () => {
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

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-light shadow-lg">
        {/* Progress bar */}
        <div
          className="h-1 bg-primary/10 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="container-faith py-3">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Verse info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">
                {surahName} - Verse {currentVerseNumber}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-muted truncate">
                  {reciterName}
                </p>
                <span className="text-xs text-text-muted">
                  ({currentIndex + 1}/{totalVerses})
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Speed */}
              <button
                onClick={nextSpeed}
                className="hidden sm:flex w-8 h-8 rounded-lg hover:bg-black/5 items-center justify-center transition-colors"
                title="Playback speed"
              >
                <span className="text-xs font-bold text-text-secondary">
                  {playbackSpeed}x
                </span>
              </button>

              {/* Auto-advance */}
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
                className="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <SkipBack size={16} className="text-text" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                className="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <SkipForward size={16} className="text-text" />
              </button>

              {/* Reciter selector */}
              {reciters && reciters.length > 1 && onReciterChange && (
                <div className="relative hidden sm:block">
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
                            onReciterChange(r.slug);
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
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the fixed player */}
      <div className="h-20" />
    </>
  );
}

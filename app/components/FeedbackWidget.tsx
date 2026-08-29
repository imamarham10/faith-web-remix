import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { MessageSquare, Bug, Lightbulb, HelpCircle, X, Check } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { feedbackAPI } from "~/services/api";

type FeedbackType = "feedback" | "bug" | "feature_request" | "query";

const TYPES: { value: FeedbackType; label: string; icon: typeof MessageSquare }[] = [
  { value: "feedback", label: "Feedback", icon: MessageSquare },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "feature_request", label: "Feature idea", icon: Lightbulb },
  { value: "query", label: "Question", icon: HelpCircle },
];

function faithContextFromPath(pathname: string): string | undefined {
  if (pathname.startsWith("/islam")) return "islam";
  if (pathname.startsWith("/hindu")) return "hindu";
  return undefined;
}

interface WidgetTheme {
  fab: string;
  activePill: string;
  ring: string;
  submit: string;
}

// Islam = green (--color-primary, the app default), Hindu = maroon (matches
// the bg-[#6B1F2A] convention already used for Hindu accents on home.tsx),
// everything else = the neutral gold/espresso accent from the landing hero.
const THEMES: Record<"islam" | "hindu" | "neutral", WidgetTheme> = {
  islam: {
    fab: "bg-primary text-white hover:brightness-110",
    activePill: "border-primary bg-primary/10 text-primary",
    ring: "focus:ring-primary/40",
    submit: "bg-primary text-white hover:brightness-110",
  },
  hindu: {
    fab: "bg-[#6B1F2A] text-white hover:bg-[#4A1119]",
    activePill: "border-[#6B1F2A] bg-[#6B1F2A]/10 text-[#6B1F2A]",
    ring: "focus:ring-[#6B1F2A]/40",
    submit: "bg-[#6B1F2A] text-white hover:bg-[#4A1119]",
  },
  neutral: {
    fab: "bg-[#E0B470] text-[#221A13] hover:bg-[#C8A55A]",
    activePill: "border-[#C8A55A] bg-[#E0B470]/15 text-[#8A6B2E]",
    ring: "focus:ring-[#C8A55A]/40",
    submit: "bg-[#E0B470] text-[#221A13] hover:bg-[#C8A55A]",
  },
};

function themeFromPath(pathname: string): WidgetTheme {
  if (pathname.startsWith("/islam")) return THEMES.islam;
  if (pathname.startsWith("/hindu")) return THEMES.hindu;
  return THEMES.neutral;
}

export default function FeedbackWidget() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const theme = themeFromPath(location.pathname);

  useEffect(() => {
    if (!open) return;
    // Plain `overflow: hidden` on body doesn't reliably block scroll on all
    // browsers (notably iOS Safari, which still rubber-bands the background
    // underneath a fixed overlay). Pinning body to `position: fixed` at the
    // current scroll offset removes it from the scrolling flow entirely, then
    // restores the exact position on close.
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const reset = () => {
    setType("feedback");
    setMessage("");
    setEmail("");
    setStatus("idle");
  };

  const close = () => {
    setOpen(false);
    // Give the close animation a beat before clearing state.
    setTimeout(reset, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || (!isAuthenticated && !email.trim())) return;

    setStatus("submitting");
    try {
      await feedbackAPI.submit({
        type,
        message: message.trim(),
        email: isAuthenticated ? user?.email : email.trim(),
        pageUrl: window.location.href,
        faithContext: faithContextFromPath(location.pathname),
        userAgent: navigator.userAgent,
        website,
      });
      setStatus("success");
      setTimeout(close, 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all cursor-pointer ${theme.fab}`}
        aria-label="Share feedback or report a bug"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline text-sm font-semibold">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={close}
        >
          <div
            className="card-elevated w-full sm:max-w-md bg-bg rounded-t-2xl sm:rounded-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 text-text-muted hover:text-text cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check size={24} className="text-green-500" />
                </div>
                <p className="font-semibold text-text">Thank you — we've got it.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="font-playfair text-xl font-bold text-text mb-1">
                  Talk to us
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Feedback, a bug, an idea, or a question — we read every one.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        type === value
                          ? theme.activePill
                          : "border-border text-text-secondary hover:border-border"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={3}
                  maxLength={5000}
                  rows={4}
                  placeholder="What's on your mind?"
                  className={`w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 mb-3 ${theme.ring}`}
                />

                {!isAuthenticated && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Your email, so we can follow up"
                    className={`w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 mb-3 ${theme.ring}`}
                  />
                )}

                {/* Honeypot — hidden from real users and screen readers, catches naive bots. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: 0 }}>
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    name="website"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-500 text-sm mb-3">
                    Something went wrong — please try again in a moment.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`w-full rounded-xl font-semibold py-3 text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${theme.submit}`}
                >
                  {status === "submitting" ? "Sending…" : "Send"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

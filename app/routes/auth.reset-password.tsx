import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Mail, KeyRound, Lock } from "lucide-react";
import { authAPI } from "~/services/api";
import { AUTH_THEMES, resolveAuthFaith } from "~/utils/authTheme";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    otp: z.string().length(6, "Enter the 6-digit code"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[0-9]/, "Needs a number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Needs a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  const authFaith = resolveAuthFaith(searchParams);
  const theme = AUTH_THEMES[authFaith];
  const faithSearch = authFaith === "neutral" ? "" : `?faith=${authFaith}`;
  const emailFromQuery = searchParams.get("email") || "";

  const submitClass =
    authFaith === "hindu"
      ? "btn-hindu-primary w-full py-3 disabled:opacity-50"
      : authFaith === "islam"
        ? "btn-primary w-full py-3 disabled:opacity-50"
        : "w-full py-3 disabled:opacity-50 inline-flex items-center justify-center gap-2 rounded-xl bg-[#221A13] text-white text-sm font-semibold hover:bg-[#35281B] transition-colors";
  const linkClass =
    authFaith === "hindu"
      ? "text-[#6B1F2A] font-semibold hover:underline"
      : authFaith === "islam"
        ? "text-primary font-semibold hover:underline"
        : "text-[#221A13] font-semibold hover:underline";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailFromQuery },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setError("");
      await authAPI.resetPassword(data.email, data.otp, data.newPassword);
      navigate(`/auth/login${faithSearch}${faithSearch ? "&" : "?"}reset=success`);
    } catch (err: any) {
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        setError(Array.isArray(msg) ? msg.join(" ") : msg);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className={`hidden lg:flex lg:w-[45%] ${theme.panelBg} relative overflow-hidden`}>
        <div className={`absolute inset-0 ${theme.pattern}`} />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Siraat" width={40} height={40} className="w-10 h-10 rounded-xl ring-1 ring-white/10" />
            <span className="text-white text-lg font-bold">Siraat</span>
          </Link>
          <div className="max-w-sm">
            <h2 className="text-4xl font-bold font-playfair text-white mb-4 leading-tight">
              {theme.loginHeading}
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              {theme.loginBody}
            </p>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p
              className={theme.quote.className}
              dir={theme.quote.dir}
              style={authFaith === "hindu" ? { fontFamily: "var(--font-devanagari)" } : undefined}
            >
              {theme.quote.text}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-bg">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="Siraat" width={36} height={36} className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-bold text-text">Siraat</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-text font-playfair mb-1.5">
            Reset password
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Enter the code we emailed you, along with your new password.
          </p>

          {error && (
            <div className="bg-error/8 border border-error/15 text-error text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register("email")}
                  className="input-field input-with-left-icon w-full"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">6-digit code</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register("otp")}
                  className="input-field input-with-left-icon w-full"
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              {errors.otp && <p className="text-error text-xs mt-1.5">{errors.otp.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">New password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register("newPassword")}
                  type="password"
                  className="input-field input-with-left-icon w-full"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              {errors.newPassword && <p className="text-error text-xs mt-1.5">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">Confirm new password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="input-field input-with-left-icon w-full"
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-error text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className={submitClass}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  Reset password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-8">
            Didn't get a code?{" "}
            <Link to={`/auth/forgot-password${faithSearch}`} className={linkClass}>
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

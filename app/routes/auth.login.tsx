import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Mail, Lock, KeyRound, BookOpen, Moon, Compass } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loginWithOTP, requestOTP, isLoading } = useAuth();
  const navigate = useNavigate();
  const [useOTP, setUseOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");

  const onLogin = async (data: LoginForm) => {
    try {
      setError("");
      await login(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.status === 401
          ? "Invalid email or password"
          : "An error occurred. Please try again."
      );
    }
  };

  const handleSendOTP = async () => {
    if (!email || errors.email) {
      setError("Please enter a valid email first");
      return;
    }
    try {
      setError("");
      await requestOTP(email);
      setOtpSent(true);
    } catch {
      setError("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    try {
      setError("");
      await loginWithOTP(email, otp);
      navigate("/");
    } catch {
      setError("Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-hero-gradient relative overflow-hidden">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 pattern-islamic opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <span className="text-white text-xl font-bold">F</span>
            </div>
            <span className="text-white text-lg font-bold">FaithApp</span>
          </Link>

          {/* Main Message */}
          <div className="max-w-sm">
            <h2 className="text-4xl font-bold font-playfair text-white mb-4 leading-tight">
              Welcome back to your spiritual journey
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              Continue your path with prayer tracking, Quran reading, and dhikr — all in one place.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BookOpen, label: "Quran Reader" },
                { icon: Moon, label: "Dhikr Counter" },
                { icon: Compass, label: "Qibla Finder" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3.5 py-2 text-white/70 text-xs"
                >
                  <Icon size={13} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="border-t border-white/10 pt-6">
            <p className="font-amiri text-white/40 text-base" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-bg">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center">
              <span className="text-white text-base font-bold">F</span>
            </div>
            <span className="text-lg font-bold text-text">FaithApp</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-text font-playfair mb-1.5">
            Sign In
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Welcome back. Enter your credentials to continue.
          </p>

          {error && (
            <div className="bg-error/8 border border-error/15 text-error text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          {!useOTP ? (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    {...register("email")}
                    className="input-field input-with-left-icon w-full"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    {...register("password")}
                    type="password"
                    className="input-field input-with-left-icon w-full"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {isSubmitting || isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {!otpSent ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-text mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <input
                        {...register("email")}
                        className="input-field input-with-left-icon w-full"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    className="btn-primary w-full py-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-text mb-1.5 block">
                      Enter OTP sent to {email}
                    </label>
                    <div className="relative">
                      <KeyRound
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="input-field input-with-left-icon w-full tracking-[0.3em] text-center text-lg"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Didn't receive it?{" "}
                      <button
                        onClick={handleSendOTP}
                        className="text-primary font-medium hover:underline"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                    className="btn-primary w-full py-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg px-3 text-xs text-text-muted">or</span>
            </div>
          </div>

          <button
            onClick={() => {
              setUseOTP(!useOTP);
              setError("");
              setOtpSent(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-text-secondary border border-border-light hover:border-primary/30 hover:text-primary transition-all"
          >
            {useOTP ? (
              <>
                <Lock size={15} />
                Sign in with Password
              </>
            ) : (
              <>
                <KeyRound size={15} />
                Sign in with OTP
              </>
            )}
          </button>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

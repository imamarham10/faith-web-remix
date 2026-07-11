import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { AUTH_THEMES, resolveAuthFaith } from "~/utils/authTheme";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  // Faith-aware ambiance: neutral by default (main landing entry); themed
  // when the visitor arrived from inside /islam or /hindu.
  const authFaith = resolveAuthFaith(searchParams);
  const theme = AUTH_THEMES[authFaith];
  const faithSearch = authFaith === "neutral" ? "" : `?faith=${authFaith}`;

  // Action color follows the ambiance: espresso ink on neutral, green on
  // Islam, maroon on Hindu.
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
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginForm) => {
    try {
      setError("");
      await login(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      if (err.response) {
        const { status, data } = err.response;
        switch (status) {
          case 400:
            setError(data.message || 'Invalid input. Please check your details.');
            break;
          case 401:
            setError('Invalid email or password.');
            break;
          case 429:
            setError('Too many attempts. Please try again later.');
            break;
          default:
            setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Decorative, themed by entry faith */}
      <div className={`hidden lg:flex lg:w-[45%] ${theme.panelBg} relative overflow-hidden`}>
        <div className={`absolute inset-0 ${theme.pattern}`} />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Siraat" width={40} height={40} className="w-10 h-10 rounded-xl ring-1 ring-white/10" />
            <span className="text-white text-lg font-bold">Siraat</span>
          </Link>

          {/* Main Message */}
          <div className="max-w-sm">
            <h2 className="text-4xl font-bold font-playfair text-white mb-4 leading-tight">
              {theme.loginHeading}
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              {theme.loginBody}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {theme.loginPills.map(({ icon: Icon, label }) => (
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
            <p
              className={theme.quote.className}
              dir={theme.quote.dir}
              style={authFaith === "hindu" ? { fontFamily: "var(--font-devanagari)" } : undefined}
            >
              {theme.quote.text}
            </p>
            {theme.quote.caption && (
              <p className="text-white/25 text-xs mt-1.5">{theme.quote.caption}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel — Form (identical across faiths) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-bg">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="Siraat" width={36} height={36} className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-bold text-text">Siraat</span>
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
                className={submitClass}
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

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{" "}
            <Link to={`/auth/register${faithSearch}`} className={linkClass}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

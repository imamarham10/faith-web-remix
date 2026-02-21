import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Check,
  X,
  Clock,
  BookOpen,
  Moon,
} from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(5, "Phone number is required"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const requirements = [
  { regex: /.{8,}/, text: "8+ characters" },
  { regex: /[A-Z]/, text: "Uppercase" },
  { regex: /[0-9]/, text: "Number" },
  { regex: /[^A-Za-z0-9]/, text: "Special char" },
];

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password") || "";

  const onRegister = async (data: RegisterForm) => {
    try {
      setError("");
      await registerUser(data.email, data.password, data.firstName, data.lastName, data.phone);
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-hero-warm relative overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <span className="text-white text-lg font-bold">Siraat</span>
          </Link>

          {/* Main Message */}
          <div className="max-w-sm">
            <h2 className="text-4xl font-bold font-playfair text-white mb-4 leading-tight">
              Start your spiritual journey today
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              Join thousands on their path to spiritual growth. Track prayers, read Quran, and stay
              connected to your faith.
            </p>

            {/* Feature highlights */}
            <div className="space-y-3">
              {[
                { icon: Clock, label: "Track all 5 daily prayers" },
                { icon: BookOpen, label: "Read Quran with translations" },
                { icon: Moon, label: "Daily dhikr goals & streaks" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-white/70 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-white/80" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
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
              <span className="text-white text-base font-bold">S</span>
            </div>
            <span className="text-lg font-bold text-text">Siraat</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-text font-playfair mb-1.5">
            Create Account
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Join Siraat and begin your journey.
          </p>

          {error && (
            <div className="bg-error/8 border border-error/15 text-error text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
            {/* First + Last name side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">First Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    {...register("firstName")}
                    className="input-field input-with-left-icon w-full"
                    placeholder="First"
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-error text-xs mt-1.5">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-text mb-1.5 block">Last Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    {...register("lastName")}
                    className="input-field input-with-left-icon w-full"
                    placeholder="Last"
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-error text-xs mt-1.5">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register("phone")}
                  type="tel"
                  className="input-field input-with-left-icon w-full"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="text-error text-xs mt-1.5">{errors.phone.message}</p>
              )}
            </div>

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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
              </div>
              {dirtyFields.password && (
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  {requirements.map((req, i) => {
                    const pass = req.regex.test(password);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          pass ? "text-success" : "text-text-muted"
                        }`}
                      >
                        {pass ? <Check size={12} /> : <X size={12} />}
                        {req.text}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="input-field input-with-left-icon w-full"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-error text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-primary w-full py-3 mt-1 disabled:opacity-50"
            >
              {isSubmitting || isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-8">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

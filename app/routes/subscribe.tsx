import { useState } from "react";
import { Link } from "react-router";
import { Crown, Check, ArrowLeft, Loader2, Shield, Sparkles, X } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { subscriptionAPI } from "~/services/api";
import { ENV } from "~/utils/env";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

type Plan = "monthly" | "yearly";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
}[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "\u20B9199",
    period: "/month",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "\u20B91,999",
    period: "/year",
    badge: "Save 16%",
    highlight: true,
  },
];

const PREMIUM_FEATURES = [
  "4 additional Quran translations",
  "Audio recitation by 4 reciters",
  "Transliteration for all verses",
  "Multiple Arabic scripts (Uthmani, IndoPak)",
];

const FREE_FEATURES = [
  "Arabic text (Simple script)",
  "Saheeh International translation",
  "Bookmarks & favourites",
  "Prayer times & Qibla",
  "Dhikr counter & goals",
  "Duas collection",
];

export default function SubscribePage() {
  const { user, isAuthenticated, isPremium, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (plan: Plan) => {
    setError("");
    setLoading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      const res = await subscriptionAPI.create(plan);
      const data = res.data?.data || res.data;
      const subscriptionId = data.subscriptionId || data.subscription_id || data.id;

      if (!subscriptionId) {
        setError("Could not create subscription. Please try again.");
        setLoading(false);
        return;
      }

      const options = {
        key: ENV.RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "Siraat Premium",
        description: `${plan === "monthly" ? "Monthly" : "Yearly"} Subscription`,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#1B6B4E" },
        handler: async (response: any) => {
          try {
            const verifyRes = await subscriptionAPI.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });

            const verifyData = verifyRes.data?.data || verifyRes.data;

            // Store new tokens with premium_user role baked in
            const accessToken = verifyData?.accessToken || verifyData?.access_token;
            const refreshToken = verifyData?.refreshToken || verifyData?.refresh_token;
            if (accessToken) localStorage.setItem("accessToken", accessToken);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

            // Refresh auth context — new JWT has premium_user role
            await refreshUser();
          } catch {
            setError("Payment succeeded but verification failed. Please contact support.");
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        const description =
          response?.error?.description || "Payment failed. Please try again.";
        setError(description);
        setLoading(false);
      });
      rzp.open();

      // Razorpay modal opened -- reset loading since user is interacting with the modal
      setLoading(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?")) return;
    setCancelling(true);
    setError("");

    try {
      await subscriptionAPI.cancel();
      window.location.reload();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to cancel subscription. Please try again.";
      setError(message);
      setCancelling(false);
    }
  };

  // ---- Not logged in ----
  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-surface min-h-screen">
        <section className="bg-hero-gradient text-white pattern-islamic">
          <div className="container-faith py-10 md:py-14">
            <div className="animate-fade-in-up">
              <Crown size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                Unlock Premium
              </h1>
              <p className="text-white/90 text-sm">
                Enhance your spiritual journey with premium features
              </p>
            </div>
          </div>
        </section>

        <div className="container-faith py-12">
          <div className="card-elevated p-8 max-w-md mx-auto text-center">
            <Crown size={40} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">Sign In Required</h2>
            <p className="text-text-secondary text-sm mb-6">
              Please sign in to subscribe to Siraat Premium.
            </p>
            <Link
              to="/auth/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              Sign in to subscribe
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Already premium ----
  if (isPremium) {
    return (
      <div className="bg-gradient-surface min-h-screen">
        <section className="bg-hero-gradient text-white pattern-islamic">
          <div className="container-faith py-10 md:py-14">
            <div className="animate-fade-in-up">
              <Crown size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                Unlock Premium
              </h1>
              <p className="text-white/90 text-sm">
                Enhance your spiritual journey with premium features
              </p>
            </div>
          </div>
        </section>

        <div className="container-faith py-12">
          <div className="card-elevated p-8 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <Crown size={28} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold font-playfair text-text mb-2">
              You're Premium!
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Thank you for supporting Siraat. You have access to all premium features.
            </p>

            <div className="bg-surface-warm rounded-xl p-5 mb-6 text-left">
              <h3 className="text-sm font-semibold text-text mb-3">Your premium features</h3>
              <ul className="space-y-2.5">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 mb-4 animate-fade-in-up">
                <X size={16} className="shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
              >
                <ArrowLeft size={16} />
                Back to home
              </Link>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel subscription"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Subscribe flow ----
  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="animate-fade-in-up">
            <Crown size={28} className="text-gold-light mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
              Unlock Premium
            </h1>
            <p className="text-white/90 text-sm">
              Enhance your spiritual journey with premium features
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 mb-8 animate-fade-in-up">
            <X size={16} className="shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`card-elevated p-6 text-left transition-all relative ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-4 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border-light"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-text">{plan.name}</span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-text">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2">
                  {PREMIUM_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={14} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-xs text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Subscribe button */}
        <div className="text-center mb-12">
          <button
            onClick={() => handleSubscribe(selectedPlan)}
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2.5 px-8 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown size={18} />
                Subscribe to {selectedPlan === "monthly" ? "Monthly" : "Yearly"} Plan
              </>
            )}
          </button>
          <p className="text-xs text-text-muted mt-3 flex items-center justify-center gap-1.5">
            <Shield size={12} />
            Secure payment via Razorpay. Cancel anytime.
          </p>
        </div>

        {/* Feature comparison */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold font-playfair text-text text-center mb-6">
            Free vs Premium
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Free tier */}
            <div className="card-elevated p-6">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border-light">
                <Sparkles size={18} className="text-text-muted" />
                <h3 className="text-base font-semibold text-text">Free</h3>
              </div>
              <ul className="space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium tier */}
            <div className="card-elevated p-6 ring-1 ring-primary/20 bg-surface-warm">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border-light">
                <Crown size={18} className="text-amber-500" />
                <h3 className="text-base font-semibold text-text">Premium</h3>
                <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <ul className="space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Crown size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium text-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

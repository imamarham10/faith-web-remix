import { useState, useEffect } from "react";
import type { Route } from "./+types/settings";
import { Link } from "react-router";
import { Settings, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { userPreferencesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Siraat" },
    { name: "description", content: "Manage your Siraat preferences and notification settings." },
  ];
}

interface UserPreference {
  id: string;
  userId: string;
  faith?: string;
  language?: string;
  countryCode?: string;
  timezone?: string;
  notificationPreferences?: {
    push?: boolean;
    email?: boolean;
    dailyPacket?: boolean;
  };
}

interface FormState {
  faith: string;
  language: string;
  countryCode: string;
  timezone: string;
  notificationPush: boolean;
  notificationEmail: boolean;
  notificationDailyPacket: boolean;
}

const DEFAULT_FORM: FormState = {
  faith: "",
  language: "en",
  countryCode: "",
  timezone: "UTC",
  notificationPush: false,
  notificationEmail: false,
  notificationDailyPacket: false,
};

const FAITH_OPTIONS = [
  { label: "Muslim", value: "muslim" },
  { label: "Christian", value: "christian" },
  { label: "Jewish", value: "jewish" },
  { label: "Hindu", value: "hindu" },
  { label: "Buddhist", value: "buddhist" },
  { label: "Sikh", value: "sikh" },
];

const LANGUAGE_OPTIONS = [
  { label: "English (en)", value: "en" },
  { label: "Arabic (ar)", value: "ar" },
  { label: "Urdu (ur)", value: "ur" },
  { label: "French (fr)", value: "fr" },
  { label: "Turkish (tr)", value: "tr" },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Jakarta",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const res = await userPreferencesAPI.getPreferences();
        const data: UserPreference = res.data?.data || res.data;
        if (data) {
          setForm({
            faith: data.faith ?? "",
            language: data.language ?? "en",
            countryCode: data.countryCode ?? "",
            timezone: data.timezone ?? "UTC",
            notificationPush: data.notificationPreferences?.push ?? false,
            notificationEmail: data.notificationPreferences?.email ?? false,
            notificationDailyPacket: data.notificationPreferences?.dailyPacket ?? false,
          });
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        faith: form.faith || undefined,
        language: form.language || undefined,
        countryCode: form.countryCode || undefined,
        timezone: form.timezone || undefined,
        notificationPreferences: {
          push: form.notificationPush,
          email: form.notificationEmail,
          dailyPacket: form.notificationDailyPacket,
        },
      };
      await userPreferencesAPI.updatePreferences(payload);
      setSuccessMsg("Settings saved!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-surface min-h-screen flex items-center justify-center px-4">
        <div className="card-elevated p-8 max-w-md w-full text-center">
          <Settings size={40} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">Sign In Required</h2>
          <p className="text-text-secondary mb-6">
            Please sign in to view your settings.
          </p>
          <Link to="/auth/login" className="btn-primary inline-flex items-center gap-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="animate-fade-in-up">
            <Settings size={28} className="text-white/70 mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">Settings</h1>
            <p className="text-white/60 text-sm">Manage your Siraat preferences</p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
            {/* Success / Error feedback */}
            {successMsg && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 animate-fade-in-up">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 animate-fade-in-up">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Section: Faith & Region */}
            <div className="card-elevated p-6 space-y-5">
              <div className="border-b border-border-light pb-4">
                <h2 className="text-base font-semibold text-text">Faith &amp; Region</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Personalize your spiritual experience by setting your faith and region.
                </p>
              </div>

              {/* Faith */}
              <div>
                <label htmlFor="faith" className="block text-sm font-medium text-text mb-1.5">
                  Faith
                </label>
                <select
                  id="faith"
                  name="faith"
                  value={form.faith}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Select your faith</option>
                  {FAITH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-text mb-1.5">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Code */}
              <div>
                <label htmlFor="countryCode" className="block text-sm font-medium text-text mb-1.5">
                  Country Code
                </label>
                <input
                  id="countryCode"
                  name="countryCode"
                  type="text"
                  value={form.countryCode}
                  onChange={handleChange}
                  placeholder="e.g. US, GB, PK"
                  maxLength={3}
                  className="input-field w-full"
                />
                <p className="text-xs text-text-muted mt-1">
                  ISO 3166-1 alpha-2 country code (e.g. US, GB, PK)
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-text mb-1.5">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Notifications */}
            <div className="card-elevated p-6 space-y-5">
              <div className="border-b border-border-light pb-4">
                <h2 className="text-base font-semibold text-text">Notifications</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Control how and when you receive notifications.
                </p>
              </div>

              {/* Push notifications */}
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    name="notificationPush"
                    checked={form.notificationPush}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-border-light peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Push notifications</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Receive prayer time reminders and alerts on your device.
                  </p>
                </div>
              </label>

              {/* Email notifications */}
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    name="notificationEmail"
                    checked={form.notificationEmail}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-border-light peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Email notifications</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Get updates and reminders sent to your email address.
                  </p>
                </div>
              </label>

              {/* Daily packet */}
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    name="notificationDailyPacket"
                    checked={form.notificationDailyPacket}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-border-light peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Daily packet</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Receive a daily inspiration email with a Quranic verse or hadith.
                  </p>
                </div>
              </label>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { Link } from "react-router";
import {
  Clock,
  BookOpen,
  Moon,
  Calendar,
  Compass,
  Star,
  Sparkles,
  Heart,
  Hand,
  Globe,
  Shield,
  Users,
  User,
} from "lucide-react";
import { JsonLd } from "~/components/JsonLd";

const features = [
  {
    icon: Clock,
    title: "Prayer Times",
    description:
      "Accurate prayer time calculations using established methods including ISNA, MWL, Egyptian General Authority, and Umm al-Qura. Get precise Fajr, Dhuhr, Asr, Maghrib, and Isha times based on your exact location, with real-time countdown to the next prayer.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Quran Reader",
    description:
      "Read all 114 Surahs of the Holy Quran with clear Arabic text and Saheeh International English translation. Bookmark your favorite verses, track your reading progress, and pick up right where you left off.",
    color: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: Moon,
    title: "Dhikr Counter",
    description:
      "Create personalized counters for SubhanAllah, Alhamdulillah, Allahu Akbar, and any other adhkar. Set daily goals, track your total counts, and build a consistent habit of remembrance.",
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    icon: Calendar,
    title: "Islamic Calendar",
    description:
      "Stay connected with the Hijri calendar, convert between Hijri and Gregorian dates, and never miss important Islamic events like Ramadan, Eid al-Fitr, Eid al-Adha, and other significant dates.",
    color: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    icon: Star,
    title: "99 Names of Allah & Muhammad",
    description:
      "Explore the 99 Beautiful Names of Allah (Al-Asma ul-Husna) and the 99 Names of Prophet Muhammad (peace be upon him) with Arabic calligraphy, transliteration, and detailed meanings.",
    color: "bg-gold/10",
    iconColor: "text-gold",
  },
  {
    icon: Hand,
    title: "Duas Collection",
    description:
      "Access a curated collection of authentic duas for daily life, including morning and evening adhkar, travel duas, eating duas, and supplications for specific needs and occasions.",
    color: "bg-sky-500/10",
    iconColor: "text-sky-500",
  },
  {
    icon: Heart,
    title: "Feelings & Emotional Guidance",
    description:
      "Find Islamic guidance tailored to your emotional state. Whether you are feeling grateful, anxious, sad, or hopeful, Siraat provides relevant Quran verses, duas, and prophetic advice.",
    color: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  {
    icon: Compass,
    title: "Qibla Direction",
    description:
      "Find the precise direction to the Kaaba in Makkah from anywhere in the world using your device compass and GPS. Pray with confidence knowing you are facing the right direction.",
    color: "bg-teal-500/10",
    iconColor: "text-teal-500",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Siraat",
          description:
            "Learn about Siraat, a free Islamic spiritual companion platform.",
          url: "https://www.siraat.website/about",
          mainEntity: {
            "@type": "Organization",
            name: "Siraat",
            url: "https://www.siraat.website",
            description:
              "A comprehensive Islamic spiritual companion platform.",
          },
        }}
      />

      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-20" />
        <div className="relative container-faith py-12 md:py-16 text-center">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
            About Siraat
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto">
            Your comprehensive Islamic spiritual companion -- built to help
            Muslims around the world strengthen their connection with Allah.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container-faith py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={22} className="text-primary" />
            </div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text">
              Our Mission
            </h2>
          </div>
          <div className="card-elevated p-6 md:p-8 space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Siraat -- meaning "the path" in Arabic -- was created with a
              singular vision: to be a comprehensive Islamic spiritual companion
              that is accessible to Muslims worldwide, regardless of where they
              live or what language they speak.
            </p>
            <p className="text-text-secondary leading-relaxed">
              We believe that technology can serve the Ummah by making essential
              Islamic practices easier and more accessible. From knowing the
              exact time of your next prayer, to reading the Quran with
              translation, to keeping a consistent dhikr practice, to finding
              the Qibla direction from anywhere on Earth -- Siraat brings all of
              these tools together in one place.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Our mission is to help every Muslim build and maintain strong
              spiritual habits. We want to remove the barriers between a person
              and their worship, making it as easy as possible to stay connected
              with their faith throughout the day, every day.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star size={22} className="text-amber-500" />
            </div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text">
              What We Offer
            </h2>
          </div>
          <p className="text-text-secondary leading-relaxed mb-8">
            Siraat provides a complete suite of tools designed for your daily
            spiritual journey. Each feature has been carefully built to be
            accurate, easy to use, and respectful of Islamic tradition.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-elevated p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={20} className={feature.iconColor} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield size={22} className="text-emerald-500" />
            </div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text">
              Our Approach
            </h2>
          </div>
          <div className="card-elevated p-6 md:p-8 space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Accuracy and authenticity are at the heart of everything we build.
              We understand the importance of precision when it comes to Islamic
              worship, and we take this responsibility seriously.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text">Prayer Time Calculations:</strong>{" "}
                  Our prayer times are computed using established and widely
                  recognized calculation methods, including the Islamic Society
                  of North America (ISNA), Muslim World League (MWL), Egyptian
                  General Authority of Survey, and Umm al-Qura University
                  (Makkah). Users can choose the method that aligns with their
                  local practice.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text">Quran Translation:</strong> We
                  use the Saheeh International translation, one of the most
                  widely respected and accessible English translations of the
                  Quran, known for its clarity and accuracy.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text">Curated Content:</strong> All
                  duas, adhkar, and Islamic guidance provided through Siraat are
                  carefully curated from authentic sources. We aim to present
                  content that is reliable, well-sourced, and beneficial to
                  users of all backgrounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Built Siraat */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="font-playfair text-xl md:text-2xl font-bold text-text">
                  Built by a Muslim, for the Ummah
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-text-secondary text-sm leading-relaxed">
                Siraat was created by Imam Arham, a Muslim developer passionate
                about building technology that genuinely serves the Muslim
                community. The idea behind Siraat came from a simple need: a
                comprehensive, free, and privacy-respecting Islamic companion
                app that Muslims everywhere could rely on -- regardless of their
                location, language, or background.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Too many Islamic apps are fragmented, filled with ads, or locked
                behind paywalls. Siraat was built to be different -- a single,
                unified platform that brings together prayer times, Quran
                reading, dhikr tracking, duas, the Islamic calendar, and more,
                all in one clean and distraction-free experience. Every feature
                is built with care, accuracy, and respect for the deen.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Have feedback, ideas, or just want to say salaam? Reach out at{" "}
                <a
                  href="mailto:imamarham10@gmail.com"
                  className="text-primary hover:underline font-medium"
                >
                  imamarham10@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open & Free */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Globe size={22} className="text-sky-500" />
            </div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text">
              Open & Free
            </h2>
          </div>
          <div className="card-elevated p-6 md:p-8 space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Siraat is completely free to use. We believe that access to
              essential Islamic tools and resources should never be gated behind
              a paywall. Every feature -- from prayer times and Quran reading to
              dhikr tracking and Qibla direction -- is available to everyone at
              no cost.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Our goal is to serve the global Muslim community. Whether you are
              a new Muslim just beginning your journey, a student of knowledge
              deepening your practice, or someone simply looking for a
              convenient way to keep up with daily prayers and dhikr -- Siraat
              is here for you.
            </p>
            <p className="text-text-secondary leading-relaxed">
              We are committed to keeping Siraat ad-free and focused entirely on
              providing a clean, distraction-free experience that helps you
              focus on what matters most: your relationship with Allah.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-6 md:p-8 text-center bg-primary/5 border-primary/10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-primary" />
            </div>
            <h3 className="font-playfair text-xl md:text-2xl font-bold text-text mb-2">
              Built for the Ummah
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6 max-w-lg mx-auto">
              Siraat is built with love and dedication for the Muslim community.
              We welcome your feedback, suggestions, and involvement in making
              this platform better for everyone.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact" className="btn-primary text-sm">
                Get in Touch
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-light text-text font-medium text-sm hover:bg-black/3 transition-colors"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router";
import { JsonLd } from "~/components/JsonLd";

export default function TermsOfServicePage() {
  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms of Service - Siraat",
          description:
            "Terms of Service for Siraat, a free Islamic spiritual companion platform.",
          url: "https://siraatt.vercel.app/terms",
        }}
      />

      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-20" />
        <div className="relative container-faith py-12 md:py-16 text-center">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto">
            Please read these terms carefully before using the Siraat platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-faith py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-6 md:p-8 mb-6">
            <p className="text-text-muted text-sm">
              <strong>Last Updated:</strong> February 2026
            </p>
          </div>

          <div className="space-y-8">
            {/* Acceptance of Terms */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                By accessing or using Siraat (available at{" "}
                <a
                  href="https://siraatt.vercel.app"
                  className="text-primary hover:underline"
                >
                  siraatt.vercel.app
                </a>
                ), you agree to be bound by these Terms of Service and our{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                . If you do not agree to these terms, please do not use our
                service. We reserve the right to update these terms at any time,
                and your continued use of Siraat after any changes constitutes
                acceptance of the revised terms.
              </p>
            </div>

            {/* Description of Service */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                2. Description of Service
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Siraat is a free Islamic spiritual companion platform designed
                to support Muslims in their daily worship and spiritual growth.
                Our services include:
              </p>
              <ul className="space-y-2">
                {[
                  "Accurate prayer time calculations based on your location using established astronomical methods",
                  "Quran reader with Arabic text and Saheeh International English translation",
                  "Dhikr counter with custom counters, daily goals, and progress tracking",
                  "Islamic (Hijri) calendar with date conversion and event tracking",
                  "Collection of authentic duas for various occasions",
                  "99 Names of Allah and 99 Names of Prophet Muhammad (peace be upon him)",
                  "Emotional and spiritual guidance through Islamic teachings",
                  "Qibla direction finder using device GPS",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-text-secondary text-sm leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-text-secondary text-sm leading-relaxed mt-3">
                Siraat is provided free of charge. We reserve the right to
                modify, suspend, or discontinue any part of the service at any
                time without prior notice.
              </p>
            </div>

            {/* User Accounts */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                3. User Accounts
              </h2>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  Many features of Siraat are available without creating an
                  account. However, to access personalized features such as
                  prayer tracking, Quran bookmarks, and dhikr progress syncing,
                  you must create an account.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  To create an account, you must be at least 13 years of age.
                  If you are under 18, you should have the consent of a parent
                  or guardian. You are responsible for maintaining the
                  confidentiality of your account credentials and for all
                  activities that occur under your account.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  You agree to provide accurate and complete information when
                  creating your account and to update your information as
                  necessary. You must notify us immediately of any unauthorized
                  use of your account.
                </p>
              </div>
            </div>

            {/* Acceptable Use */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Siraat is intended for personal spiritual growth and religious
                practice. You agree to use the platform responsibly and in
                accordance with the following guidelines:
              </p>
              <ul className="space-y-2">
                {[
                  "Use Siraat for personal, non-commercial purposes only. Commercial use of Siraat's content, data, or services requires prior written permission.",
                  "Do not abuse, overload, or interfere with our servers, APIs, or infrastructure. Automated scraping, data harvesting, or excessive API calls are prohibited.",
                  "Do not attempt to gain unauthorized access to any part of the service, other users' accounts, or our systems.",
                  "Do not use the platform to distribute malware, spam, or any content that is harmful, offensive, or contrary to Islamic values.",
                  "Do not reverse-engineer, decompile, or attempt to extract the source code of the Siraat application.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-text-secondary text-sm leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Islamic Content Disclaimer */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                5. Islamic Content Disclaimer
              </h2>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
                <p className="text-text font-semibold text-sm mb-2">
                  Important Notice
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Siraat is a tool designed to aid and support your worship. It
                  is not a replacement for Islamic scholarship, personal study,
                  or consultation with qualified scholars and imams.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  <strong className="text-text">Prayer Times:</strong> Prayer
                  times displayed on Siraat are calculated using established
                  astronomical algorithms and recognized calculation methods
                  (ISNA, MWL, Egyptian General Authority, Umm al-Qura). While
                  these calculations are highly accurate, they may differ
                  slightly from the prayer times announced at your local mosque
                  or community center. We recommend verifying prayer times with
                  your local mosque, especially for Fajr and Isha during extreme
                  latitudes.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  <strong className="text-text">Quran Translation:</strong> The
                  English translation provided is the Saheeh International
                  translation, which is widely respected for its clarity and
                  accuracy. However, translations can never fully capture the
                  depth and nuance of the original Arabic. For scholarly
                  interpretation (tafsir) and deeper understanding, we
                  encourage you to consult qualified Islamic scholars.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  <strong className="text-text">Duas & Guidance:</strong> The
                  duas and spiritual guidance provided through Siraat are
                  curated from authentic Islamic sources. However, individual
                  circumstances may vary, and we encourage users to seek
                  personalized guidance from knowledgeable scholars when needed.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  <strong className="text-text">Qibla Direction:</strong> Qibla
                  direction is calculated based on your device GPS and compass
                  sensors. Accuracy depends on your device hardware and
                  calibration. For precise Qibla determination in a new
                  location, consider cross-referencing with other sources.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                6. Intellectual Property
              </h2>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  The text of the Holy Quran is in the public domain and belongs
                  to all of humanity. The Saheeh International translation is
                  used in accordance with its distribution terms.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  The Siraat application, including its design, user interface,
                  graphics, logos, code, and original content, is the
                  intellectual property of Siraat and is protected by applicable
                  copyright and intellectual property laws. You may not
                  reproduce, distribute, or create derivative works from our
                  proprietary content without explicit written permission.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Islamic content such as hadith collections, duas, and the
                  Names of Allah are part of the shared Islamic heritage. We do
                  not claim ownership over this content; our compilation,
                  presentation, and arrangement of this content is proprietary.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                7. Limitation of Liability
              </h2>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  Siraat is provided on an "as is" and "as available" basis
                  without warranties of any kind, either express or implied,
                  including but not limited to implied warranties of
                  merchantability, fitness for a particular purpose, or
                  non-infringement.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  We do not guarantee that the service will be uninterrupted,
                  timely, secure, or error-free. We are not responsible for any
                  missed prayers due to differences between calculated prayer
                  times and actual local prayer times, inaccurate Qibla
                  direction due to device sensor limitations, loss of data due
                  to technical issues, or any decisions made based on the
                  content or guidance provided through the platform.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  To the maximum extent permitted by applicable law, Siraat
                  shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages arising from your use of
                  the service.
                </p>
              </div>
            </div>

            {/* Termination */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                8. Termination
              </h2>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  You may stop using Siraat at any time. You may also request
                  deletion of your account by contacting us at{" "}
                  <a
                    href="mailto:imamarham10@gmail.com"
                    className="text-primary hover:underline"
                  >
                    imamarham10@gmail.com
                  </a>
                  .
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  We reserve the right to suspend or terminate your account and
                  access to Siraat if you violate these Terms of Service, use
                  the platform in a manner that could damage, disable, or impair
                  our services, or engage in any activity that we determine, in
                  our sole discretion, to be harmful to the platform or its
                  users.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Upon termination, your right to use Siraat will immediately
                  cease. Provisions of these terms that by their nature should
                  survive termination shall survive, including intellectual
                  property provisions and limitations of liability.
                </p>
              </div>
            </div>

            {/* Governing Law */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                9. Governing Law
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                These Terms of Service shall be governed by and construed in
                accordance with applicable laws. Any disputes arising from or
                relating to these terms or your use of Siraat shall be resolved
                through good-faith negotiation. If a resolution cannot be
                reached, the dispute shall be submitted to the appropriate
                courts of competent jurisdiction.
              </p>
            </div>

            {/* Contact */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                10. Contact
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                If you have questions about these Terms of Service, please
                contact us at:
              </p>
              <a
                href="mailto:imamarham10@gmail.com"
                className="text-primary font-medium text-sm hover:underline"
              >
                imamarham10@gmail.com
              </a>
            </div>
          </div>

          {/* Back links */}
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/about" className="text-primary hover:underline">
              About Siraat
            </Link>
            <Link to="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

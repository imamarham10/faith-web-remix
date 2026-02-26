import { Link } from "react-router";
import { JsonLd } from "~/components/JsonLd";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy Policy - Siraat",
          description:
            "Siraat's privacy policy explaining how we collect, use, and protect your personal information.",
          url: "https://www.siraat.website/privacy",
        }}
      />

      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-20" />
        <div className="relative container-faith py-12 md:py-16 text-center">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto">
            Your privacy matters to us. Learn how Siraat collects, uses, and
            protects your information.
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
            {/* Introduction */}
            <div className="card-elevated p-6 md:p-8">
              <p className="text-text-secondary leading-relaxed">
                Siraat ("we", "our", or "us") is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you visit our
                website at{" "}
                <a
                  href="https://www.siraat.website"
                  className="text-primary hover:underline"
                >
                  www.siraat.website
                </a>{" "}
                and use our services. Please read this policy carefully. By
                using Siraat, you agree to the collection and use of information
                in accordance with this policy.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text mb-2">
                    Account Information
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    When you create a Siraat account, we collect your email
                    address and name. This information is used to identify your
                    account, enable you to log in, and personalize your
                    experience across devices.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text mb-2">
                    Location Data
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Siraat requests access to your device location to provide
                    accurate prayer times and Qibla direction. Location access
                    is only activated when you explicitly grant permission
                    through your browser or device. Your precise location
                    coordinates are used in real time to calculate prayer times
                    and are{" "}
                    <strong className="text-text">
                      never stored on our servers
                    </strong>
                    . If you decline location access, Siraat will default to
                    Mecca, Saudi Arabia for prayer time calculations.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text mb-2">
                    Usage Data
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    When you use Siraat with an account, we store data related
                    to your spiritual activities to enable features like
                    progress tracking and cross-device sync. This includes
                    prayer logs (which prayers you have prayed and when), Quran
                    bookmarks (surah and verse references), dhikr counter values
                    and targets, and your personal preferences and settings.
                  </p>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                How We Use Your Information
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="space-y-2">
                {[
                  "Provide accurate prayer times based on your location",
                  "Calculate and display the Qibla direction from your current position",
                  "Sync your prayer logs, bookmarks, dhikr counts, and preferences across devices",
                  "Personalize your experience, such as displaying your prayer streak and reading progress",
                  "Send account-related emails (verification, password reset) when requested",
                  "Improve and maintain the Siraat platform",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-text-secondary text-sm leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-text font-semibold text-sm mb-1">
                  We never sell your data.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Your personal information is never sold, rented, or shared
                  with third parties for marketing or advertising purposes.
                  Your spiritual data belongs to you.
                </p>
              </div>
            </div>

            {/* Data Storage & Security */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Data Storage & Security
              </h2>
              <div className="space-y-3">
                <p className="text-text-secondary text-sm leading-relaxed">
                  Your data is stored in a PostgreSQL database with encrypted
                  (SSL/TLS) connections to protect data in transit. We use
                  industry-standard security measures to protect your
                  information from unauthorized access, alteration, or
                  destruction.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Authentication is handled through JSON Web Tokens (JWT).
                  Passwords are securely hashed using bcrypt before being stored
                  -- we never store plain-text passwords. Session tokens are
                  short-lived and can be invalidated at any time.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  While we implement robust security practices, no method of
                  electronic transmission or storage is 100% secure. We
                  continuously work to improve our security posture and protect
                  your data.
                </p>
              </div>
            </div>

            {/* Third-Party Services */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Third-Party Services
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Siraat uses a limited number of third-party services to operate:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-text-secondary text-sm leading-relaxed">
                    <strong className="text-text">Vercel:</strong> Our website
                    is hosted on Vercel. Vercel may collect basic analytics data
                    (page views, load times) to help us understand performance.
                    No personally identifiable information is shared with Vercel
                    beyond what is necessary for hosting.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-text-secondary text-sm leading-relaxed">
                    <strong className="text-text">Google Fonts:</strong> We use
                    Google Fonts for typography. When you load a page, your
                    browser may make requests to Google's servers to fetch font
                    files.
                  </p>
                </div>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mt-4">
                We do not use any third-party analytics tracking services,
                advertising networks, or social media trackers beyond what is
                described above.
              </p>
            </div>

            {/* Your Rights */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Your Rights
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                You have the following rights regarding your data on Siraat:
              </p>
              <ul className="space-y-2">
                {[
                  "Delete your account: You can request complete deletion of your account and all associated data at any time by contacting us.",
                  "Export your data: You can request a copy of all personal data we hold about you.",
                  "Opt out of emails: You can unsubscribe from any non-essential emails we send. Account-critical emails (such as password reset confirmations) may still be sent when you initiate those actions.",
                  "Revoke location access: You can revoke location permissions at any time through your browser or device settings.",
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

            {/* Cookies */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Cookies & Local Storage
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Siraat uses minimal browser storage. We store your JWT
                authentication token in localStorage to keep you logged in
                between sessions. We do not use tracking cookies, advertising
                cookies, or any third-party cookie-based analytics. Your
                browsing activity on Siraat is not tracked across other
                websites.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Children's Privacy
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Siraat is not directed at children under the age of 13. We do
                not knowingly collect personal information from children under
                13. If you are a parent or guardian and believe your child has
                provided us with personal information, please contact us and we
                will take steps to delete that information.
              </p>
            </div>

            {/* Contact */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Contact Us
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                If you have any questions or concerns about this Privacy Policy,
                or if you wish to exercise any of your rights described above,
                please contact us at:
              </p>
              <a
                href="mailto:imamarham10@gmail.com"
                className="text-primary font-medium text-sm hover:underline"
              >
                imamarham10@gmail.com
              </a>
            </div>

            {/* Changes to Policy */}
            <div className="card-elevated p-6 md:p-8">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">
                Changes to This Policy
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, technology, legal requirements, or
                other factors. When we make material changes, we will notify
                users by posting the updated policy on this page with a revised
                "Last Updated" date. We encourage you to review this policy
                periodically to stay informed about how we protect your
                information.
              </p>
            </div>
          </div>

          {/* Back links */}
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
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

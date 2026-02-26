import { Link } from "react-router";
import { Mail, MessageSquare, Users, Bug, Lightbulb, Globe } from "lucide-react";
import { JsonLd } from "~/components/JsonLd";

export default function ContactPage() {
  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Siraat",
          description:
            "Get in touch with the Siraat team. We welcome feedback, bug reports, and community contributions.",
          url: "https://www.siraat.website/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Siraat",
            url: "https://www.siraat.website",
            email: "imamarham10@gmail.com",
          },
        }}
      />

      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-20" />
        <div className="relative container-faith py-12 md:py-16 text-center">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
            Contact Us
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto">
            We'd love to hear from you. Whether you have feedback, found a bug,
            or want to contribute, reach out to us.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="container-faith py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Main Contact Card */}
          <div className="card-elevated p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="font-playfair text-xl md:text-2xl font-bold text-text">
                  Get in Touch
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                  We respond to every message we receive.
                </p>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-text-muted text-xs uppercase tracking-wider font-semibold mb-2">
                Email
              </p>
              <a
                href="mailto:imamarham10@gmail.com"
                className="text-primary font-semibold text-lg hover:underline"
              >
                imamarham10@gmail.com
              </a>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                Whether you have a question about Siraat, need help with your
                account, want to report a problem, or simply want to say
                salaam -- we welcome your message. Our team aims to respond to
                all inquiries as quickly as possible.
              </p>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <MessageSquare size={22} className="text-amber-500" />
              </div>
              <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text">
                How You Can Contribute
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-6">
              Siraat is built for the Muslim community, and we believe the best
              products are shaped by the people who use them. There are many
              ways you can help us make Siraat better for everyone.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {/* Report Bugs */}
              <div className="card-elevated p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Bug size={20} className="text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1.5">
                      Report Bugs
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Found something that isn't working correctly? Let us know.
                      Please include details about what you were doing, what you
                      expected to happen, and what actually happened. Screenshots
                      are always helpful. Even small issues matter -- every bug
                      fix improves the experience for the entire community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggest Features */}
              <div className="card-elevated p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Lightbulb size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1.5">
                      Suggest Features
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Have an idea that would make Siraat more useful for your
                      spiritual journey? We are always looking for ways to
                      improve. Whether it is a new feature, an enhancement to
                      an existing one, or a change in how something works -- we
                      want to hear your thoughts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Help with Translations */}
              <div className="card-elevated p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1.5">
                      Help with Translations
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Siraat aims to serve Muslims everywhere. If you are fluent
                      in a language and would like to help translate the
                      interface or content, your contribution would make a real
                      difference. We are especially looking for help with Urdu,
                      Malay, Turkish, French, and Indonesian.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Feedback */}
              <div className="card-elevated p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1.5">
                      Content Feedback
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      If you notice any inaccuracies in our Islamic content,
                      prayer time calculations, or translations, please let us
                      know immediately. Accuracy is our top priority, and we
                      take every correction seriously to ensure the integrity of
                      the content we provide.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Section */}
          <div className="card-elevated p-6 md:p-8 text-center bg-primary/5 border-primary/10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-primary" />
            </div>
            <h3 className="font-playfair text-xl md:text-2xl font-bold text-text mb-3">
              Built for the Ummah
            </h3>
            <p className="text-text-secondary leading-relaxed max-w-lg mx-auto mb-3">
              Siraat is more than just an app -- it is a community effort. We
              built this platform because we believe that every Muslim deserves
              access to high-quality, free tools that support their daily
              worship and spiritual growth. The Muslim community spans every
              continent, every culture, and every language, and we are committed
              to building something that serves this beautifully diverse Ummah.
            </p>
            <p className="text-text-secondary leading-relaxed max-w-lg mx-auto mb-6">
              Whether you are a developer who wants to contribute code, a
              designer who can improve the experience, a scholar who can help
              verify content accuracy, or a user who simply wants to share
              feedback -- your involvement makes Siraat better for everyone.
              Together, we can create something truly beneficial.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:imamarham10@gmail.com"
                className="btn-primary text-sm"
              >
                <Mail size={16} />
                Send Us an Email
              </a>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-light text-text font-medium text-sm hover:bg-black/3 transition-colors"
              >
                Learn About Siraat
              </Link>
            </div>
          </div>

          {/* Back links */}
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/about" className="text-primary hover:underline">
              About Siraat
            </Link>
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

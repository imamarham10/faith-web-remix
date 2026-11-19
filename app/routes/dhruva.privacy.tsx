import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy — Dhruva" },
  {
    name: "description",
    content:
      "What the Dhruva app stores, what it sends to our servers, and what never leaves your phone.",
  },
];

/**
 * Dhruva's privacy policy.
 *
 * Written against what the app actually does, not from a template: every
 * claim below was checked against the code. Google Play requires this URL
 * in the store listing, and the Data safety form must agree with it — a
 * policy that overstates collection is as much a problem there as one that
 * understates it.
 *
 * Kept separate from /privacy, which is Siraat's. Dhruva is its own app.
 */
export default function DhruvaPrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Dhruva — Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: 18 November 2026
        </p>

        <p className="mt-6 leading-relaxed">
          Dhruva is a Hindu devotional companion — panchang, jap, paath,
          scripture and katha. This page says plainly what the app stores,
          what it sends to our servers, and what never leaves your phone.
        </p>

        <Section title="What stays on your phone, always">
          <p>These are stored on the device and are never sent to us:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong>Your birth details</strong> — date, time and place, if
              you enter them. The app says so when it asks, and that promise
              is kept in the code: nothing uploads them.
            </li>
            <li>
              <strong>Your ishta devata and rashi</strong>, chosen during
              onboarding.
            </li>
            <li>
              <strong>Your sankalp</strong> — the vow you have taken, its
              length, and which days you have kept.
            </li>
            <li>
              <strong>Your language</strong> choice.
            </li>
          </ul>
          <p className="mt-3">
            Uninstalling the app removes all of it. We cannot recover it,
            because we never had it.
          </p>
        </Section>

        <Section title="What we store on our servers">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Your email address and name</strong>, so you can sign in
              and so the app can greet you.
            </li>
            <li>
              <strong>Your jap counts</strong> — the totals and the dates, so
              the count follows you to a new phone.
            </li>
            <li>
              <strong>Your subscription status</strong>, if you buy Plus.
            </li>
          </ul>
          <p className="mt-3">
            Signing in is by email and a one-time code, or a password. We
            store a hash of a password, never the password.
          </p>
        </Section>

        <Section title="What we do not do">
          <ul className="list-disc space-y-1 pl-5">
            <li>No advertising, and no advertising identifiers.</li>
            <li>No analytics or tracking SDKs.</li>
            <li>We do not sell or share your data with anyone.</li>
            <li>
              The app asks for no location, contacts, camera, microphone or
              storage permission.
            </li>
          </ul>
        </Section>

        <Section title="Payments">
          <p>
            Plus is sold through <strong>Google Play</strong>. Your payment
            details go to Google and never reach us — we never see a card
            number. We use{" "}
            <a
              className="underline"
              href="https://www.revenuecat.com/privacy"
              rel="noreferrer noopener"
              target="_blank"
            >
              RevenueCat
            </a>{" "}
            to confirm with the store that a purchase is genuine. What reaches
            us is that your account has an active subscription, which product
            it is, and when it renews.
          </p>
        </Section>

        <Section title="Permissions the app does ask for">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Internet</strong> — to fetch panchang, scripture, temples
              and audio.
            </li>
            <li>
              <strong>Notifications and foreground service</strong> — so a
              paath or katha keeps playing with the screen off, and so the
              player appears on your lock screen. We do not send marketing
              notifications.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            Dhruva is not directed at children under 13, and we do not
            knowingly collect their data.
          </p>
        </Section>

        <Section title="Deleting your account">
          <p>
            Write to{" "}
            <a className="underline" href="mailto:support@siraat.website">
              support@siraat.website
            </a>{" "}
            from your registered email address and we will delete your account
            and the jap history attached to it within 30 days. You can also
            delete it yourself from the profile screen in the app — see{" "}
            <a className="underline" href="/dhruva/delete-account">
              how to delete your account
            </a>
            . Anything held only on your phone is removed by uninstalling the
            app.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes in a way that affects what we collect, we
            will update the date at the top and say so in the app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            <a className="underline" href="mailto:support@siraat.website">
              support@siraat.website
            </a>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 leading-relaxed">{children}</div>
    </section>
  );
}

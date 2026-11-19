import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Delete your Dhruva account" },
  {
    name: "description",
    content:
      "How to delete your Dhruva account and everything stored with it.",
  },
];

/**
 * Account deletion, as a page.
 *
 * Google Play requires a URL that works without installing the app — the
 * in-app path alone is not enough, and a policy that only gives an email
 * address is a common rejection. The in-app route is in Profile; this page
 * exists for someone who has already uninstalled, or who never installed on
 * the device they are reading this on.
 */
export default function DhruvaDeleteAccountPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Delete your Dhruva account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: 19 November 2026
        </p>

        <Section title="In the app">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open Dhruva and go to the profile screen.</li>
            <li>
              Tap <strong>Account delete karein</strong>.
            </li>
            <li>Confirm. The account is removed immediately.</li>
          </ol>
        </Section>

        <Section title="If you have already uninstalled the app">
          <p>
            Email{" "}
            <a className="underline" href="mailto:support@siraat.website?subject=Delete%20my%20Dhruva%20account">
              support@siraat.website
            </a>{" "}
            from the address you signed up with, with the subject{" "}
            <em>Delete my Dhruva account</em>. We delete it within 30 days,
            usually much sooner. We will only ever act on a request sent from
            the registered address — that is what proves it is yours.
          </p>
        </Section>

        <Section title="What is deleted">
          <p>Everything on our servers that belongs to the account:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Your email address and name</li>
            <li>Your jap counts and their history</li>
            <li>Your bookmarks and favourites</li>
            <li>Your subscription record</li>
            <li>Sign-in tokens and one-time codes</li>
          </ul>
          <p className="mt-3">
            This is a real deletion, not a flag. The rows are removed and we
            cannot recover them afterwards — there is no undo and no grace
            period during which you can change your mind.
          </p>
        </Section>

        <Section title="What was never ours to delete">
          <p>
            Your birth details, your chosen devata and rashi, and your sankalp
            are stored only on your phone and never reach our servers.
            Uninstalling the app removes them. We cannot delete them for you,
            because we have never had them — see the{" "}
            <a className="underline" href="/dhruva/privacy">
              privacy policy
            </a>
            .
          </p>
        </Section>

        <Section title="Your subscription">
          <p>
            Plus is billed by Google Play, not by us, so deleting your account
            does not cancel it. Cancel it in the Play Store under{" "}
            <strong>Payments &amp; subscriptions</strong>, or it will keep
            renewing. We cannot cancel it on your behalf.
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

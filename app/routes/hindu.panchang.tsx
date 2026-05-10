import { HinduComingSoonSection } from "~/components/HinduComingSoonSection";

export function meta() {
  return [
    { title: "Today's Panchang | Siraat" },
    { name: "robots", content: "noindex" },
  ];
}

export default function HinduPanchang() {
  return <HinduComingSoonSection title="Today's Panchang" />;
}

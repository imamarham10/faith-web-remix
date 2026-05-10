import { Sparkles } from "lucide-react";

export function HinduComingSoonSection({ title }: { title: string }) {
  return (
    <section className="bg-[#FBF6EC] min-h-[calc(100vh-4.5rem)]">
      <div className="container-faith py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6B1F2A]/10 text-[#6B1F2A] text-xs font-semibold tracking-wide mb-6">
          <Sparkles size={14} />
          In development
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-playfair text-text mb-4">
          {title}
        </h1>
        <p className="text-text-secondary max-w-md mx-auto">
          This module is being built. We'll notify you when it ships.
        </p>
      </div>
    </section>
  );
}

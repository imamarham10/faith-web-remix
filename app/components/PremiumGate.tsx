import { Lock } from "lucide-react";
import { Link } from "react-router";

interface PremiumGateProps {
  isPremium: boolean;
  children: React.ReactNode;
  featureName?: string;
  compact?: boolean;
}

export function PremiumGate({ isPremium, children, featureName, compact }: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  if (compact) {
    return (
      <div className="relative group">
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border-light shadow-sm">
            <Lock size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-text-secondary">Premium</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/70 backdrop-blur-sm rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
          <Lock size={18} className="text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-text mb-1">Premium Feature</p>
        {featureName && (
          <p className="text-xs text-text-muted mb-3">Unlock {featureName} with Premium</p>
        )}
        <Link
          to="/subscribe"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}

/** Inline lock badge for buttons/pills */
export function PremiumBadge() {
  return (
    <Lock size={10} className="text-amber-500 ml-1 inline-block" />
  );
}

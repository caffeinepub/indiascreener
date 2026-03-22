import type { ReactNode } from "react";

type Freshness = "live" | "cached" | "offline";

interface Props {
  freshness: Freshness;
}

export default function FreshnessBadge({ freshness }: Props) {
  const configs: Record<
    Freshness,
    { dot: string; label: string; bg: string; text: string }
  > = {
    live: {
      dot: "bg-emerald-400",
      label: "Live",
      bg: "bg-emerald-950/60",
      text: "text-emerald-400",
    },
    cached: {
      dot: "bg-yellow-400",
      label: "Cached",
      bg: "bg-yellow-950/60",
      text: "text-yellow-400",
    },
    offline: {
      dot: "bg-red-400",
      label: "Offline",
      bg: "bg-red-950/60",
      text: "text-red-400",
    },
  };
  const cfg = configs[freshness];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  ) as ReactNode;
}

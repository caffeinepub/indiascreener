interface RatioCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: "positive" | "negative" | "neutral";
}

export default function RatioCard({
  label,
  value,
  sub,
  highlight,
}: RatioCardProps) {
  const valueClass =
    highlight === "positive"
      ? "text-positive"
      : highlight === "negative"
        ? "text-negative"
        : "text-foreground";

  return (
    <div className="bg-card border border-border rounded-md p-3 flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-base font-semibold font-mono-data ${valueClass}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

interface TickerBadgeProps {
  symbol: string;
  className?: string;
}

export default function TickerBadge({
  symbol,
  className = "",
}: TickerBadgeProps) {
  return (
    <span
      className={`inline-block bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-xs font-mono font-semibold tracking-wider ${className}`}
    >
      {symbol}
    </span>
  );
}

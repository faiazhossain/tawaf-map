import { toBengaliNumber } from "@/lib/utils/bengali-number";

/**
 * অগ্রগতি রিং (SVG) - চক্কর/পাক ট্র্যাকার। বাংলা সংখ্যায় value/max।
 * বিশুদ্ধ উপস্থাপনমূলক উপাদান।
 */
export function ProgressRing({
  value,
  max,
  size = 56,
}: {
  value: number;
  max: number;
  size?: number;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const offset = circ * (1 - ratio);
  const done = value >= max;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${toBengaliNumber(value)} / ${toBengaliNumber(max)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={done ? "text-emerald-400" : "text-teal-400"}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">
        {toBengaliNumber(value)}/{toBengaliNumber(max)}
      </span>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";

export default function TimerRing({ duration, onComplete, compact = false }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const progress = useMemo(() => (remaining / duration) * 100, [remaining, duration]);
  const radius = compact ? 26 : 46;
  const center = compact ? 36 : 60;
  const size = compact ? 72 : 120;
  const stroke = compact ? 8 : 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress > 50 ? "#7fc7a2" : progress > 20 ? "#f6c26b" : "#ef6f6c";

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        </svg>
        <div className={`absolute text-white font-display font-semibold ${compact ? "text-lg" : "text-3xl"}`}>
          {Math.ceil(remaining)}
        </div>
      </div>
      {!compact && (
        <div className="text-xs uppercase tracking-[0.3em] text-white/60">Secondes</div>
      )}
    </div>
  );
}

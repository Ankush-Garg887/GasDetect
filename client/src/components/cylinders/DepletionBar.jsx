export default function DepletionBar({ percentage = 0 }) {
  const getColor = () => {
    if (percentage <= 10) return { bar: 'bg-gradient-to-r from-red-500 to-red-400', glow: 'shadow-red-500/30' };
    if (percentage <= 30) return { bar: 'bg-gradient-to-r from-amber-500 to-amber-400', glow: 'shadow-amber-500/30' };
    return { bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400', glow: 'shadow-emerald-500/30' };
  };

  const colors = getColor();
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Fill Level</span>
        <span className="font-medium tabular-nums">{clamped.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2.5 bg-navy-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full progress-bar-fill ${colors.bar} shadow-sm ${colors.glow}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

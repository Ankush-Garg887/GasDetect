export default function StatusBadge({ status, size = 'sm' }) {
  const config = {
    Active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Low: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    Critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    Expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
    Inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
    SAFE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    WARNING: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    DANGER: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    danger: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    info: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    normal: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'Order Soon': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Replace Immediately': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    Good: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Empty: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  };

  const c = config[status] || config.Inactive;
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`badge ${c.bg} ${c.text} border ${c.border} ${sizeClass}`}>
      {status}
    </span>
  );
}

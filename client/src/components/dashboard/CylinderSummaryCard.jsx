import { HiOutlineBeaker, HiOutlineExclamationCircle, HiOutlineClock } from 'react-icons/hi';
import StatusBadge from '../common/StatusBadge';

export default function CylinderSummaryCard({ summary }) {
  if (!summary) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineBeaker className="text-electric-400" />
          Cylinders Status
        </h3>
        <p className="text-gray-500 text-sm">No cylinder data available</p>
      </div>
    );
  }

  const { totalActive = 0, criticalCount = 0, soonestEmpty, top3Urgent = [] } = summary;

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <HiOutlineBeaker className="text-electric-400" />
        Cylinders Status
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-navy-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-white">{totalActive}</p>
        </div>
        <div className="bg-navy-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Critical</p>
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
        </div>
      </div>

      {/* Soonest empty */}
      {soonestEmpty && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
            <HiOutlineExclamationCircle />
            <span>Soonest to empty</span>
          </div>
          <p className="text-sm font-medium text-white">{soonestEmpty.cylinderId}</p>
          <p className="text-xs text-gray-400">
            {soonestEmpty.daysRemaining > 0
              ? `${Math.ceil(soonestEmpty.daysRemaining)} days remaining`
              : 'Expired'
            }
          </p>
        </div>
      )}

      {/* Top 3 urgent */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Top Urgent</p>
        {top3Urgent.map((c, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2">
              <HiOutlineClock className="text-gray-500 text-sm" />
              <div>
                <p className="text-sm text-white">{c.cylinderId}</p>
                <p className="text-[10px] text-gray-500">{c.gasType}</p>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={c.urgency?.badge || 'Good'} />
              <p className="text-[10px] text-gray-500 mt-1">
                {c.daysRemaining > 0 ? `${Math.ceil(c.daysRemaining)}d left` : 'Empty'}
              </p>
            </div>
          </div>
        ))}
        {top3Urgent.length === 0 && (
          <p className="text-xs text-gray-600">No urgent cylinders</p>
        )}
      </div>
    </div>
  );
}

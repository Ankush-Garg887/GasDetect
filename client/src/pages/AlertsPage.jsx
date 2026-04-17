import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineBell, HiOutlineCheck, HiOutlineExclamation,
  HiOutlineShieldCheck, HiOutlineCalendar,
} from 'react-icons/hi';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', acknowledged: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAlerts = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (filter.type) params.type = filter.type;
      if (filter.acknowledged) params.acknowledged = filter.acknowledged;

      const [alertRes, statsRes] = await Promise.all([
        axios.get('/alerts', { params }),
        axios.get('/alerts/stats'),
      ]);
      setAlerts(alertRes.data.alerts);
      setPagination(alertRes.data.pagination);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await axios.put(`/alerts/${id}/ack`);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to acknowledge');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="page-title">Alerts & Notifications</h1>
        <p className="page-subtitle">Monitor gas level and cylinder depletion alerts</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: stats.today || 0, icon: HiOutlineBell, color: 'text-electric-400' },
          { label: 'This Week', value: stats.thisWeek || 0, icon: HiOutlineCalendar, color: 'text-purple-400' },
          { label: 'This Month', value: stats.thisMonth || 0, icon: HiOutlineShieldCheck, color: 'text-cyan-400' },
          { label: 'Danger', value: stats.byLevel?.danger || 0, icon: HiOutlineExclamation, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2">
              <s.icon className={`${s.color} text-lg`} />
              <span className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="input-field w-auto py-2 text-sm">
          <option value="">All Types</option>
          <option value="gas">Gas Alerts</option>
          <option value="depletion">Depletion Alerts</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select value={filter.acknowledged} onChange={(e) => setFilter({ ...filter, acknowledged: e.target.value })}
          className="input-field w-auto py-2 text-sm">
          <option value="">All Status</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>
      </div>

      {/* Alert table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">PPM</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert._id} className="table-row">
                <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                  {new Date(alert.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-gray-300 capitalize">{alert.type}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={alert.level} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{alert.message}</td>
                <td className="px-4 py-3 text-sm text-white font-medium tabular-nums">
                  {alert.ppm ? `${alert.ppm} PPM` : '—'}
                </td>
                <td className="px-4 py-3">
                  {alert.acknowledged ? (
                    <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <HiOutlineCheck size={12} /> Ack
                    </span>
                  ) : (
                    <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 alert-pulse">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      className="text-xs text-electric-400 hover:text-electric-300 transition-colors font-medium"
                      id={`ack-${alert._id}`}
                    >
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <HiOutlineShieldCheck className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No alerts found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                p === page ? 'bg-electric-500 text-white' : 'bg-navy-700 text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

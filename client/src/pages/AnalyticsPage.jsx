import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, CartesianGrid, Legend, Cell,
} from 'recharts';
import { HiOutlineDownload, HiOutlineChartBar } from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RANGES = ['1h', '6h', '24h', '7d', '30d'];
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [gasData, setGasData] = useState(null);
  const [cylinderData, setCylinderData] = useState(null);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('gas');

  const fetchData = useCallback(async () => {
    try {
      const [gasRes, cylRes] = await Promise.all([
        axios.get('/analytics/gas', { params: { range } }),
        axios.get('/analytics/cylinders'),
      ]);
      setGasData(gasRes.data);
      setCylinderData(cylRes.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = async () => {
    try {
      const res = await axios.get('/analytics/export', { params: { range } });
      const { default: Papa } = await import('papaparse');
      const csv = Papa.unparse(res.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor_data_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      toast.success('Data exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  const tooltipStyle = {
    backgroundColor: '#1a1f4e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#f8fafc',
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics & History</h1>
          <p className="page-subtitle">Detailed gas sensor and cylinder consumption analytics</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary text-sm flex items-center gap-1" id="export-analytics">
          <HiOutlineDownload size={16} /> Export CSV
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-navy-800/50 rounded-xl p-1 w-fit">
        {['gas', 'cylinders'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-electric-500 text-white shadow-lg shadow-electric-500/25' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'gas' ? 'Gas Sensor' : 'Cylinder'}
          </button>
        ))}
      </div>

      {tab === 'gas' && (
        <>
          {/* Time range selector */}
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  range === r ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'bg-navy-800/50 text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Stats summary */}
          {gasData?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <span className="text-xs text-gray-400 uppercase">Total Readings</span>
                <p className="text-2xl font-bold text-white tabular-nums">{gasData.stats.totalReadings}</p>
              </div>
              <div className="stat-card">
                <span className="text-xs text-gray-400 uppercase">Avg PPM</span>
                <p className="text-2xl font-bold text-electric-400 tabular-nums">{Math.round(gasData.stats.avgPpm || 0)}</p>
              </div>
              <div className="stat-card">
                <span className="text-xs text-gray-400 uppercase">Max PPM</span>
                <p className="text-2xl font-bold text-red-400 tabular-nums">{Math.round(gasData.stats.maxPpm || 0)}</p>
              </div>
              <div className="stat-card">
                <span className="text-xs text-gray-400 uppercase">Total Alerts</span>
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{gasData.totalAlerts || 0}</p>
              </div>
            </div>
          )}

          {/* Line chart: PPM over time */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Gas Level Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gasData?.dailyAverages || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="avg" name="Avg PPM" stroke="#3b82f6" fill="url(#avgGrad)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="max" name="Max PPM" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="min" name="Min PPM" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart: daily averages */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Daily Average Gas Levels</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gasData?.dailyAverages || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg" name="Avg PPM" radius={[4, 4, 0, 0]}>
                  {(gasData?.dailyAverages || []).map((entry, i) => (
                    <Cell key={i} fill={entry.avg > 800 ? '#ef4444' : entry.avg > 400 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Hourly Patterns (Heatmap)</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1 min-w-[700px]">
                <div className="text-xs text-gray-600" />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center text-[9px] text-gray-500">{h}:00</div>
                ))}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, di) => (
                  <>
                    <div key={`label-${di}`} className="text-xs text-gray-400 pr-2 flex items-center">{day}</div>
                    {Array.from({ length: 24 }, (_, h) => {
                      const cell = (gasData?.heatmap || []).find(
                        (c) => c.dayOfWeek === di + 1 && c.hour === h
                      );
                      const intensity = cell ? Math.min((cell.avgPpm || 0) / 800, 1) : 0;
                      return (
                        <div
                          key={`${di}-${h}`}
                          className="aspect-square rounded-sm transition-colors cursor-pointer"
                          style={{
                            backgroundColor: intensity > 0.8 ? `rgba(239,68,68,${intensity})` :
                              intensity > 0.4 ? `rgba(245,158,11,${intensity})` :
                              intensity > 0 ? `rgba(34,197,94,${intensity})` : 'rgba(255,255,255,0.03)',
                          }}
                          title={cell ? `${day} ${h}:00 — ${cell.avgPpm} PPM avg` : `${day} ${h}:00 — No data`}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'cylinders' && (
        <>
          {/* Days remaining bar chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Estimated Days Remaining</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cylinderData?.daysRemainingChart || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cylinderId" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="daysRemaining" name="Days Left" radius={[4, 4, 0, 0]}>
                  {(cylinderData?.daysRemainingChart || []).map((entry, i) => (
                    <Cell key={i} fill={entry.daysRemaining <= 7 ? '#ef4444' : entry.daysRemaining <= 30 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Refill frequency */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Refill Frequency (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cylinderData?.refillFrequency || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cylinderId" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="refillCount" name="Refills" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Consumption comparison */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Consumption by Gas Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cylinderData?.consumptionComparison || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="gasType" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgDailyConsumption" name="Avg Daily Rate" radius={[4, 4, 0, 0]}>
                  {(cylinderData?.consumptionComparison || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

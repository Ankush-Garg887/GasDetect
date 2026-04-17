import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiOutlineUser, HiOutlineCog, HiOutlineWifi, HiOutlineShieldCheck,
  HiOutlineMoon, HiOutlineSun, HiOutlineTerminal, HiOutlineRefresh,
} from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SENSOR_TYPES = ['MQ-2', 'MQ-3', 'MQ-4', 'MQ-5', 'MQ-6', 'MQ-7', 'MQ-8', 'MQ-9', 'MQ-135'];
const GAS_TYPES = ['LPG', 'CO', 'CO2', 'Methane', 'CNG', 'Oxygen', 'Acetylene'];

export default function SettingsPage() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [tab, setTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemLogs, setSystemLogs] = useState([]);

  // Profile form
  const [profile, setProfile] = useState({ name: '', email: '', password: '' });

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    refreshInterval: 2,
    sensorType: 'MQ-2',
    mqttBroker: '',
    apiEndpoint: 'http://localhost:5000/api/sensor/data',
    soundEnabled: true,
    thresholds: {},
  });

  const fetchSettings = useCallback(async () => {
    try {
      const [settRes, logRes] = await Promise.all([
        axios.get('/settings'),
        axios.get('/sensor/logs'),
      ]);
      setSettings(settRes.data);
      setSettingsForm({
        refreshInterval: settRes.data.refreshInterval || 2,
        sensorType: settRes.data.sensorType || 'MQ-2',
        mqttBroker: settRes.data.mqttBroker || '',
        apiEndpoint: settRes.data.apiEndpoint || 'http://localhost:5000/api/sensor/data',
        soundEnabled: settRes.data.soundEnabled !== false,
        thresholds: settRes.data.thresholds || {},
      });
      setSystemLogs(logRes.data);
      setProfile({ name: user?.name || '', email: user?.email || '', password: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const data = { name: profile.name, email: profile.email };
      if (profile.password) data.password = profile.password;
      await axios.put('/settings/profile', data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put('/settings', settingsForm);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleThresholdChange = (gasType, field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [gasType]: {
          ...(prev.thresholds[gasType] || { warning: 400, danger: 800 }),
          [field]: Number(value),
        },
      },
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure system preferences and thresholds</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-navy-800/50 rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: 'profile', label: 'Profile', icon: HiOutlineUser },
          { key: 'nodemcu', label: 'NodeMCU', icon: HiOutlineWifi },
          { key: 'thresholds', label: 'Thresholds', icon: HiOutlineShieldCheck },
          { key: 'system', label: 'System Logs', icon: HiOutlineTerminal },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-electric-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="max-w-lg">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineUser className="text-electric-400" /> Profile Settings
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="input-label">New Password (leave blank to keep current)</label>
                <input type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                  className="input-field" placeholder="••••••••" />
              </div>

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {darkMode ? <HiOutlineMoon className="text-electric-400" /> : <HiOutlineSun className="text-amber-400" />}
                  <span className="text-sm text-gray-300">Dark Mode</span>
                </div>
                <button type="button" onClick={toggleDarkMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-electric-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <button type="submit" className="btn-primary w-full">Save Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* NodeMCU Config Tab */}
      {tab === 'nodemcu' && (
        <div className="max-w-lg space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineWifi className="text-electric-400" /> NodeMCU Configuration
            </h3>

            <div>
              <label className="input-label">API Endpoint (NodeMCU sends data here)</label>
              <input value={settingsForm.apiEndpoint}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiEndpoint: e.target.value })}
                className="input-field font-mono text-sm" />
            </div>

            <div>
              <label className="input-label">MQTT Broker URL (optional)</label>
              <input value={settingsForm.mqttBroker}
                onChange={(e) => setSettingsForm({ ...settingsForm, mqttBroker: e.target.value })}
                className="input-field font-mono text-sm"
                placeholder="mqtt://broker.example.com:1883" />
            </div>

            <div>
              <label className="input-label">Refresh Interval (seconds)</label>
              <select value={settingsForm.refreshInterval}
                onChange={(e) => setSettingsForm({ ...settingsForm, refreshInterval: Number(e.target.value) })}
                className="input-field">
                <option value={1}>1 second</option>
                <option value={2}>2 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>

            <div>
              <label className="input-label">Gas Sensor Type</label>
              <select value={settingsForm.sensorType}
                onChange={(e) => setSettingsForm({ ...settingsForm, sensorType: e.target.value })}
                className="input-field">
                {SENSOR_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg">
              <span className="text-sm text-gray-300">Sound Alerts</span>
              <button type="button"
                onClick={() => setSettingsForm({ ...settingsForm, soundEnabled: !settingsForm.soundEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${settingsForm.soundEnabled ? 'bg-electric-500' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settingsForm.soundEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <button onClick={handleSaveSettings} className="btn-primary w-full">Save Configuration</button>
          </div>
        </div>
      )}

      {/* Thresholds Tab */}
      {tab === 'thresholds' && (
        <div className="max-w-2xl">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineShieldCheck className="text-electric-400" /> Danger Thresholds per Gas Type
            </h3>

            <div className="space-y-4">
              {GAS_TYPES.map((gas) => {
                const t = settingsForm.thresholds[gas] || { warning: 400, danger: 800 };
                return (
                  <div key={gas} className="grid grid-cols-3 gap-4 items-center p-3 bg-navy-800/30 rounded-lg">
                    <span className="text-sm text-white font-medium">{gas}</span>
                    <div>
                      <label className="text-[10px] text-amber-400 uppercase">Warning (PPM)</label>
                      <input type="number" value={t.warning}
                        onChange={(e) => handleThresholdChange(gas, 'warning', e.target.value)}
                        className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-red-400 uppercase">Danger (PPM)</label>
                      <input type="number" value={t.danger}
                        onChange={(e) => handleThresholdChange(gas, 'danger', e.target.value)}
                        className="input-field py-2 text-sm" />
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSaveSettings} className="btn-primary w-full">Save Thresholds</button>
          </div>
        </div>
      )}

      {/* System Logs Tab */}
      {tab === 'system' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Last {systemLogs.length} HTTP Requests from NodeMCU
            </h3>
            <button onClick={fetchSettings} className="btn-secondary text-sm flex items-center gap-1">
              <HiOutlineRefresh size={16} /> Refresh
            </button>
          </div>

          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Endpoint</th>
                  <th className="px-4 py-3 text-left">Sensor</th>
                  <th className="px-4 py-3 text-left">PPM</th>
                  <th className="px-4 py-3 text-left">Gas</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {systemLogs.map((log, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{log.method}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-300 font-mono">{log.endpoint}</td>
                    <td className="px-4 py-3 text-sm text-white">{log.sensorId}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium tabular-nums">{log.ppm}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{log.gasType}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {systemLogs.length === 0 && (
              <div className="text-center py-12">
                <HiOutlineTerminal className="text-4xl text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No requests received yet</p>
                <p className="text-gray-600 text-xs mt-1">Connect a NodeMCU to start seeing logs</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import GasGauge from '../components/dashboard/GasGauge';
import MiniLineChart from '../components/dashboard/MiniLineChart';
import StatsCards from '../components/dashboard/StatsCards';
import AlarmPopup from '../components/dashboard/AlarmPopup';
import CylinderSummaryCard from '../components/dashboard/CylinderSummaryCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const [sensors, setSensors] = useState([]);
  const [history, setHistory] = useState([]);
  const [cylinderSummary, setCylinderSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);
  const { socket } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const [sensorRes, historyRes, cylRes] = await Promise.all([
        axios.get('/sensor/latest'),
        axios.get('/sensor/history', { params: { range: '1h' } }),
        axios.get('/cylinders/depletion-summary'),
      ]);
      setSensors(sensorRes.data);
      setHistory(historyRes.data);
      setCylinderSummary(cylRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s as fallback
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleSensorData = (data) => {
      setSensors((prev) => {
        const idx = prev.findIndex((s) => s.sensorId === data.sensorId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ppm: data.ppm, timestamp: data.timestamp, gasType: data.gasType };
          return updated;
        }
        return [...prev, { sensorId: data.sensorId, ppm: data.ppm, gasType: data.gasType, timestamp: data.timestamp, todayStats: { max: data.ppm, min: data.ppm, avg: data.ppm, readings: 1 } }];
      });
      setHistory((prev) => [data, ...prev].slice(0, 500));
    };

    const handleAlert = (alert) => {
      setActiveAlert(alert);
    };

    socket.on('sensor-data', handleSensorData);
    socket.on('new-alert', handleAlert);

    return () => {
      socket.off('sensor-data', handleSensorData);
      socket.off('new-alert', handleAlert);
    };
  }, [socket]);

  if (loading) return <LoadingSpinner />;

  // Build stats from first sensor
  const primarySensor = sensors[0];
  const stats = primarySensor ? {
    current: Math.round(primarySensor.ppm),
    max: primarySensor.todayStats?.max || 0,
    min: primarySensor.todayStats?.min || 0,
    avg: primarySensor.todayStats?.avg || 0,
  } : { current: 0, max: 0, min: 0, avg: 0 };

  // Filter history for last 30 min
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  const recentHistory = history
    .filter((r) => new Date(r.timestamp).getTime() > thirtyMinAgo)
    .reverse();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="page-title">Live Dashboard</h1>
        <p className="page-subtitle">Real-time gas monitoring and cylinder status overview</p>
      </div>

      {/* Alert popup */}
      <AlarmPopup alert={activeAlert} onDismiss={() => setActiveAlert(null)} />

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Gauges + Chart + Cylinder Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauges */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sensors.length > 0 ? (
              sensors.map((sensor) => (
                <GasGauge
                  key={sensor.sensorId || sensor._id}
                  value={sensor.ppm}
                  max={1000}
                  gasType={sensor.gasType}
                  sensorId={sensor.sensorId || sensor._id}
                  lastUpdated={sensor.timestamp}
                />
              ))
            ) : (
              <GasGauge value={0} max={1000} gasType="LPG" sensorId="No Sensor" />
            )}
          </div>

          {/* Mini chart */}
          <div className="mt-4">
            <MiniLineChart data={recentHistory} height={160} />
          </div>
        </div>

        {/* Cylinder summary */}
        <div>
          <CylinderSummaryCard summary={cylinderSummary} />
        </div>
      </div>
    </div>
  );
}

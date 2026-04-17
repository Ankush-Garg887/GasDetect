import { useMemo } from 'react';

export default function GasGauge({ value = 0, max = 1000, gasType = 'LPG', sensorId = 'MCU-01', lastUpdated }) {
  // Calculate needle rotation: -135deg (min) to 135deg (max)
  const rotation = useMemo(() => {
    const clamped = Math.min(Math.max(value, 0), max);
    return -135 + (clamped / max) * 270;
  }, [value, max]);

  // Determine status
  const status = useMemo(() => {
    const pct = value / max;
    if (pct >= 0.8) return { label: 'DANGER', color: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (pct >= 0.5) return { label: 'WARNING', color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { label: 'SAFE', color: '#22c55e', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }, [value, max]);

  const percentage = Math.round((value / max) * 100);

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      {/* Sensor label */}
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs text-gray-500 font-mono">{sensorId}</span>
        <span className={`badge ${status.bg} ${status.text} border ${status.border}`}>
          {status.label}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="gauge-container relative w-56 h-36">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background arc */}
          <defs>
            <linearGradient id={`gaugeGrad-${sensorId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="80%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Gauge track (background) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Gauge fill */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#gaugeGrad-${sensorId})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset={251.3 - (percentage / 100) * 251.3}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            filter="url(#glow)"
          />

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const angle = (-135 + pct * 270) * (Math.PI / 180);
            const innerR = 68;
            const outerR = 78;
            const x1 = 100 + innerR * Math.cos(angle);
            const y1 = 100 + innerR * Math.sin(angle);
            const x2 = 100 + outerR * Math.cos(angle);
            const y2 = 100 + outerR * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            );
          })}

          {/* Tick labels */}
          <text x="18" y="115" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">0</text>
          <text x="100" y="18" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{max / 2}</text>
          <text x="182" y="115" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{max}</text>

          {/* Needle */}
          <g className="gauge-needle" style={{ transform: `rotate(${rotation}deg)` }}>
            <line x1="100" y1="100" x2="100" y2="30"
              stroke={status.color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={status.color} />
            <circle cx="100" cy="100" r="3" fill="#0a0e27" />
          </g>
        </svg>
      </div>

      {/* PPM readout */}
      <div className="text-center mt-2">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white tabular-nums" style={{ color: status.color }}>
            {Math.round(value)}
          </span>
          <span className="text-sm text-gray-400 font-medium">PPM</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{gasType}</p>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-[10px] text-gray-600 mt-3">
          Updated: {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

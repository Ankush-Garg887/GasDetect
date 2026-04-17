import { useState, useEffect } from 'react';
import { HiOutlineBell, HiOutlineX } from 'react-icons/hi';

export default function AlarmPopup({ alert, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      // Play alarm sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Lk42Ff3N0eIONk5OMg3hybmd1gIyWlI+Gfndyb3iFjpeUjYR+d3Jwe4SOlpSNg31ycHB6hY+WlI2DfXJvcnyGj5aUjYN9cm9ye4aPl5SNg31ybnJ7ho+XlIyDfXJucnuGj5eUjYN9');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // Ignore autoplay restrictions
      } catch (e) {}

      const timer = setTimeout(() => setVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (!visible || !alert) return null;

  const isDanger = alert.level === 'danger' || alert.level === 'critical';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-sm">
      <div className={`rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
        isDanger ? 'bg-red-500/20 border-red-500/40 shadow-red-500/20' : 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/20'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isDanger ? 'bg-red-500/30' : 'bg-amber-500/30'} alert-pulse`}>
            <HiOutlineBell className={`text-xl ${isDanger ? 'text-red-400 bell-ring' : 'text-amber-400 bell-ring'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${isDanger ? 'text-red-300' : 'text-amber-300'}`}>
              {isDanger ? '🚨 DANGER ALERT' : '⚠️ WARNING'}
            </h4>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{alert.message}</p>
            {alert.ppm && (
              <p className={`text-lg font-bold mt-2 ${isDanger ? 'text-red-400' : 'text-amber-400'}`}>
                {alert.ppm} PPM
              </p>
            )}
          </div>
          <button
            onClick={() => { setVisible(false); onDismiss?.(); }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <HiOutlineX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

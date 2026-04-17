import { useState } from 'react';
import { HiOutlineX } from 'react-icons/hi';

export default function RefillDialog({ cylinder, onSubmit, onClose }) {
  const [form, setForm] = useState({
    installDate: new Date().toISOString().slice(0, 16),
    capacity: cylinder?.capacity || '',
    dailyConsumptionRate: cylinder?.dailyConsumptionRate || '0.5',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      installDate: form.installDate,
      capacity: Number(form.capacity),
      dailyConsumptionRate: Number(form.dailyConsumptionRate),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-card p-6 max-w-md w-full animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Refill Cylinder</h2>
            <p className="text-sm text-gray-400 mt-1">{cylinder?.cylinderId} — {cylinder?.gasType}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><HiOutlineX size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">New Installation Date</label>
            <input name="installDate" type="datetime-local" value={form.installDate}
              onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="input-label">New Capacity ({cylinder?.capacityUnit || 'kg'})</label>
            <input name="capacity" type="number" step="0.1" value={form.capacity}
              onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="input-label">Updated Consumption Rate ({cylinder?.capacityUnit || 'kg'}/day)</label>
            <input name="dailyConsumptionRate" type="number" step="0.01" value={form.dailyConsumptionRate}
              onChange={handleChange} className="input-field" required />
          </div>

          {/* Previous refill history */}
          {cylinder?.refillHistory?.length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Refill History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cylinder.refillHistory.slice(-3).map((h, i) => (
                  <div key={i} className="flex justify-between text-xs bg-navy-800/30 rounded-lg p-2">
                    <span className="text-gray-400">{new Date(h.date).toLocaleDateString()}</span>
                    <span className="text-gray-300">{h.capacity} {cylinder.capacityUnit}</span>
                    <span className="text-gray-500">{h.performedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-success flex-1" id="refill-submit">Confirm Refill</button>
          </div>
        </form>
      </div>
    </div>
  );
}

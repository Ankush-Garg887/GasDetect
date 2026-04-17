import { useState, useEffect } from 'react';
import { HiOutlineX } from 'react-icons/hi';

const GAS_TYPES = ['LPG', 'CNG', 'CO2', 'Oxygen', 'Acetylene', 'Nitrogen', 'Hydrogen', 'Methane', 'Other'];

export default function CylinderForm({ cylinder, onSubmit, onClose }) {
  const isEdit = !!cylinder;
  const [form, setForm] = useState({
    cylinderId: '', serialNumber: '', gasType: 'LPG', capacity: '',
    capacityUnit: 'kg', installDate: new Date().toISOString().slice(0, 16),
    dailyConsumptionRate: '0.5', location: '', status: 'Active', notes: '', sensorId: '',
  });

  useEffect(() => {
    if (cylinder) {
      setForm({
        cylinderId: cylinder.cylinderId || '',
        serialNumber: cylinder.serialNumber || '',
        gasType: cylinder.gasType || 'LPG',
        capacity: cylinder.capacity || '',
        capacityUnit: cylinder.capacityUnit || 'kg',
        installDate: cylinder.installDate ? new Date(cylinder.installDate).toISOString().slice(0, 16) : '',
        dailyConsumptionRate: cylinder.dailyConsumptionRate || '0.5',
        location: cylinder.location || '',
        status: cylinder.status || 'Active',
        notes: cylinder.notes || '',
        sensorId: cylinder.sensorId || '',
      });
    }
  }, [cylinder]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      capacity: Number(form.capacity),
      dailyConsumptionRate: Number(form.dailyConsumptionRate),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Cylinder' : 'Add Cylinder'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <HiOutlineX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Cylinder ID *</label>
              <input name="cylinderId" value={form.cylinderId} onChange={handleChange} required
                className="input-field" placeholder="CYL-001" disabled={isEdit} />
            </div>
            <div>
              <label className="input-label">Serial Number</label>
              <input name="serialNumber" value={form.serialNumber} onChange={handleChange}
                className="input-field" placeholder="SN-12345" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Gas Type *</label>
              <select name="gasType" value={form.gasType} onChange={handleChange} className="input-field">
                {GAS_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="input-label">Capacity *</label>
              <input name="capacity" type="number" step="0.1" min="0" value={form.capacity} onChange={handleChange}
                required className="input-field" placeholder="14.2" />
            </div>
            <div>
              <label className="input-label">Unit</label>
              <select name="capacityUnit" value={form.capacityUnit} onChange={handleChange} className="input-field">
                <option value="kg">kg</option>
                <option value="L">Liters</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Installation Date & Time *</label>
            <input name="installDate" type="datetime-local" value={form.installDate} onChange={handleChange}
              required className="input-field" />
          </div>

          <div>
            <label className="input-label">Daily Consumption Rate ({form.capacityUnit}/day) *</label>
            <input name="dailyConsumptionRate" type="number" step="0.01" min="0" value={form.dailyConsumptionRate}
              onChange={handleChange} required className="input-field" placeholder="0.5" />
            <p className="text-[10px] text-gray-600 mt-1">Auto-calculated from sensor data if linked</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Location / Room</label>
              <input name="location" value={form.location} onChange={handleChange}
                className="input-field" placeholder="Kitchen / Lab A" />
            </div>
            <div>
              <label className="input-label">Linked Sensor ID</label>
              <input name="sensorId" value={form.sensorId} onChange={handleChange}
                className="input-field" placeholder="MCU-01" />
            </div>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="input-field resize-none" placeholder="Additional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" id="cylinder-form-submit">
              {isEdit ? 'Update Cylinder' : 'Add Cylinder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

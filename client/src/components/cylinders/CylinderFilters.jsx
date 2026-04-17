import { HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';

const GAS_TYPES = ['All', 'LPG', 'CNG', 'CO2', 'Oxygen', 'Acetylene', 'Nitrogen', 'Hydrogen', 'Methane'];
const STATUSES = ['All', 'Active', 'Low', 'Critical', 'Expired', 'Inactive'];
const URGENCIES = ['All', 'normal', 'low', 'critical', 'expired'];

export default function CylinderFilters({ filters, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value === 'All' ? '' : value });
  };

  return (
    <div className="glass-card p-4 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search cylinders..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="input-field pl-10 py-2.5"
          id="cylinder-search"
        />
      </div>

      <div className="flex items-center gap-2 text-gray-400">
        <HiOutlineFilter size={18} />
      </div>

      {/* Gas type */}
      <select
        value={filters.gasType || 'All'}
        onChange={(e) => handleChange('gasType', e.target.value)}
        className="input-field w-auto py-2.5 text-sm"
        id="filter-gas-type"
      >
        {GAS_TYPES.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Gas Types' : t}</option>)}
      </select>

      {/* Status */}
      <select
        value={filters.status || 'All'}
        onChange={(e) => handleChange('status', e.target.value)}
        className="input-field w-auto py-2.5 text-sm"
        id="filter-status"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
      </select>

      {/* Urgency */}
      <select
        value={filters.urgency || 'All'}
        onChange={(e) => handleChange('urgency', e.target.value)}
        className="input-field w-auto py-2.5 text-sm"
        id="filter-urgency"
      >
        {URGENCIES.map((u) => (
          <option key={u} value={u}>
            {u === 'All' ? 'All Urgency' : u.charAt(0).toUpperCase() + u.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

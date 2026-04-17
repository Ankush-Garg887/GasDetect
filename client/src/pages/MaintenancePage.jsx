import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlinePlus, HiOutlineCheck, HiOutlineTrash,
  HiOutlineClipboardCheck, HiOutlineDocumentReport, HiOutlineX,
} from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DEFAULT_DAILY_ITEMS = [
  'Check gas detector functionality',
  'Verify sensor readings are within normal range',
  'Inspect all gas cylinder connections for leaks',
  'Check emergency shutdown system',
  'Verify ventilation system is operational',
  'Inspect fire extinguisher status',
  'Check gas cylinder pressure gauges',
  'Review overnight alert log',
];

const DEFAULT_WEEKLY_ITEMS = [
  'Full gas detection system calibration check',
  'Inspect all cylinder valves and regulators',
  'Test alarm and notification system',
  'Review weekly consumption reports',
  'Check backup battery systems',
  'Inspect gas pipeline integrity',
  'Update maintenance logs',
  'Review and update safety procedures',
];

export default function MaintenancePage() {
  const [tab, setTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ cylinderId: '', title: '', description: '', nextInspectionDate: '' });
  const [checklistType, setChecklistType] = useState('daily');
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistNotes, setChecklistNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, checkRes] = await Promise.all([
        axios.get('/maintenance/schedules'),
        axios.get('/maintenance/checklists', { params: { limit: 20 } }),
      ]);
      setSchedules(schedRes.data);
      setChecklists(checkRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const items = checklistType === 'daily' ? DEFAULT_DAILY_ITEMS : DEFAULT_WEEKLY_ITEMS;
    setChecklistItems(items.map((label) => ({ label, checked: false })));
  }, [checklistType]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/maintenance/schedules', scheduleForm);
      toast.success('Schedule created');
      setShowAddSchedule(false);
      setScheduleForm({ cylinderId: '', title: '', description: '', nextInspectionDate: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create schedule');
    }
  };

  const handleCompleteSchedule = async (id) => {
    try {
      await axios.put(`/maintenance/schedules/${id}`, { completed: true });
      toast.success('Marked as completed');
      fetchData();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await axios.delete(`/maintenance/schedules/${id}`);
      toast.success('Schedule deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleChecklistItem = (index) => {
    const updated = [...checklistItems];
    updated[index].checked = !updated[index].checked;
    setChecklistItems(updated);
  };

  const handleSubmitChecklist = async () => {
    try {
      await axios.post('/maintenance/checklists', {
        type: checklistType,
        items: checklistItems,
        notes: checklistNotes,
      });
      toast.success('Checklist submitted!');
      setChecklistNotes('');
      const items = checklistType === 'daily' ? DEFAULT_DAILY_ITEMS : DEFAULT_WEEKLY_ITEMS;
      setChecklistItems(items.map((label) => ({ label, checked: false })));
      fetchData();
    } catch (err) {
      toast.error('Failed to submit checklist');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Safety Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      // Maintenance schedules
      doc.setFontSize(14);
      doc.text('Maintenance Schedules', 14, 45);
      autoTable(doc, {
        startY: 50,
        head: [['Cylinder', 'Title', 'Next Inspection', 'Status']],
        body: schedules.map((s) => [
          s.cylinderId, s.title,
          new Date(s.nextInspectionDate).toLocaleDateString(),
          s.completed ? 'Completed' : 'Pending',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Recent checklists
      const y = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Recent Safety Checklists', 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['Type', 'Submitted By', 'Date', 'Items Checked']],
        body: checklists.slice(0, 10).map((c) => [
          c.type, c.submittedBy,
          new Date(c.submittedAt).toLocaleDateString(),
          `${c.items?.filter((i) => i.checked).length || 0}/${c.items?.length || 0}`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`safety_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Safety report generated!');
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingSchedules = schedules.filter((s) => !s.completed);
  const completedSchedules = schedules.filter((s) => s.completed);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Maintenance & Safety</h1>
          <p className="page-subtitle">Schedule inspections and submit safety checklists</p>
        </div>
        <button onClick={handleGenerateReport} className="btn-primary text-sm flex items-center gap-1" id="generate-report">
          <HiOutlineDocumentReport size={18} /> Generate PDF Report
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-navy-800/50 rounded-xl p-1 w-fit">
        {[
          { key: 'schedules', label: 'Schedules', icon: HiOutlineCalendar },
          { key: 'checklist', label: 'Safety Checklist', icon: HiOutlineClipboardCheck },
          { key: 'history', label: 'History', icon: HiOutlineDocumentReport },
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

      {/* Schedules Tab */}
      {tab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddSchedule(true)} className="btn-primary text-sm flex items-center gap-1">
              <HiOutlinePlus size={16} /> Add Schedule
            </button>
          </div>

          {/* Pending */}
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending ({pendingSchedules.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSchedules.map((s) => (
              <div key={s._id} className="glass-card-hover p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">{s.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">Cylinder: {s.cylinderId}</p>
                    {s.description && <p className="text-sm text-gray-400 mt-2">{s.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleCompleteSchedule(s._id)}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Mark Complete">
                      <HiOutlineCheck size={18} />
                    </button>
                    <button onClick={() => handleDeleteSchedule(s._id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <HiOutlineCalendar />
                  <span>Due: {new Date(s.nextInspectionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {pendingSchedules.length === 0 && <p className="text-gray-600 text-sm col-span-2">No pending inspections</p>}
          </div>

          {/* Add Schedule Modal */}
          {showAddSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSchedule(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative glass-card p-6 max-w-md w-full animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">New Maintenance Schedule</h3>
                  <button onClick={() => setShowAddSchedule(false)} className="text-gray-400 hover:text-white"><HiOutlineX size={20} /></button>
                </div>
                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div>
                    <label className="input-label">Cylinder ID</label>
                    <input value={scheduleForm.cylinderId} onChange={(e) => setScheduleForm({ ...scheduleForm, cylinderId: e.target.value })}
                      className="input-field" placeholder="CYL-001" required />
                  </div>
                  <div>
                    <label className="input-label">Title</label>
                    <input value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                      className="input-field" placeholder="Annual inspection" required />
                  </div>
                  <div>
                    <label className="input-label">Description</label>
                    <textarea value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                      className="input-field resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="input-label">Next Inspection Date</label>
                    <input type="date" value={scheduleForm.nextInspectionDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, nextInspectionDate: e.target.value })}
                      className="input-field" required />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddSchedule(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checklist Tab */}
      {tab === 'checklist' && (
        <div className="max-w-2xl">
          <div className="flex gap-2 mb-4">
            {['daily', 'weekly'].map((t) => (
              <button
                key={t}
                onClick={() => setChecklistType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  checklistType === t ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'bg-navy-800/50 text-gray-400'
                }`}
              >
                {t} Checklist
              </button>
            ))}
          </div>

          <div className="glass-card p-6 space-y-3">
            {checklistItems.map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleChecklistItem(i)}
                  className="w-5 h-5 rounded bg-navy-700 border-white/20 text-electric-500 focus:ring-electric-500/50"
                />
                <span className={`text-sm transition-colors ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                  {item.label}
                </span>
              </label>
            ))}

            <div className="pt-4 border-t border-white/5">
              <label className="input-label">Additional Notes</label>
              <textarea
                value={checklistNotes}
                onChange={(e) => setChecklistNotes(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Any observations or comments..."
              />
            </div>

            <button onClick={handleSubmitChecklist} className="btn-primary w-full flex items-center justify-center gap-2">
              <HiOutlineClipboardCheck size={18} /> Submit Checklist
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Submitted By</th>
                <th className="px-4 py-3 text-left">Items Checked</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {checklists.map((c) => (
                <tr key={c._id} className="table-row">
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(c.submittedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 capitalize">{c.type}</td>
                  <td className="px-4 py-3 text-sm text-white">{c.submittedBy}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-emerald-400 font-medium">
                      {c.items?.filter((i) => i.checked).length || 0}
                    </span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{c.items?.length || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {checklists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No checklist submissions yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

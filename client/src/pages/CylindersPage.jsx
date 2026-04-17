import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineDownload } from 'react-icons/hi';
import CylinderCard from '../components/cylinders/CylinderCard';
import CylinderForm from '../components/cylinders/CylinderForm';
import CylinderFilters from '../components/cylinders/CylinderFilters';
import RefillDialog from '../components/cylinders/RefillDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function CylindersPage() {
  const { isAdmin } = useAuth();
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', gasType: '', status: '', urgency: '' });
  const [showForm, setShowForm] = useState(false);
  const [editCylinder, setEditCylinder] = useState(null);
  const [refillCylinder, setRefillCylinder] = useState(null);
  const [deleteCylinder, setDeleteCylinder] = useState(null);

  const fetchCylinders = useCallback(async () => {
    try {
      const params = {};
      if (filters.gasType) params.gasType = filters.gasType;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.urgency) params.urgency = filters.urgency;

      const res = await axios.get('/cylinders', { params });
      setCylinders(res.data);
    } catch (err) {
      toast.error('Failed to load cylinders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCylinders();
  }, [fetchCylinders]);

  const handleCreate = async (data) => {
    try {
      await axios.post('/cylinders', data);
      toast.success('Cylinder added successfully!');
      setShowForm(false);
      fetchCylinders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add cylinder');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await axios.put(`/cylinders/${editCylinder._id}`, data);
      toast.success('Cylinder updated!');
      setEditCylinder(null);
      fetchCylinders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleRefill = async (data) => {
    try {
      await axios.put(`/cylinders/${refillCylinder._id}/refill`, data);
      toast.success('Cylinder refilled!');
      setRefillCylinder(null);
      fetchCylinders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refill');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/cylinders/${deleteCylinder._id}`);
      toast.success('Cylinder deleted');
      setDeleteCylinder(null);
      fetchCylinders();
    } catch (err) {
      toast.error('Failed to delete cylinder');
    }
  };

  const handleExportCSV = () => {
    import('papaparse').then(({ default: Papa }) => {
      const csv = Papa.unparse(cylinders.map(c => ({
        ID: c.cylinderId,
        Serial: c.serialNumber,
        'Gas Type': c.gasType,
        Capacity: `${c.capacity} ${c.capacityUnit}`,
        Location: c.location,
        Status: c.status,
        'Percentage Remaining': `${c.percentageRemaining?.toFixed(1)}%`,
        'Days Remaining': c.daysRemaining ? Math.ceil(c.daysRemaining) : 'N/A',
        'Estimated Empty': c.estimatedEmptyDate ? new Date(c.estimatedEmptyDate).toLocaleDateString() : 'N/A',
        'Install Date': new Date(c.installDate).toLocaleDateString(),
      })));
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cylinders_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    });
  };

  const handleExportPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Cylinder Management Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
          startY: 38,
          head: [['ID', 'Gas Type', 'Capacity', 'Location', 'Status', '% Left', 'Days Left']],
          body: cylinders.map(c => [
            c.cylinderId, c.gasType, `${c.capacity} ${c.capacityUnit}`,
            c.location, c.status, `${c.percentageRemaining?.toFixed(1)}%`,
            c.daysRemaining ? Math.ceil(c.daysRemaining) : 'N/A',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`cylinders_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success('PDF exported!');
      });
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Cylinder Management</h1>
          <p className="page-subtitle">{cylinders.length} cylinders tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-sm flex items-center gap-1" id="export-csv">
            <HiOutlineDownload size={16} /> CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary text-sm flex items-center gap-1" id="export-pdf">
            <HiOutlineDownload size={16} /> PDF
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1" id="add-cylinder">
              <HiOutlinePlus size={18} /> Add Cylinder
            </button>
          )}
        </div>
      </div>

      <CylinderFilters filters={filters} onChange={setFilters} />

      {/* Cylinder grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cylinders.map((c) => (
          <CylinderCard
            key={c._id}
            cylinder={c}
            onEdit={(cyl) => setEditCylinder(cyl)}
            onDelete={(cyl) => setDeleteCylinder(cyl)}
            onRefill={(cyl) => setRefillCylinder(cyl)}
          />
        ))}
      </div>

      {cylinders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No cylinders found</p>
          <p className="text-gray-600 text-sm mt-1">Add your first cylinder to start tracking</p>
        </div>
      )}

      {/* Modals */}
      {showForm && <CylinderForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      {editCylinder && <CylinderForm cylinder={editCylinder} onSubmit={handleUpdate} onClose={() => setEditCylinder(null)} />}
      {refillCylinder && <RefillDialog cylinder={refillCylinder} onSubmit={handleRefill} onClose={() => setRefillCylinder(null)} />}
      <ConfirmDialog
        open={!!deleteCylinder}
        title="Delete Cylinder"
        message={`Are you sure you want to delete ${deleteCylinder?.cylinderId}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCylinder(null)}
      />
    </div>
  );
}

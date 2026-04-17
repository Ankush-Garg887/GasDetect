import { QRCodeSVG } from 'qrcode.react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineRefresh, HiOutlineQrcode } from 'react-icons/hi';
import StatusBadge from '../common/StatusBadge';
import DepletionBar from './DepletionBar';
import { useState } from 'react';

export default function CylinderCard({ cylinder, onEdit, onDelete, onRefill }) {
  const [showQR, setShowQR] = useState(false);

  const {
    cylinderId, gasType, capacity, capacityUnit = 'kg', location, status,
    percentageRemaining = 0, daysRemaining, estimatedEmptyDate, urgency,
  } = cylinder;

  const emptyDateStr = estimatedEmptyDate
    ? new Date(estimatedEmptyDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A';

  const urgencyBadge = urgency?.badge || 'Good';

  return (
    <div className="glass-card-hover p-5 flex flex-col gap-4 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{cylinderId}</h3>
          <p className="text-sm text-gray-400">{gasType} • {capacity} {capacityUnit}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Location */}
      <div className="text-xs text-gray-500">
        📍 {location || 'No location set'}
      </div>

      {/* Depletion bar */}
      <DepletionBar percentage={percentageRemaining} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-navy-800/40 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase">Days Left</p>
          <p className={`text-lg font-bold ${daysRemaining <= 7 ? 'text-red-400' : daysRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {daysRemaining ? Math.max(0, Math.ceil(daysRemaining)) : 'N/A'}
          </p>
        </div>
        <div className="bg-navy-800/40 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase">Empty By</p>
          <p className="text-xs font-medium text-gray-300 mt-1">{emptyDateStr}</p>
        </div>
      </div>

      {/* Urgency badge */}
      <div className="flex items-center gap-2">
        <StatusBadge status={urgencyBadge} />
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="absolute inset-0 bg-navy-900/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 animate-in">
          <QRCodeSVG
            value={`${window.location.origin}/cylinders?id=${cylinder._id}`}
            size={160}
            bgColor="transparent"
            fgColor="#3b82f6"
            level="M"
          />
          <p className="text-xs text-gray-400 mt-3">{cylinderId}</p>
          <button onClick={() => setShowQR(false)} className="btn-secondary text-xs mt-3 px-4 py-1.5">
            Close
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
        <button onClick={() => onEdit?.(cylinder)} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1" id={`edit-${cylinderId}`}>
          <HiOutlinePencil size={14} /> Edit
        </button>
        <button onClick={() => onRefill?.(cylinder)} className="flex-1 btn-success text-xs py-2 flex items-center justify-center gap-1" id={`refill-${cylinderId}`}>
          <HiOutlineRefresh size={14} /> Refill
        </button>
        <button onClick={() => setShowQR(!showQR)} className="p-2 btn-secondary text-xs" title="QR Code">
          <HiOutlineQrcode size={16} />
        </button>
        <button onClick={() => onDelete?.(cylinder)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete" id={`delete-${cylinderId}`}>
          <HiOutlineTrash size={16} />
        </button>
      </div>
    </div>
  );
}

import { HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, variant = 'danger' }) {
  if (!open) return null;

  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card p-6 max-w-md w-full animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <HiOutlineX size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-500/20' : 'bg-electric-500/20'}`}>
            <HiOutlineExclamation className={variant === 'danger' ? 'text-red-400 text-2xl' : 'text-electric-400 text-2xl'} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button onClick={onConfirm} className={`${btnClass} text-sm`}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

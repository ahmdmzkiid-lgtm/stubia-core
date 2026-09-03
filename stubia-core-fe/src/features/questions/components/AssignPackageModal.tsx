import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/shared/Modal';
import { Button } from '../../../components/shared/Button';
import { Package, FolderX } from 'lucide-react';

interface AssignPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  packages: Array<{ name: string; count: number }>;
  onAssign: (packageName: string | null) => Promise<void>;
}

export const AssignPackageModal: React.FC<AssignPackageModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  packages,
  onAssign,
}) => {
  const [packageName, setPackageName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPackageName('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAssign(packageName.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromPackage = async () => {
    if (!window.confirm(`Keluarkan ${selectedCount} soal terpilih dari paket?`)) return;
    setIsSubmitting(true);
    try {
      await onAssign(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelompokkan ke Paket Soal">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="bg-purple-50 border border-purple-200/70 rounded-xl p-3 text-xs text-purple-900 flex items-start gap-2.5">
          <Package className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            Anda memilih <strong className="font-extrabold">{selectedCount} soal</strong>. Masukkan nama paket baru atau pilih dari paket yang sudah ada agar soal terorganisir rapi.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Nama Paket / Batch Soal
          </label>
          <input
            type="text"
            list="existing-packages-list"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="e.g. Tryout Akbar UTBK Batch 1, Latihan TKA Bab 1..."
            className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold transition-all"
            autoFocus
          />
          <datalist id="existing-packages-list">
            {packages.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name} ({pkg.count} soal)
              </option>
            ))}
          </datalist>
          <p className="text-[11px] text-[#64748B] mt-1 font-medium">
            Ketik nama paket baru atau pilih dari rekomendasi paket yang tersedia.
          </p>
        </div>

        {/* Existing packages quick picker */}
        {packages.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Pilih Cepat Paket yang Ada:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <button
                  key={pkg.name}
                  type="button"
                  onClick={() => setPackageName(pkg.name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                    packageName === pkg.name
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                  }`}
                >
                  <Package className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[180px]">{pkg.name}</span>
                  <span className="text-[10px] opacity-75">({pkg.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#CBD5E1]/40 mt-5">
          <button
            type="button"
            onClick={handleRemoveFromPackage}
            disabled={isSubmitting}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <FolderX className="h-3.5 w-3.5" />
            <span>Lepaskan dari Paket</span>
          </button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-bold border-[#CBD5E1]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!packageName.trim() || isSubmitting}
              className="text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm"
            >
              <Package className="h-3.5 w-3.5 mr-1" />
              Simpan ke Paket
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

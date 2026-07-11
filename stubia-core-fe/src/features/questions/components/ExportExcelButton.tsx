import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { Button } from '../../../components/shared/Button';
import { QuestionFilters } from '../types/questions.types';
import { useAuthStore } from '../../../store/authStore';

interface ExportExcelButtonProps {
  filters: QuestionFilters;
  totalFound: number;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({ filters, totalFound }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (totalFound === 0) {
      toast.error('Tidak ada soal yang ditemukan untuk diexport!');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Sedang mengkompilasi file Excel...');

    try {
      // Build query params from current filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.append(key, String(val));
      });

      // Use auth token from the store directly (correct pattern)
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/questions/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // Try to parse error JSON from backend
        let errMsg = 'Gagal mendownload data dari server';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          // ignore parse error
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('File Excel kosong diterima dari server');

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `stubia-soal-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Excel berhasil didownload! (${totalFound} soal)`, { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Ekspor soal gagal.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleExport}
      isLoading={isExporting}
      disabled={totalFound === 0 || isExporting}
      className="text-xs font-bold shrink-0 border-[#CBD5E1] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1]"
      title="Download excel file"
    >
      <Download className="h-4 w-4 mr-1.5 shrink-0 text-[#1B3FAB]" />
      <span>Export Excel ({totalFound})</span>
    </Button>
  );
};
export default ExportExcelButton;

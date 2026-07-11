import React, { useState } from 'react';
import { Question } from '../../questions/types/questions.types';
import { DataTable } from '../../../components/shared/DataTable';
import { Badge } from '../../../components/shared/Badge';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { RefreshCw, Download, Globe, Save, HelpCircle } from 'lucide-react';

interface PackagePreviewProps {
  questions: Question[];
  onSwapQuestion: (index: number) => void;
  onSave: (name: string, publish: boolean) => void;
  onExport: () => void;
  isSaving: boolean;
}

export const PackagePreview: React.FC<PackagePreviewProps> = ({
  questions,
  onSwapQuestion,
  onSave,
  onExport,
  isSaving,
}) => {
  const [packageName, setPackageName] = useState('');

  const columns = [
    {
      header: 'No',
      className: 'w-[5%] text-center',
      render: (_: any, __: any, index: number) => (
        <span className="text-xs font-bold text-[#64748B]">{index + 1}</span>
      ),
    },
    {
      header: 'Soal',
      accessor: 'soalText',
      className: 'w-[55%]',
      render: (val: string, row: Question) => (
        <div className="space-y-1 pr-3">
          {row.stimulus && (
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider line-clamp-1">
              Wacana: {row.stimulus}
            </p>
          )}
          <p className="text-xs font-semibold text-[#0F172A] line-clamp-2 leading-relaxed">
            {val}
          </p>
        </div>
      ),
    },
    {
      header: 'Topik',
      accessor: 'topic',
      className: 'w-[15%]',
      render: (val: string) => (
        <span className="text-xs font-semibold text-[#64748B]">{val}</span>
      ),
    },
    {
      header: 'Kesulitan',
      accessor: 'difficulty',
      className: 'w-[10%]',
      render: (val: string) => (
        <Badge variant={val === 'HOTS' ? 'Rejected' : val === 'MEDIUM' ? 'Warning' : 'Done'}>
          {val}
        </Badge>
      ),
    },
    {
      header: 'Aksi',
      className: 'w-[15%] text-center',
      render: (_: any, __: Question, index: number) => (
        <button
          type="button"
          onClick={() => onSwapQuestion(index)}
          className="p-1.5 text-[#64748B] hover:text-[#1B3FAB] hover:bg-[#F1F5F9] rounded-md transition-colors inline-flex items-center gap-1 focus:outline-none text-xs font-bold"
          title="Regenerate / Ganti Soal"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Ganti</span>
        </button>
      ),
    },
  ];

  const handleConfirmAction = (publish: boolean) => {
    if (!packageName.trim()) {
      alert('Tolong masukkan nama paket tryout terlebih dahulu!');
      return;
    }
    onSave(packageName, publish);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <HelpCircle className="h-10 w-10 text-[#64748B] mb-3" />
        <h4 className="text-sm font-bold text-[#0F172A]">Pratinjau Soal Kosong</h4>
        <p className="text-xs font-semibold text-[#64748B] max-w-sm mt-1">
          Masukkan konfigurasi parameter di panel kiri dan klik **Generate Paket** untuk merangkum daftar wacana tryout.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#CBD5E1] border-l-4 border-l-purple-500 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-sm font-bold text-purple-600 flex items-center gap-1.5 uppercase tracking-wider">
          <Globe className="h-4.5 w-4.5" /> 2. Pratinjau Soal Paket
        </h3>

        <div className="flex gap-2">
          {/* Export button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onExport}
            className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1] h-9"
          >
            <Download className="h-4 w-4 mr-1.5 text-[#1B3FAB]" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Package name input */}
      <div className="max-w-md">
        <Input
          label="Nama Paket Tryout"
          placeholder="e.g. Tryout Akbar UTBK SNBT - PM 01"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          className="focus:ring-purple-500"
        />
      </div>

      {/* Datatable list */}
      <DataTable
        columns={columns}
        data={questions}
        emptyMessage="Tidak ada soal dihasilkan."
      />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#CBD5E1]/50">
        <Button
          type="button"
          variant="ghost"
          onClick={() => handleConfirmAction(false)}
          isLoading={isSaving}
          disabled={isSaving}
          className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9]"
        >
          <Save className="h-4 w-4 mr-1.5 text-slate-700" /> Simpan Draft Paket
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={() => handleConfirmAction(true)}
          isLoading={isSaving}
          disabled={isSaving}
          className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white shadow-md"
        >
          <Globe className="h-4 w-4 mr-1.5" /> Publish ke stubia.id
        </Button>
      </div>
    </div>
  );
};
export default PackagePreview;

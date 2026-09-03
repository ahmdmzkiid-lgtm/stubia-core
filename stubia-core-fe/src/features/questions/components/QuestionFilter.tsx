import React from 'react';
import { QuestionFilters } from '../types/questions.types';
import { Input } from '../../../components/shared/Input';
import { Search, FilterX } from 'lucide-react';

interface QuestionFilterProps {
  filters: QuestionFilters;
  packages?: Array<{ name: string; count: number }>;
  onChange: (filters: QuestionFilters) => void;
  onClear: () => void;
}

export const QuestionFilter: React.FC<QuestionFilterProps> = ({ filters, packages = [], onChange, onClear }) => {
  const handleSelectChange = (field: keyof QuestionFilters, val: string) => {
    onChange({ ...filters, [field]: val || undefined, page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value || undefined, page: 1 });
  };

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Search */}
        <div className="relative">
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">Cari Soal</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
            <Input
              value={filters.search || ''}
              onChange={handleSearchChange}
              placeholder="Ketik kata kunci..."
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Subtest */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">Subtes UTBK</label>
          <select
            value={filters.subtes || ''}
            onChange={(e) => handleSelectChange('subtes', e.target.value)}
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold truncate"
          >
            <option value="">Semua Subtes</option>
            <option value="Penalaran Matematika">Penalaran Matematika</option>
            <option value="Literasi dalam Bahasa Indonesia">Literasi dalam Bahasa Indonesia</option>
            <option value="Literasi dalam Bahasa Inggris">Literasi dalam Bahasa Inggris</option>
            <option value="Pemahaman Bacaan dan Menulis">Pemahaman Bacaan dan Menulis</option>
            <option value="Pengetahuan dan Pemahaman Umum">Pengetahuan dan Pemahaman Umum</option>
            <option value="Kemampuan Penalaran Umum">Kemampuan Penalaran Umum</option>
            <option value="Kemampuan Kuantitatif">Kemampuan Kuantitatif</option>
            <option value="TKA Bahasa Indonesia Wajib">TKA Bahasa Indonesia Wajib</option>
            <option value="TKA Kimia Pilihan">TKA Kimia Pilihan</option>
            <option value="TKA Matematika Wajib">TKA Matematika Wajib</option>
            <option value="TKA Bahasa Inggris Wajib">TKA Bahasa Inggris Wajib</option>
            <option value="TKA Matematika Tingkat Lanjut">TKA Matematika Tingkat Lanjut</option>
            <option value="TKA Bahasa Indonesia Tingkat Lanjut">TKA Bahasa Indonesia Tingkat Lanjut</option>
            <option value="TKA Bahasa Inggris Tingkat Lanjut">TKA Bahasa Inggris Tingkat Lanjut</option>
            <option value="TKA Fisika Pilihan">TKA Fisika Pilihan</option>
            <option value="TKA Biologi Pilihan">TKA Biologi Pilihan</option>
            <option value="TKA PPKn">TKA PPKn</option>
            <option value="TKA Ekonomi Pilihan">TKA Ekonomi Pilihan</option>
            <option value="TKA Geografi Pilihan">TKA Geografi Pilihan</option>
            <option value="TKA Sosiologi Pilihan">TKA Sosiologi Pilihan</option>
            <option value="TKA Sejarah Pilihan">TKA Sejarah Pilihan</option>
            <option value="TKA Antropologi Pilihan">TKA Antropologi Pilihan</option>
            <option value="TKA PKWU Pilihan">TKA PKWU Pilihan</option>
            <option value="TKA Bahasa Prancis Pilihan">TKA Bahasa Prancis Pilihan</option>
          </select>
        </div>

        {/* Paket Soal Filter */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">📦 Paket / Batch</label>
          <select
            value={filters.packageName || ''}
            onChange={(e) => handleSelectChange('packageName', e.target.value)}
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold truncate"
          >
            <option value="">Semua Paket</option>
            <option value="none">Tanpa Paket (Umum)</option>
            {packages.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                📦 {pkg.name} ({pkg.count} soal)
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">Tingkat Kesulitan</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => handleSelectChange('difficulty', e.target.value)}
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
          >
            <option value="">Semua Kesulitan</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HOTS">HOTS</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">Status Soal</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#CBD5E1]/50 gap-4">
        {/* Source filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#64748B]">Sumber:</span>
          {['', 'MANUAL', 'AI_GENERATED'].map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                const nextFilters = { ...filters, source: (src || undefined) as any, page: 1 };
                if (src !== 'AI_GENERATED') {
                  delete nextFilters.modelUsed;
                }
                onChange(nextFilters);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                (filters.source || '') === src
                  ? src === 'AI_GENERATED'
                    ? 'bg-purple-100 border-[#7C3AED] text-[#5B21B6]'
                    : 'bg-blue-100 border-[#1B3FAB] text-[#1B3FAB]'
                  : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {src === '' ? 'Semua' : src === 'AI_GENERATED' ? '✨ AI-Generated' : '✏️ Manual'}
            </button>
          ))}

          {filters.source === 'AI_GENERATED' && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#CBD5E1]">
              <span className="text-xs font-bold text-[#64748B]">Model:</span>
              <select
                value={filters.modelUsed || ''}
                onChange={(e) => handleSelectChange('modelUsed', e.target.value)}
                className="h-8 px-2 border border-[#CBD5E1] rounded-lg text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] font-semibold"
              >
                <option value="">Semua Model</option>
                <option value="opus-4.6">Claude Opus 4.6</option>
                <option value="sonnet-4.6">Claude Sonnet-4.6</option>
              </select>
            </div>
          )}
        </div>

        {/* Clear Trigger */}
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold text-[#EF4444] hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5 transition-colors focus:outline-none active:scale-[0.97]"
        >
          <FilterX className="h-4 w-4 shrink-0" />
          <span>Reset Filter</span>
        </button>
      </div>
    </div>
  );
};
export default QuestionFilter;

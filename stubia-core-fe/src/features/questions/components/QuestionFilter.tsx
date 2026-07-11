import React from 'react';
import { QuestionFilters } from '../types/questions.types';
import { Input } from '../../../components/shared/Input';
import { Search, FilterX } from 'lucide-react';

interface QuestionFilterProps {
  filters: QuestionFilters;
  onChange: (filters: QuestionFilters) => void;
  onClear: () => void;
}

export const QuestionFilter: React.FC<QuestionFilterProps> = ({ filters, onChange, onClear }) => {
  const handleSelectChange = (field: keyof QuestionFilters, val: string) => {
    onChange({ ...filters, [field]: val || undefined, page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value || undefined, page: 1 });
  };

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
          >
            <option value="">Semua Subtes</option>
            <option value="Penalaran Matematika">Penalaran Matematika</option>
            <option value="Literasi dalam Bahasa Indonesia">Literasi dalam Bahasa Indonesia</option>
            <option value="Literasi dalam Bahasa Inggris">Literasi dalam Bahasa Inggris</option>
            <option value="Pemahaman Bacaan dan Menulis">Pemahaman Bacaan dan Menulis</option>
            <option value="Pengetahuan dan Pemahaman Umum">Pengetahuan dan Pemahaman Umum</option>
            <option value="Kemampuan Penalaran Umum">Kemampuan Penalaran Umum</option>
            <option value="Kemampuan Kuantitatif">Kemampuan Kuantitatif</option>
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1.5">Tingkat Kesulitan</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => handleSelectChange('difficulty', e.target.value)}
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
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
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
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

      <div className="flex items-center justify-between pt-2 border-t border-[#CBD5E1]/50 gap-4">
        {/* Source filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#64748B]">Sumber:</span>
          {['', 'MANUAL', 'AI_GENERATED'].map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => handleSelectChange('source', src)}
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

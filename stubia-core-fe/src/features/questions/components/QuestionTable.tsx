import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question, QuestionFilters } from '../types/questions.types';
import { questionsApi } from '../api/questionsApi';
// Badge import removed — card layout uses inline Tailwind classes instead
import { Button } from '../../../components/shared/Button';
import { QuestionFilter } from './QuestionFilter';
import { ExportExcelButton } from './ExportExcelButton';
import { useAuthStore } from '../../../store/authStore';
import {
  Plus,
  Edit2,
  CheckCircle2,
  Archive,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckSquare,
  FileText,
  Key,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

const difficultyColor: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HOTS: 'bg-red-100 text-red-700',
};

const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PUBLISHED: 'bg-purple-100 text-purple-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

interface QuestionRowProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onApprove: (id: string, e: React.MouseEvent) => void;
  onArchive: (id: string, e: React.MouseEvent) => void;
  isAcademicOrAdmin: boolean;
}

const QuestionRow: React.FC<QuestionRowProps> = ({
  question: q,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onApprove,
  onArchive,
  isAcademicOrAdmin,
}) => {
  const opts = (q.optionsJson as any) || {};

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 w-full min-w-0 ${
        isExpanded ? 'border-[#1B3FAB]/40 shadow-md' : 'border-[#CBD5E1] hover:border-[#1B3FAB]/30'
      }`}
    >
      {/* ── Summary Row (always visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-4 flex items-start gap-3 focus:outline-none group min-w-0"
      >
        {/* Number badge */}
        <span className="mt-0.5 h-6 w-6 rounded-full bg-[#1B3FAB]/10 text-[#1B3FAB] flex items-center justify-center text-[10px] font-extrabold shrink-0">
          {index + 1}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0 w-full">
          {/* Stimulus */}
          {q.stimulus && (
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1 truncate w-full">
              📄 Stimulus: {q.stimulus}
            </p>
          )}

          {/* Question text */}
          <p className={`text-sm font-semibold text-[#0F172A] leading-relaxed break-words w-full ${isExpanded ? '' : 'line-clamp-2'}`}>
            {q.soalText}
          </p>

          {/* Tag pills row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 w-full">
            <span className="text-[10px] font-bold text-[#64748B] bg-slate-50 border border-[#CBD5E1]/50 rounded-full px-2 py-0.5 max-w-full truncate">
              {q.subtes}
            </span>
            <span className="text-[10px] font-bold text-[#64748B] bg-slate-50 border border-[#CBD5E1]/50 rounded-full px-2 py-0.5 max-w-full truncate">
              {q.topic}
            </span>
            <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${difficultyColor[q.difficulty] || 'bg-slate-100 text-slate-600'}`}>
              {q.difficulty}
            </span>
            <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${statusColor[q.status] || 'bg-slate-100 text-slate-600'}`}>
              {q.status}
            </span>
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${q.source === 'AI_GENERATED' ? 'bg-violet-100 text-violet-700' : 'bg-blue-50 text-blue-600'}`}>
              {q.source === 'AI_GENERATED' ? '✨ AI' : '✏️ Manual'}
            </span>
          </div>
        </div>

        {/* Right side: actions + expand */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-[#64748B] hover:text-[#1B3FAB] hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Soal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {isAcademicOrAdmin && q.status === 'DRAFT' && (
            <button
              type="button"
              onClick={(e) => onApprove(q.id, e)}
              className="p-1.5 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Approve Soal"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}

          {isAcademicOrAdmin && q.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={(e) => onArchive(q.id, e)}
              className="p-1.5 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Arsip Soal"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}

          <div className={`ml-1 p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-[#1B3FAB]/10 text-[#1B3FAB]' : 'text-[#94A3B8] hover:bg-slate-100'}`}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* ── Expanded Detail Panel ── */}
      {isExpanded && (
        <div className="border-t border-[#CBD5E1]/50 bg-[#F8FAFC] px-4 py-4 space-y-4 w-full min-w-0">

          {/* Stimulus full text */}
          {q.stimulus && (
            <div className="space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#1B3FAB] uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" /> Stimulus / Wacana
              </div>
              <div className="bg-blue-50/50 border border-[#1B3FAB]/15 rounded-xl px-4 py-3 text-xs font-semibold text-[#0F172A] leading-relaxed whitespace-pre-wrap break-words w-full min-w-0">
                {q.stimulus}
              </div>
            </div>
          )}

          {/* Question full text */}
          <div className="space-y-1.5 w-full min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
              <BookOpen className="h-3.5 w-3.5" /> Pertanyaan
            </div>
            <div className="bg-white border border-[#CBD5E1]/60 rounded-xl px-4 py-3 text-sm font-semibold text-[#0F172A] leading-relaxed whitespace-pre-wrap break-words w-full min-w-0">
              {q.soalText}
            </div>
          </div>

          {/* Options list (Always single column on mobile, stack beautifully to utilize full width on desktop) */}
          {Object.keys(opts).length > 0 && (
            <div className="space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                <CheckSquare className="h-3.5 w-3.5" /> Opsi Jawaban
              </div>
              <div className="grid grid-cols-1 gap-2 w-full min-w-0">
                {OPTION_KEYS.map((key) => {
                  if (!opts[key]) return null;
                  const isAnswer = q.answerKey === key;
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors w-full min-w-0 ${
                        isAnswer
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-[#CBD5E1]/60 text-[#0F172A]'
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${
                          isAnswer
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        {key}
                      </span>
                      <span className="leading-relaxed whitespace-pre-wrap break-words flex-1 min-w-0">{opts[key]}</span>
                      {isAnswer && (
                        <span className="ml-auto shrink-0 text-emerald-600 text-[9px] font-extrabold uppercase tracking-wider">
                          ✓ Kunci
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answer Key */}
          <div className="flex items-center gap-3 w-full min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider shrink-0">
              <Key className="h-3.5 w-3.5" /> Kunci Jawaban:
            </div>
            <span className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-extrabold shadow-sm shrink-0">
              {q.answerKey}
            </span>
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                💡 Pembahasan
              </div>
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 text-xs font-semibold text-[#0F172A] leading-relaxed whitespace-pre-wrap break-words w-full min-w-0">
                {q.explanation}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pt-2.5 border-t border-[#CBD5E1]/40 text-[10px] text-[#94A3B8] font-semibold w-full min-w-0">
            <span>Tipe: <b className="text-[#64748B]">{q.type}</b></span>
            {q.createdBy && <span>Dibuat oleh: <b className="text-[#64748B]">{q.createdBy.name}</b></span>}
            {q.approvedBy && <span>Disetujui oleh: <b className="text-[#64748B]">{q.approvedBy.name}</b></span>}
            <span>Dibuat: <b className="text-[#64748B]">{new Date(q.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const QuestionTable: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<QuestionFilters>({ page: 1, limit: 10 });

  const isAcademicOrAdmin = user?.role === 'super_admin' || user?.role === 'academic_manager';

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await questionsApi.getQuestions(filters);
      setQuestions(data.questions);
      setTotalQuestions(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat bank soal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [filters]);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await questionsApi.approveQuestion(id);
      toast.success('Soal berhasil disetujui!');
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui soal.');
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin mengarsipkan soal ini?')) return;
    try {
      await questionsApi.deleteQuestion(id);
      toast.success('Soal berhasil diarsipkan.');
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengarsipkan soal.');
    }
  };

  const handleClearFilters = () => setFilters({ page: 1, limit: 10 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#1B3FAB]" />
            <h2 className="text-xl font-bold text-[#0F172A]">Smart Question Bank</h2>
          </div>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Klik pada baris soal untuk melihat detail lengkap: stimulus, opsi jawaban, kunci, dan pembahasan.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportExcelButton filters={filters} totalFound={totalQuestions} />
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/questions/create')}
            className="text-xs font-bold"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Tambah Soal Manual
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <QuestionFilter
        filters={filters}
        onChange={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
        onClear={handleClearFilters}
      />

      {/* Question cards */}
      {isLoading ? (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-12 flex flex-col items-center justify-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]" />
          <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Memuat bank soal...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-12 flex flex-col items-center justify-center shadow-sm text-[#94A3B8]">
          <HelpCircle className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-bold text-[#0F172A]">Tidak ada soal ditemukan</p>
          <p className="text-xs mt-1">Coba ubah filter pencarian atau tambahkan soal baru.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={i + ((filters.page || 1) - 1) * (filters.limit || 10)}
              isExpanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              onEdit={() => navigate(`/questions/edit/${q.id}`)}
              onApprove={handleApprove}
              onArchive={handleArchive}
              isAcademicOrAdmin={isAcademicOrAdmin}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#64748B]">
            Halaman {filters.page} dari {totalPages} — {totalQuestions} soal total
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="text-xs font-bold"
            >
              ← Sebelumnya
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={filters.page === totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="text-xs font-bold"
            >
              Selanjutnya →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionTable;

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { GeneratedQuestion } from '../types/aiGenerator.types';
import { Badge } from '../../../components/shared/Badge';
import { ChevronDown, ChevronUp, RefreshCw, AlertCircle, Image as ImageIcon, Copy } from 'lucide-react';

interface AIResultCardProps {
  question: GeneratedQuestion;
  index: number;
  isSelected: boolean;
  onSelectToggle: (index: number) => void;
  onFieldChange: (index: number, field: string, value: any) => void;
  onRegenerateSingle?: (index: number) => void;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({
  question,
  index,
  isSelected,
  onSelectToggle,
  onFieldChange,
  onRegenerateSingle,
}) => {
  const [showSimilarityCandidates, setShowSimilarityCandidates] = useState(false);

  const getStatusBadge = () => {
    switch (question.similarityStatus) {
      case 'SAFE':
        return <Badge variant="Safe">Aman (100% Unik)</Badge>;
      case 'WARNING':
        return <Badge variant="Warning">Peringatan Mirip</Badge>;
      case 'BLOCKED':
        return <Badge variant="Blocked">Duplikat Terblokir</Badge>;
      default:
        return <Badge variant="Default">Belum Diuji</Badge>;
    }
  };

  const handleOptionChange = (optionKey: string, val: string) => {
    const updatedOptions = { ...question.opsi, [optionKey]: val };
    onFieldChange(index, 'opsi', updatedOptions);
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
      isSelected ? 'border-[#7C3AED] ring-2 ring-purple-100' : 'border-[#CBD5E1]'
    }`}>
      {/* Top row controls */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#CBD5E1]/50">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={question.similarityStatus === 'BLOCKED'}
            onChange={() => onSelectToggle(index)}
            className="h-4.5 w-4.5 text-[#7C3AED] focus:ring-[#7C3AED] border-[#CBD5E1] rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-bold text-[#0F172A]">Soal #{index + 1}</span>
          <span className="text-xs bg-purple-100 text-[#7C3AED] px-2 py-0.5 rounded font-semibold uppercase">
            {question.tipe}
          </span>
          {question.prompt_gambar && question.prompt_gambar.trim() && (
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Infografis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {onRegenerateSingle && (
            <button
              type="button"
              onClick={() => onRegenerateSingle(index)}
              className="p-1 text-[#64748B] hover:text-[#7C3AED] hover:bg-[#F1F5F9] rounded-md transition-colors"
              title="Regenerate Soal Ini"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Similarity Alert Accordion */}
      {question.similarityStatus !== 'SAFE' && question.candidates && question.candidates.length > 0 && (
        <div className="mb-4 bg-amber-50/70 border border-amber-200 rounded-xl p-3">
          <button
            type="button"
            onClick={() => setShowSimilarityCandidates(!showSimilarityCandidates)}
            className="w-full flex items-center justify-between text-xs font-semibold text-amber-800 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              {question.similarityStatus === 'BLOCKED'
                ? '🔴 Dilarang Simpan: Soal Sangat Mirip dengan Database'
                : '⚠️ Perhatian: Kemiripan Sedang Terdeteksi'}
            </span>
            <span className="text-[10px] text-amber-700 underline flex items-center gap-1">
              {showSimilarityCandidates ? 'Sembunyikan' : 'Lihat Soal Mirip'}
              {showSimilarityCandidates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </span>
          </button>

          {showSimilarityCandidates && (
            <div className="mt-3 space-y-2.5 border-t border-amber-200/50 pt-2.5 max-h-40 overflow-y-auto">
              {question.candidates.map((cand, idx) => (
                <div key={cand.id} className="text-xs bg-white border border-amber-200 p-2.5 rounded-lg space-y-1 shadow-sm">
                  <div className="flex justify-between font-bold text-[#0F172A]">
                    <span>Kandidat #{idx + 1} (ID: {cand.id.substring(0, 8)})</span>
                    <span className="text-[#EF4444]">{Math.round(cand.similarity * 100)}% mirip</span>
                  </div>
                  <p className="text-[#64748B] italic line-clamp-2 leading-relaxed">
                    "{cand.soalText}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline Fields */}
      <div className="space-y-4">
        {/* Materi & Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Materi (Format: Topik – Materi)
            </label>
            <input
              type="text"
              value={question.materi || ''}
              onChange={(e) => onFieldChange(index, 'materi', e.target.value)}
              placeholder="Contoh: Pemahaman Tekstual - Teks Puisi"
              className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Tingkat Kesulitan & Label
            </label>
            <div className="flex gap-2">
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] font-bold flex-1 text-center">
                {question.tingkat_kesulitan || question.difficulty}
              </span>
              {question.label_kolom && (
                <span className="text-xs bg-purple-50 text-[#7C3AED] px-2.5 py-1.5 rounded-lg border border-purple-200 font-bold flex-1 text-center truncate" title={question.label_kolom}>
                  {question.label_kolom}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stimulus */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Stimulus (Wacana / Cerita kasus)
          </label>
          <textarea
            value={question.stimulus || ''}
            onChange={(e) => onFieldChange(index, 'stimulus', e.target.value)}
            placeholder="Masukkan wacana cerita jika ada, atau biarkan kosong..."
            className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-lg bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent min-h-[60px]"
          />
        </div>

        {/* Prompt Gambar (Opsional / Infografis) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-[#7C3AED]" /> Prompt Gambar / Infografis (Opsional)
            </label>
            {question.prompt_gambar && question.prompt_gambar.trim() && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(question.prompt_gambar || '');
                  toast.success('Prompt gambar berhasil disalin!');
                }}
                className="text-[10px] text-[#7C3AED] hover:underline font-bold flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Salin Prompt
              </button>
            )}
          </div>
          <textarea
            value={question.prompt_gambar || ''}
            onChange={(e) => onFieldChange(index, 'prompt_gambar', e.target.value)}
            placeholder="Deskripsi visual untuk infografis, diagram alur, grafik data, atau ilustrasi wacana (opsional)..."
            className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent min-h-[50px] font-mono text-[11px]"
          />
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Teks Pertanyaan Soal
          </label>
          <textarea
            value={question.soal}
            onChange={(e) => onFieldChange(index, 'soal', e.target.value)}
            className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-lg bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent min-h-[80px]"
          />
        </div>

        {/* Options (If PG/PGK) */}
        {question.tipe === 'PG' && question.opsi && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(question.opsi).map((key) => {
              const val = (question.opsi as any)[key];
              if (val === undefined || val === null && key === 'E') return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 text-[#64748B] h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-[#CBD5E1]">
                    {key}
                  </span>
                  <input
                    type="text"
                    value={val || ''}
                    onChange={(e) => handleOptionChange(key, e.target.value)}
                    className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Answer Key & Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Kunci
            </label>
            <input
              type="text"
              value={question.kunci_jawaban}
              onChange={(e) => onFieldChange(index, 'kunci_jawaban', e.target.value)}
              className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-center font-bold"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Pembahasan Lengkap Soal
            </label>
            <textarea
              value={question.pembahasan}
              onChange={(e) => onFieldChange(index, 'pembahasan', e.target.value)}
              className="w-full text-xs p-2 border border-[#CBD5E1] rounded-lg bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent min-h-[60px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default AIResultCard;

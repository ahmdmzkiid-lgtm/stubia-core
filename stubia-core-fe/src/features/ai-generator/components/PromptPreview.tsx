import React, { useState } from 'react';
import { AISkill, GenerateConfig } from '../types/aiGenerator.types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PromptPreviewProps {
  skill: AISkill | null;
  config: Partial<GenerateConfig>;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({ skill, config }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!skill) return null;

  const composePromptPreview = () => {
    const topicsStr = config.topik && config.topik.length > 0 ? config.topik.join(', ') : '(Belum dipilih)';
    const difficultyStr = config.difficulty || 'MEDIUM';
    const typeStr = config.tipe || 'PG';
    const countStr = config.jumlah || 5;

    return `[SYSTEM ROLE]
Kamu adalah pembuat soal UTBK-SNBT profesional untuk platform Stubia.id...

[INSTRUKSI AKADEMIK SKILL]
${skill.instruksiSoal}

[CONTOH REFERENSI SOAL (FEW-SHOT EXAMPLES)]
${skill.contohSoalJson ? JSON.stringify(skill.contohSoalJson, null, 2) : '[]'}

[LARANGAN KERAS]
${skill.larangan || 'Tidak ada larangan khusus.'}

[KONFIGURASI USER]
- Subtes: ${config.subtes || skill.subtes}
- Topik: ${topicsStr}
- Tingkat Kesulitan: ${difficultyStr}
- Tipe Soal: ${typeStr}
- Jumlah Soal: ${countStr}

[FORMAT OUTPUT — WAJIB HANYA JSON]
Kembalikan HANYA array JSON berisi ${countStr} objek soal dengan format terstruktur.`;
  };

  return (
    <div className="border border-[#CBD5E1] rounded-xl overflow-hidden shadow-sm bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] text-left hover:bg-[#F1F5F9] transition-colors focus:outline-none"
      >
        <span className="text-xs font-bold text-[#64748B] flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Lihat Review Prompt Akhir (Read-only)
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-[#64748B]" /> : <ChevronDown className="h-4 w-4 text-[#64748B]" />}
      </button>
      
      {isOpen && (
        <div className="p-3 border-t border-[#CBD5E1] bg-[#F5F3FF]">
          <pre className="text-[11px] font-mono text-[#5B21B6] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono">
            {composePromptPreview()}
          </pre>
        </div>
      )}
    </div>
  );
};

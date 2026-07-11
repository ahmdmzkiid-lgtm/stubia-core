import React, { useState } from 'react';
import { SimilarityResult } from '../types/questions.types';
import { AlertTriangle, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';

interface DuplicateAlertProps {
  result: SimilarityResult | null;
}

export const DuplicateAlert: React.FC<DuplicateAlertProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!result || result.similarityStatus === 'SAFE') return null;

  const isBlocked = result.similarityStatus === 'BLOCKED';

  return (
    <div className={`border rounded-2xl p-4 shadow-sm transition-all duration-300 ${
      isBlocked 
        ? 'border-red-300 bg-red-50/50 text-red-900' 
        : 'border-amber-300 bg-amber-50/50 text-amber-900'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {isBlocked ? (
            <AlertOctagon className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {isBlocked 
                ? 'Penyimpanan Diblokir (Duplikasi Tinggi &gt; 70%)' 
                : 'Peringatan Kemiripan Soal Terdeteksi (40% - 70%)'}
            </h4>
            <p className="text-xs mt-1 leading-normal font-medium text-slate-700">
              {isBlocked
                ? 'Teks pertanyaan sangat mirip dengan soal yang sudah ada di database. Silakan tulis ulang soal untuk melanjutkan.'
                : 'Soal ini memiliki kemiripan sedang dengan entitas database. Pastikan soal ini memiliki konteks unik.'}
            </p>
          </div>
        </div>

        {result.candidates && result.candidates.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs underline font-bold shrink-0 flex items-center gap-0.5 focus:outline-none ${
              isBlocked ? 'text-red-700' : 'text-amber-800'
            }`}
          >
            {isOpen ? 'Sembunyikan' : 'Lihat Soal Mirip'}
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {isOpen && result.candidates && result.candidates.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#CBD5E1]/50 space-y-2.5 max-h-40 overflow-y-auto">
          {result.candidates.map((cand, idx) => (
            <div key={cand.id} className="text-xs bg-white border border-[#CBD5E1]/60 p-3 rounded-xl space-y-1 shadow-sm text-slate-800">
              <div className="flex justify-between font-bold">
                <span>Kandidat #{idx + 1} (ID: {cand.id.substring(0, 8)})</span>
                <span className="text-[#EF4444] font-extrabold">{Math.round(cand.similarity * 100)}% mirip</span>
              </div>
              <p className="italic line-clamp-2 leading-relaxed text-slate-600">
                "{cand.soalText}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DuplicateAlert;

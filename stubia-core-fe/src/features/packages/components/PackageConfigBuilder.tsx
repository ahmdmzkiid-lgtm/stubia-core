import React, { useEffect, useState } from 'react';
import { PackageGeneratorConfig } from '../types/packages.types';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { Sparkles, Sliders, AlertCircle } from 'lucide-react';

interface PackageConfigBuilderProps {
  onGenerate: (config: PackageGeneratorConfig) => void;
  isLoading: boolean;
}

// Default topics mapping for UTBK subtests
const SUBTEST_TOPICS: Record<string, string[]> = {
  'Penalaran Matematika': ['Aljabar', 'Geometri', 'Kalkulus', 'Trigonometri', 'Statistika'],
  'Literasi dalam Bahasa Indonesia': ['Ide Pokok', 'Analisis Paragraf', 'Simpulan Teks', 'Struktur Logika'],
  'Literasi dalam Bahasa Inggris': ['Main Idea', 'Vocabulary in Context', 'Author Tone', 'Inference Questions'],
  'Pemahaman Bacaan dan Menulis': ['Ejaan PUEBI', 'Kalimat Efektif', 'Konjungsi', 'Penggabungan Paragraf'],
  'Pengetahuan dan Pemahaman Umum': ['Sinonim Antonim', 'Makna Kata', 'Kelompok Kata', 'Bahasa Panda'],
  'Kemampuan Penalaran Umum': ['Logika Analitis', 'Logika Silogisme', 'Pola Barisan Bilangan', 'Analisis Gambar'],
  'Kemampuan Kuantitatif': ['Operasi Aritmatika', 'Peluang Kejadian', 'Persamaan Garis', 'Himpunan'],
};

export const PackageConfigBuilder: React.FC<PackageConfigBuilderProps> = ({ onGenerate, isLoading }) => {
  const [subtes, setSubtes] = useState('Penalaran Matematika');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [includeAi, setIncludeAi] = useState(true);
  const [minSimilarity, setMinSimilarity] = useState(0.40);

  // Difficulty allocations
  const [diffEasy, setDiffEasy] = useState(20);
  const [diffMedium, setDiffMedium] = useState(50);
  const [diffHots, setDiffHots] = useState(30);

  // Topic allocations: Record of topic name to percentage
  const [topicsAlloc, setTopicsAlloc] = useState<Record<string, number>>({});

  // Reset topic allocations when subtest changes
  useEffect(() => {
    const list = SUBTEST_TOPICS[subtes] || [];
    if (list.length > 0) {
      const share = Math.floor(100 / list.length);
      const alloc: Record<string, number> = {};
      list.forEach((t, idx) => {
        alloc[t] = idx === list.length - 1 ? 100 - share * (list.length - 1) : share;
      });
      setTopicsAlloc(alloc);
    } else {
      setTopicsAlloc({});
    }
  }, [subtes]);

  const handleTopicAllocChange = (topic: string, val: number) => {
    setTopicsAlloc({ ...topicsAlloc, [topic]: val });
  };

  const diffSum = diffEasy + diffMedium + diffHots;
  const topicsSum = Object.values(topicsAlloc).reduce((sum, v) => sum + v, 0);

  const isConfigValid = diffSum === 100 && topicsSum === 100 && totalQuestions > 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigValid) return;

    onGenerate({
      subtes,
      totalQuestions,
      topicsDistribution: topicsAlloc,
      difficultyDistribution: {
        EASY: diffEasy,
        MEDIUM: diffMedium,
        HOTS: diffHots,
      },
      includeAi,
      minSimilarityThreshold: minSimilarity,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="bg-white border border-[#CBD5E1] border-l-4 border-l-[#1B3FAB] rounded-2xl p-6 shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-[#1B3FAB] flex items-center gap-1.5 uppercase tracking-wider">
        <Sliders className="h-4 w-4" /> 1. Parameter Generator
      </h3>

      {/* Subtest Selection */}
      <div>
        <label className="block text-xs font-bold text-[#64748B] mb-1.5">Subtes UTBK</label>
        <select
          value={subtes}
          onChange={(e) => setSubtes(e.target.value)}
          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
        >
          {Object.keys(SUBTEST_TOPICS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Total Questions */}
      <Input
        label="Jumlah Soal Paket"
        type="number"
        min={1}
        max={100}
        value={totalQuestions}
        onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 10)}
        className="focus:ring-[#1B3FAB]"
      />

      {/* Difficulty Distribution (Easy, Medium, HOTS) */}
      <div className="space-y-3.5 pt-3 border-t border-[#CBD5E1]/50">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold text-[#64748B]">Distribusi Kesulitan (%)</label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            diffSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            Total: {diffSum}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="EASY"
            type="number"
            value={diffEasy}
            onChange={(e) => setDiffEasy(parseInt(e.target.value) || 0)}
            className="text-center font-bold"
          />
          <Input
            label="MEDIUM"
            type="number"
            value={diffMedium}
            onChange={(e) => setDiffMedium(parseInt(e.target.value) || 0)}
            className="text-center font-bold"
          />
          <Input
            label="HOTS"
            type="number"
            value={diffHots}
            onChange={(e) => setDiffHots(parseInt(e.target.value) || 0)}
            className="text-center font-bold"
          />
        </div>
      </div>

      {/* Topic Distributions */}
      <div className="space-y-3 pt-3 border-t border-[#CBD5E1]/50">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold text-[#64748B]">Komposisi Topik (%)</label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            topicsSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            Total: {topicsSum}%
          </span>
        </div>

        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {Object.keys(topicsAlloc).map((topic) => (
            <div key={topic} className="flex justify-between items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">{topic}</span>
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={topicsAlloc[topic] || 0}
                  onChange={(e) => handleTopicAllocChange(topic, parseInt(e.target.value) || 0)}
                  className="w-full h-8 px-2 border border-[#CBD5E1] rounded-md text-xs font-bold text-center bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exclude/Include AI, Max Similarity slider */}
      <div className="space-y-4 pt-3 border-t border-[#CBD5E1]/50">
        {/* Toggle include AI */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold text-[#64748B]">Sertakan Soal AI</label>
            <span className="text-[10px] text-[#64748B] font-medium">Campurkan bank soal AI-generated</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeAi}
              onChange={(e) => setIncludeAi(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1B3FAB]"></div>
          </label>
        </div>

        {/* Max similarity slider */}
        <div>
          <div className="flex justify-between text-xs font-bold text-[#64748B] mb-1.5">
            <span>Batas Kemiripan Maksimal Soal</span>
            <span className="text-[#1B3FAB]">{Math.round(minSimilarity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.20}
            max={0.80}
            step={0.05}
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B3FAB]"
          />
          <div className="flex justify-between text-[10px] font-semibold text-[#64748B] mt-1">
            <span>Sangat Unik (20%)</span>
            <span>Mirip (80%)</span>
          </div>
        </div>
      </div>

      {/* Form verification warnings */}
      {(!isConfigValid) && (
        <div className="flex gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-medium leading-relaxed">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
          <span>
            {diffSum !== 100 && 'Alokasi kesulitan harus berjumlah 100%. '}
            {topicsSum !== 100 && 'Alokasi komposisi topik harus berjumlah 100%.'}
          </span>
        </div>
      )}

      {/* Submit Trigger */}
      <Button
        type="submit"
        variant="primary"
        disabled={!isConfigValid || isLoading}
        isLoading={isLoading}
        className="w-full h-11 text-base font-bold shadow-md flex items-center justify-center gap-1.5"
      >
        <Sparkles className="h-5 w-5 shrink-0" />
        <span>Generate Paket</span>
      </Button>
    </form>
  );
};
export default PackageConfigBuilder;

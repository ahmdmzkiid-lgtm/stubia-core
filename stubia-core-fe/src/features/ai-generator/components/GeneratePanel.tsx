import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AISkill, GeneratedQuestion } from '../types/aiGenerator.types';
import { aiGeneratorApi } from '../api/aiGeneratorApi';
import { PromptPreview } from './PromptPreview';
import { AIResultCard } from './AIResultCard';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { Badge } from '../../../components/shared/Badge';
import { Sparkles, Library, Save, HelpCircle } from 'lucide-react';

export const GeneratePanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<AISkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<AISkill | null>(null);
  
  // Form States
  const [subtes, setSubtes] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HOTS'>('MEDIUM');
  const [tipe, setTipe] = useState<'PG' | 'PGK' | 'BS' | 'ISIAN'>('PG');
  const [jumlah, setJumlah] = useState(5);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Generation Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [meta, setMeta] = useState<any>(null);

  // Load Skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await aiGeneratorApi.getSkills();
        setSkills(data);
        
        // Check if navigation passed a pre-selected skill
        if (location.state?.selectedSkill) {
          const navSkill = location.state.selectedSkill as AISkill;
          const found = data.find(s => s.id === navSkill.id);
          if (found) {
            handleSkillSelect(found);
          }
        } else if (data.length > 0) {
          handleSkillSelect(data[0]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat list skill.');
      }
    };
    fetchSkills();
  }, [location.state]);

  const handleSkillSelect = (skill: AISkill) => {
    setSelectedSkill(skill);
    setSubtes(skill.subtes);
    setSelectedTopics(skill.topikCakupanJson.slice(0, 2)); // default pick first 2 topics
  };

  const handleTopicToggle = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const triggerGenerate = async () => {
    if (!selectedSkill) {
      toast.error('Pilih skill prompt terlebih dahulu!');
      return;
    }
    if (selectedTopics.length === 0) {
      toast.error('Pilih minimal 1 topik cakupan!');
      return;
    }
    if (jumlah < 1 || jumlah > 20) {
      toast.error('Jumlah soal harus berada di antara 1 dan 20!');
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    setMeta(null);

    const configPayload = {
      subtes,
      topik: selectedTopics,
      difficulty,
      tipe,
      jumlah,
    };

    try {
      const result = await aiGeneratorApi.generateQuestions(selectedSkill.id, configPayload, selectedModel);
      setGeneratedQuestions(result.questions);
      setMeta(result.meta);
      
      // Auto-select questions that are SAFE or WARNING (exclude BLOCKED)
      const safeIndices: number[] = [];
      result.questions.forEach((q, idx) => {
        if (q.similarityStatus !== 'BLOCKED') {
          safeIndices.push(idx);
        }
      });
      setSelectedIndices(safeIndices);
      toast.success('Soal berhasil digenerate AI!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate soal via AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedQuestions(updated);
  };

  const handleSelectToggle = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleSelectAllSafe = () => {
    const safeIndices: number[] = [];
    generatedQuestions.forEach((q, idx) => {
      if (q.similarityStatus !== 'BLOCKED') {
        safeIndices.push(idx);
      }
    });
    setSelectedIndices(safeIndices);
  };

  const handleSaveSelected = async () => {
    if (selectedIndices.length === 0) {
      toast.error('Pilih minimal 1 soal untuk disimpan!');
      return;
    }

    const selectedQuestions = selectedIndices.map(idx => generatedQuestions[idx]);
    const payload = {
      questions: selectedQuestions,
      skillId: selectedSkill?.id,
      config: { subtes, topik: selectedTopics, difficulty, tipe, jumlah },
      modelUsed: selectedModel,
      tokensUsed: meta?.tokensUsed,
      costEstimateUsd: meta?.costEstimateUsd,
      durationMs: meta?.durationMs,
    };

    try {
      const result = await aiGeneratorApi.saveQuestions(payload);
      toast.success(`${result.saved} soal berhasil disimpan ke Bank Soal!`);
      navigate('/questions');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-xl font-bold text-[#0F172A]">AI Question Generator Panel</h2>
          </div>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Buat soal ujian secara instan berdasarkan skill prompt khusus akademik dan lakukan kurasi anti-duplikasi real-time.
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ai-generator/skills')}
          className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1]"
        >
          <Library className="h-4 w-4 mr-1.5" /> Buka Skill Library
        </Button>
      </div>

      {/* Main Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* Left Config Column (40% / 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] border-l-4 border-l-[#7C3AED] rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#7C3AED] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> 1. Konfigurasi Generate
          </h3>

          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1.5">
              Pilih Skill Prompt
            </label>
            <select
              value={selectedSkill?.id || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const found = skills.find(s => s.id === e.target.value);
                if (found) handleSkillSelect(found);
              }}
              className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold"
            >
              {skills.map(s => (
                <option key={s.id} value={s.id}>
                  {s.namaSkill} ({s.subtes})
                </option>
              ))}
            </select>
          </div>

          {/* Subtest (Autofilled / Override) */}
          <Input
            label="Subtes UTBK (Auto-fill)"
            value={subtes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubtes(e.target.value)}
            placeholder="Subtes akademik..."
            className="focus:ring-[#7C3AED]"
          />

          {/* Topic Select Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-2">
              Pilih Topik Cakupan
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-[#CBD5E1] rounded-xl p-3 bg-[#F8FAFC]">
              {selectedSkill?.topikCakupanJson.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTopicToggle(topic)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                    selectedTopics.includes(topic)
                      ? 'bg-purple-100 border-[#7C3AED] text-[#5B21B6]'
                      : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty and Type selection (Grid) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-2">Kesulitan</label>
              <div className="space-y-1.5">
                {['EASY', 'MEDIUM', 'HOTS'].map((diff) => (
                  <label key={diff} className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === diff}
                      onChange={() => setDifficulty(diff as any)}
                      className="text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    {diff}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-2">Tipe Soal</label>
              <div className="space-y-1.5">
                {['PG', 'PGK', 'BS', 'ISIAN'].map((t) => (
                  <label key={t} className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <input
                      type="radio"
                      name="tipe"
                      checked={tipe === t}
                      onChange={() => setTipe(t as any)}
                      className="text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Model and Qty */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jumlah Soal (1-20)"
              type="number"
              min={1}
              max={20}
              value={jumlah}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJumlah(parseInt(e.target.value) || 5)}
              className="focus:ring-[#7C3AED]"
            />

            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1.5">Model AI</label>
              <select
                value={selectedModel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedModel(e.target.value)}
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>

          {/* Prompt Preview Accordion */}
          <PromptPreview skill={selectedSkill} config={{ subtes, topik: selectedTopics, difficulty, tipe, jumlah }} />

          {/* Submit Trigger */}
          <Button
            variant="ai"
            className="w-full h-11 text-base font-bold shadow-md flex items-center justify-center gap-2"
            onClick={triggerGenerate}
            isLoading={isGenerating}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <span>Generate Soal AI</span>
          </Button>
        </div>

        {/* Right Output Column (60% / 6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cost details metadata card */}
          {meta && (
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Durasi Proses</span>
                <p className="text-base font-extrabold text-[#0F172A] mt-1">{(meta.durationMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Tokens</span>
                <p className="text-base font-extrabold text-[#0F172A] mt-1">{meta.tokensUsed.toLocaleString()}</p>
              </div>
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Estimasi Biaya</span>
                <p className="text-base font-extrabold text-[#7C3AED] mt-1">${meta.costEstimateUsd.toFixed(5)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status Preview</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="Safe">{meta.summary.safe}</Badge>
                  {meta.summary.warning > 0 && <Badge variant="Warning">{meta.summary.warning}</Badge>}
                  {meta.summary.blocked > 0 && <Badge variant="Blocked">{meta.summary.blocked}</Badge>}
                </div>
              </div>
            </div>
          )}

          {isGenerating ? (
            // Loading State
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
              <div className="flex space-x-2">
                <div className="h-3 w-3 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-3 w-3 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-3 w-3 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm font-bold text-[#0F172A] animate-pulse">✨ AI sedang merumuskan soal UTBK...</p>
              <p className="text-xs text-[#64748B] font-semibold leading-relaxed">
                Mohon tunggu, kami sedang menyusun stimulus, opsi jawaban, dan menjalankan analisis kesamaan trigram di database bank soal.
              </p>
            </div>
          ) : generatedQuestions.length === 0 ? (
            // Empty State
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="h-14 w-14 bg-purple-100 text-[#7C3AED] rounded-2xl flex items-center justify-center shadow-inner">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-[#0F172A]">Pratinjau Hasil Kosong</h4>
              <p className="text-xs text-[#64748B] max-w-sm font-semibold">
                Konfigurasikan parameter pembuat soal di sebelah kiri dan klik tombol generate untuk melihat soal hasil kurasi AI di sini.
              </p>
            </div>
          ) : (
            // Results list and action bar
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">
                  Terpilih: {selectedIndices.length} dari {generatedQuestions.length} soal
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2.5 py-1.5 h-8 font-bold border-[#CBD5E1]"
                    onClick={handleSelectAllSafe}
                  >
                    Pilih Semua SAFE
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2.5 py-1.5 h-8 font-bold border-[#CBD5E1] text-[#EF4444] hover:bg-red-50 hover:border-red-300"
                    onClick={() => setSelectedIndices([])}
                  >
                    Batal Semua
                  </Button>
                </div>
              </div>

              {/* Generated cards */}
              <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <AIResultCard
                    key={idx}
                    question={q}
                    index={idx}
                    isSelected={selectedIndices.includes(idx)}
                    onSelectToggle={handleSelectToggle}
                    onFieldChange={handleFieldChange}
                  />
                ))}
              </div>

              {/* Action save bar */}
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 sticky bottom-0 z-10">
                <span className="text-xs font-bold text-[#0F172A] hidden sm:block">
                  Simpan soal terpilih ke database bank soal.
                </span>
                <Button
                  variant="ai"
                  className="w-full sm:w-auto font-bold shadow-md flex items-center gap-2"
                  onClick={handleSaveSelected}
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>Simpan {selectedIndices.length} Soal Terpilih → Bank</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GeneratePanel;

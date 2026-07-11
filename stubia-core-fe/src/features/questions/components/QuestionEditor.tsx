import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { questionsApi } from '../api/questionsApi';
import { SimilarityResult } from '../types/questions.types';
import { Input } from '../../../components/shared/Input';
import { Textarea } from '../../../components/shared/Textarea';
import { Button } from '../../../components/shared/Button';
import { DuplicateAlert } from './DuplicateAlert';
import { useAuthStore } from '../../../store/authStore';
import { ChevronLeft, Save } from 'lucide-react';

const questionSchema = zod.object({
  stimulus: zod.string().optional(),
  soalText: zod.string().min(10, 'Pertanyaan soal minimal berisi 10 karakter'),
  opsiA: zod.string().min(1, 'Opsi A wajib diisi'),
  opsiB: zod.string().min(1, 'Opsi B wajib diisi'),
  opsiC: zod.string().min(1, 'Opsi C wajib diisi'),
  opsiD: zod.string().min(1, 'Opsi D wajib diisi'),
  opsiE: zod.string().optional(),
  answerKey: zod.string().min(1, 'Kunci jawaban wajib diisi'),
  explanation: zod.string().min(10, 'Pembahasan minimal berisi 10 karakter'),
  subtes: zod.string().min(1, 'Subtes wajib diisi'),
  topic: zod.string().min(1, 'Topik wajib diisi'),
  difficulty: zod.enum(['EASY', 'MEDIUM', 'HOTS']),
  type: zod.enum(['PG', 'PGK', 'BS', 'MENJODOHKAN', 'ISIAN']),
});

type QuestionFormFields = zod.infer<typeof questionSchema>;

export const QuestionEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [similarityResult, setSimilarityResult] = useState<SimilarityResult | null>(null);
  
  // Real-time typed soal text to trigger debounce similarity check
  const [typedSoal, setTypedSoal] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormFields>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      subtes: 'Penalaran Matematika',
      difficulty: 'MEDIUM',
      type: 'PG',
    },
  });

  const watchSoalText = watch('soalText');

  // Sync react-hook-form value to local state for debouncing
  useEffect(() => {
    if (watchSoalText !== undefined) {
      setTypedSoal(watchSoalText);
    }
  }, [watchSoalText]);

  // Debounced Trigram Check
  useEffect(() => {
    if (typedSoal.length < 30) {
      setSimilarityResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await questionsApi.checkSimilarity(typedSoal, id);
        setSimilarityResult(result);
      } catch (err) {
        console.error('Similarity check error:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [typedSoal, id]);

  // Load question for editing
  useEffect(() => {
    if (!isEditMode) return;

    const loadQuestion = async () => {
      try {
        const data = await questionsApi.getQuestionById(id);
        reset({
          stimulus: data.stimulus || '',
          soalText: data.soalText,
          opsiA: data.optionsJson.A || '',
          opsiB: data.optionsJson.B || '',
          opsiC: data.optionsJson.C || '',
          opsiD: data.optionsJson.D || '',
          opsiE: data.optionsJson.E || '',
          answerKey: data.answerKey,
          explanation: data.explanation,
          subtes: data.subtes,
          topic: data.topic,
          difficulty: data.difficulty,
          type: data.type,
        });
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat soal.');
        navigate('/questions');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data: QuestionFormFields) => {
    // If BLOCKED, restrict saving unless user is Super Admin or Academic Manager
    const isBlocked = similarityResult?.similarityStatus === 'BLOCKED';
    const isAcademicOrAdmin = user?.role === 'super_admin' || user?.role === 'academic_manager';
    
    if (isBlocked && !isAcademicOrAdmin) {
      toast.error('Gagal menyimpan: Soal duplikat diblokir oleh sistem.');
      return;
    }

    const payload = {
      stimulus: data.stimulus || '',
      soalText: data.soalText,
      optionsJson: {
        A: data.opsiA,
        B: data.opsiB,
        C: data.opsiC,
        D: data.opsiD,
        E: data.opsiE || null,
      },
      answerKey: data.answerKey,
      explanation: data.explanation,
      subtes: data.subtes,
      topic: data.topic,
      difficulty: data.difficulty,
      type: data.type,
    };

    try {
      if (isEditMode && id) {
        await questionsApi.updateQuestion(id, payload);
        toast.success('Soal berhasil diperbarui!');
      } else {
        await questionsApi.createQuestion(payload);
        toast.success('Soal manual berhasil disimpan sebagai Draft!');
      }
      navigate('/questions');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-4 text-xs font-semibold text-[#64748B] animate-pulse">Memuat data soal...</p>
      </div>
    );
  }

  const isSaveDisabled = isSubmitting || (similarityResult?.similarityStatus === 'BLOCKED' && user?.role === 'content_creator');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header toolbar */}
      <div className="flex items-center justify-between bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/questions')}
          className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali
        </button>
        <h2 className="text-base font-bold text-[#0F172A]">
          {isEditMode ? 'Edit Soal Bank' : 'Buat Soal Manual'}
        </h2>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Editor Grid */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main inputs column (2 cols / 66%) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm space-y-5">
            {/* Stimulus */}
            <Textarea
              label="Stimulus (Opsional)"
              placeholder="Masukkan cerita pengantar wacana disini jika ada wacana kasus..."
              error={errors.stimulus?.message}
              {...register('stimulus')}
            />

            {/* Question Text */}
            <Textarea
              label="Teks Pertanyaan Soal"
              placeholder="Ketik pertanyaan wacana di sini..."
              error={errors.soalText?.message}
              {...register('soalText')}
            />

            {/* Trigram check display inline */}
            <DuplicateAlert result={similarityResult} />

            {/* Options builder */}
            <div className="space-y-3.5 pt-3 border-t border-[#CBD5E1]/50">
              <h4 className="text-xs font-bold text-[#0F172A]">Pilihan Opsi Jawaban</h4>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                  <div key={letter} className="flex gap-2">
                    <span className="text-xs font-bold bg-slate-100 text-[#64748B] h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-[#CBD5E1]">
                      {letter}
                    </span>
                    <Input
                      placeholder={`Opsi ${letter}...`}
                      error={(errors as any)[`opsi${letter}`]?.message}
                      {...register(`opsi${letter}` as any)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Answer key and explanations */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-[#CBD5E1]/50">
              <div className="sm:col-span-1">
                <Input
                  label="Kunci Jawaban"
                  placeholder="A"
                  error={errors.answerKey?.message}
                  {...register('answerKey')}
                  className="text-center font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <Textarea
                  label="Pembahasan Soal"
                  placeholder="Terangkan langkah-langkah logika pemecahan masalah..."
                  error={errors.explanation?.message}
                  {...register('explanation')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuration settings sidebar column (1 col / 33%) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-[#1B3FAB] uppercase tracking-wider">Pengaturan Soal</h3>

            {/* Subtest dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Subtes UTBK
              </label>
              <select
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
                {...register('subtes')}
              >
                <option value="Penalaran Matematika">Penalaran Matematika</option>
                <option value="Literasi dalam Bahasa Indonesia">Literasi dalam Bahasa Indonesia</option>
                <option value="Literasi dalam Bahasa Inggris">Literasi dalam Bahasa Inggris</option>
                <option value="Pemahaman Bacaan dan Menulis">Pemahaman Bacaan dan Menulis</option>
                <option value="Pengetahuan dan Pemahaman Umum">Pengetahuan dan Pemahaman Umum</option>
                <option value="Kemampuan Penalaran Umum">Kemampuan Penalaran Umum</option>
                <option value="Kemampuan Kuantitatif">Kemampuan Kuantitatif</option>
              </select>
            </div>

            {/* Topic input */}
            <Input
              label="Topik Soal"
              placeholder="Fungsi Kuadrat"
              error={errors.topic?.message}
              {...register('topic')}
            />

            {/* Difficulty select */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Tingkat Kesulitan
              </label>
              <select
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
                {...register('difficulty')}
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HOTS">HOTS</option>
              </select>
            </div>

            {/* Type select */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Tipe Soal
              </label>
              <select
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
                {...register('type')}
              >
                <option value="PG">Pilihan Ganda (PG)</option>
                <option value="PGK">Pilihan Ganda Kompleks (PGK)</option>
                <option value="BS">Benar / Salah (BS)</option>
                <option value="MENJODOHKAN">Menjodohkan</option>
                <option value="ISIAN">Isian Singkat</option>
              </select>
            </div>

            {/* Save Action */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSaveDisabled}
              isLoading={isSubmitting}
              className="w-full h-11 text-base font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="h-5 w-5 shrink-0" />
              <span>{isEditMode ? 'Perbarui Soal' : 'Simpan Draft'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default QuestionEditor;

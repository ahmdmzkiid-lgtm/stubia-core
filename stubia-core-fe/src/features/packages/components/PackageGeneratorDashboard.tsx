import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PackageGeneratorConfig } from '../types/packages.types';
import { packagesApi } from '../api/packagesApi';
import { questionsApi } from '../../questions/api/questionsApi';
import { Question } from '../../questions/types/questions.types';
import { PackageConfigBuilder } from './PackageConfigBuilder';
import { PackagePreview } from './PackagePreview';
import { Sparkles } from 'lucide-react';

export const PackageGeneratorDashboard: React.FC = () => {
  const [resolvedQuestions, setResolvedQuestions] = useState<Question[]>([]);
  const [currentConfig, setCurrentConfig] = useState<PackageGeneratorConfig | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async (config: PackageGeneratorConfig) => {
    setIsGenerating(true);
    const toastId = toast.loading('Kriteria saringan dianalisis. Menghitung distribusi & kesamaan...');
    try {
      const data = await packagesApi.generatePackageCandidates(config);
      setResolvedQuestions(data);
      setCurrentConfig(config);
      toast.success(`Sukses generate paket! Ditemukan ${data.length} soal cocok.`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyusun paket soal.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Swap question: replaces a question with another random approved question matching same criteria
  const handleSwapQuestion = async (index: number) => {
    if (!currentConfig) return;
    const qToReplace = resolvedQuestions[index];

    try {
      const filters = {
        subtes: qToReplace.subtes,
        topic: qToReplace.topic,
        difficulty: qToReplace.difficulty,
        status: 'APPROVED' as any,
        source: currentConfig.includeAi ? undefined : ('MANUAL' as any),
        limit: 50,
      };

      const res = await questionsApi.getQuestions(filters);
      // Filter out questions already in package
      const alternatives = res.questions.filter(
        (alt) => !resolvedQuestions.some((r) => r.id === alt.id)
      );

      if (alternatives.length === 0) {
        toast.error('Tidak ada soal alternatif lain yang cocok di bank soal.');
        return;
      }

      // Pick random substitute
      const substitute = alternatives[Math.floor(Math.random() * alternatives.length)];
      const updated = [...resolvedQuestions];
      updated[index] = substitute;
      setResolvedQuestions(updated);
      toast.success(`Soal #${index + 1} (${qToReplace.topic}) berhasil diganti!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat soal pengganti.');
    }
  };

  const handleSave = async (packageName: string, publish: boolean) => {
    setIsSaving(true);
    const toastId = toast.loading(
      publish ? 'Mempublikasikan paket ke LMS stubia.id...' : 'Menyimpan draft paket soal...'
    );

    try {
      const configJson = {
        ...currentConfig,
        questions: resolvedQuestions.map((q) => q.id),
      };

      const pkg = await packagesApi.createPackage(packageName, configJson);

      if (publish) {
        await packagesApi.publishPackage(pkg.id);
        toast.success('Paket soal berhasil disimpan & dipublikasikan ke LMS stubia.id!', {
          id: toastId,
        });
      } else {
        toast.success('Draft paket soal berhasil disimpan!', { id: toastId });
      }

      // Reset
      setResolvedQuestions([]);
      setCurrentConfig(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses paket.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (resolvedQuestions.length === 0) return;
    setIsSaving(true);
    const toastId = toast.loading('Menyimpan draft paket & mendownload spreadsheet...');
    
    try {
      const configJson = {
        ...currentConfig,
        questions: resolvedQuestions.map((q) => q.id),
      };

      // 1. Auto-save package draft to DB
      const dateStr = new Date().toISOString().split('T')[0];
      const defaultName = `Paket Export ${currentConfig?.subtes} - ${dateStr}`;
      const pkg = await packagesApi.createPackage(defaultName, configJson);

      // 2. Trigger Excel download
      await packagesApi.exportPackageExcel(pkg.id, pkg.name);
      toast.success('Excel berhasil didownload!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor berkas Excel.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-[#0F172A]">Automated Package Generator</h2>
        </div>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Susun paket soal tryout berkas akademik dengan menetapkan alokasi kesulitan, komposisi topik, saringan kesamaan trigram, dan AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* Left config column (3 cols / 30%) */}
        <div className="lg:col-span-3">
          <PackageConfigBuilder onGenerate={handleGenerate} isLoading={isGenerating} />
        </div>

        {/* Right preview column (7 cols / 70%) */}
        <div className="lg:col-span-7">
          <PackagePreview
            questions={resolvedQuestions}
            onSwapQuestion={handleSwapQuestion}
            onSave={handleSave}
            onExport={handleExport}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};
export default PackageGeneratorDashboard;

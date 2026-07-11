import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { AISkill } from '../types/aiGenerator.types';
import { aiGeneratorApi } from '../api/aiGeneratorApi';
import { SkillCard } from './SkillCard';
import { Modal } from '../../../components/shared/Modal';
import { Input } from '../../../components/shared/Input';
import { Textarea } from '../../../components/shared/Textarea';
import { Button } from '../../../components/shared/Button';
import { useAuthStore } from '../../../store/authStore';
import { Sparkles, Plus, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const skillSchema = zod.object({
  namaSkill: zod.string().min(1, 'Nama skill wajib diisi'),
  subtes: zod.string().min(1, 'Subtes wajib diisi'),
  topikInput: zod.string().min(1, 'Masukkan minimal 1 topik (dipisahkan koma)'),
  instruksiSoal: zod.string().min(100, 'Instruksi soal minimal berisi 100 karakter'),
  larangan: zod.string().optional(),
  versi: zod.string().default('v1.0'),
});

type SkillFormFields = zod.infer<typeof skillSchema>;

export const SkillLibrary: React.FC = () => {
  const [skills, setSkills] = useState<AISkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AISkill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isManagerOrAdmin = user?.role === 'super_admin' || user?.role === 'academic_manager';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormFields>({
    resolver: zodResolver(skillSchema),
  });

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const data = await aiGeneratorApi.getSkills();
      setSkills(data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat daftar skill.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const openCreateModal = () => {
    setEditingSkill(null);
    reset({
      namaSkill: '',
      subtes: 'Penalaran Matematika',
      topikInput: '',
      instruksiSoal: '',
      larangan: '',
      versi: 'v1.0',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (skill: AISkill) => {
    setEditingSkill(skill);
    reset({
      namaSkill: skill.namaSkill,
      subtes: skill.subtes,
      topikInput: skill.topikCakupanJson.join(', '),
      instruksiSoal: skill.instruksiSoal,
      larangan: skill.larangan || '',
      versi: skill.versi,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: SkillFormFields) => {
    const topics = data.topikInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      namaSkill: data.namaSkill,
      subtes: data.subtes,
      topikCakupanJson: topics,
      instruksiSoal: data.instruksiSoal,
      larangan: data.larangan || '',
      versi: data.versi,
      contohSoalJson: editingSkill?.contohSoalJson || [],
    };

    try {
      if (editingSkill) {
        await aiGeneratorApi.updateSkill(editingSkill.id, payload);
        toast.success('Template skill berhasil diperbarui!');
      } else {
        await aiGeneratorApi.createSkill(payload);
        toast.success('Template skill baru berhasil dibuat!');
      }
      setIsModalOpen(false);
      fetchSkills();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan template skill.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menonaktifkan skill prompt ini?')) {
      try {
        await aiGeneratorApi.deleteSkill(id);
        toast.success('Skill prompt berhasil dinonaktifkan.');
        fetchSkills();
      } catch (error: any) {
        toast.error(error.message || 'Gagal menonaktifkan skill prompt.');
      }
    }
  };

  const handleUseSkill = (skill: AISkill) => {
    // Navigate to Generate Panel and pass skill state
    navigate('/ai-generator', { state: { selectedSkill: skill } });
  };

  const filteredSkills = skills.filter(
    (skill) =>
      skill.namaSkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.subtes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-xl font-bold text-[#0F172A]">AI Prompt Skill Library</h2>
          </div>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Kelola template master prompt yang digunakan untuk memandu AI menghasilkan soal berkualitas tinggi.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ai-generator')}
            className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1]"
          >
            Buka Panel Generate <ChevronRight className="h-4 w-4 ml-1" />
          </Button>

          {isManagerOrAdmin && (
            <Button
              variant="ai"
              size="sm"
              onClick={openCreateModal}
              className="text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Skill Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Search Filter Panel */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
        <Input
          placeholder="Cari nama prompt atau subtes..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 border border-[#CBD5E1] shadow-sm rounded-lg"
        />
      </div>

      {/* Grid of cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#CBD5E1] h-48 rounded-xl animate-pulse p-5">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-6"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#64748B]">Tidak ada template skill ditemukan.</p>
          {isManagerOrAdmin && (
            <Button
              variant="ai"
              size="sm"
              onClick={openCreateModal}
              className="mt-4 text-xs font-bold"
            >
              Buat Template Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onUse={handleUseSkill}
            />
          ))}
        </div>
      )}

      {/* Modal dialog for CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSkill ? 'Perbarui Skill Prompt' : 'Tambah Skill Prompt Baru'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nama Skill Prompt"
            placeholder="Matematika Dasar — Aljabar UTBK"
            error={errors.namaSkill?.message}
            {...register('namaSkill')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Subtes UTBK
              </label>
              <select
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent"
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

            <Input
              label="Versi Prompt"
              placeholder="v1.0"
              error={errors.versi?.message}
              {...register('versi')}
            />
          </div>

          <Input
            label="Topik Cakupan (pisahkan dengan koma)"
            placeholder="Sistem Persamaan, Aljabar, Fungsi Kuadrat"
            error={errors.topikInput?.message}
            {...register('topikInput')}
          />

          <Textarea
            label="Instruksi Master Prompt Utama (min 100 karakter)"
            placeholder="Tuliskan panduan detail mengenai cara pembuatan soal, konteks yang harus digunakan, tingkat kesulitan, kedalaman materi, dan logika berpikir..."
            isAiPrompt
            error={errors.instruksiSoal?.message}
            {...register('instruksiSoal')}
          />

          <Textarea
            label="Larangan / Batasan Soal AI"
            placeholder="Hindari pembuatan soal hafalan murni, jangan menggunakan kalkulator..."
            {...register('larangan')}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-[#CBD5E1]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="ai"
              size="sm"
              className="text-xs font-bold"
              isLoading={isSubmitting}
            >
              {editingSkill ? 'Perbarui Skill' : 'Simpan Skill'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default SkillLibrary;

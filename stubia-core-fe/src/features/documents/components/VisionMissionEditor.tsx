import React, { useEffect, useState } from 'react';
import { VisionMission } from '../types/documents.types';
import { documentsApi } from '../api/documentsApi';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Textarea } from '../../../components/shared/Textarea';
import { useAuthStore } from '../../../store/authStore';
import { Target, Compass, Sparkles, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const VisionMissionEditor: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<VisionMission | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form values
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [coreValues, setCoreValues] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const vm = await documentsApi.getVisionMission();
      setData(vm);
      setVision(vm.vision);
      setMission(vm.mission);
      setCoreValues(vm.coreValues);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat Visi & Misi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!vision || !mission || !coreValues) {
      toast.error('Semua data wajib diisi');
      return;
    }

    try {
      const updated = await documentsApi.updateVisionMission({ vision, mission, coreValues });
      setData(updated);
      setIsEditing(false);
      toast.success('Visi Misi perusahaan berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan Visi Misi.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Memuat Visi Misi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
          <Target className="h-5 w-5 text-[#1B3FAB]" />
          <span>Visi, Misi & Core Values Perusahaan</span>
        </h3>

        {isSuperAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold border-[#CBD5E1] hover:bg-slate-100"
          >
            <Edit className="h-4 w-4 mr-1.5" /> Edit Visi Misi
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm space-y-4">
          <Input
            label="Visi Perusahaan"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="e.g. Menjadi platform persiapan UTBK SNBT terbaik..."
          />

          <Textarea
            label="Misi Perusahaan (Gunakan angka 1., 2. per baris)"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={5}
            placeholder="e.g. 1. Menyediakan tryout gratis...\n2. Membangun teknologi..."
          />

          <Input
            label="Core Values (Nilai-Nilai Inti)"
            value={coreValues}
            onChange={(e) => setCoreValues(e.target.value)}
            placeholder="e.g. Integritas, Kerja Keras, Inovasi"
          />

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#CBD5E1]/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (data) {
                  setVision(data.vision);
                  setMission(data.mission);
                  setCoreValues(data.coreValues);
                }
                setIsEditing(false);
              }}
              className="text-xs font-bold border-[#CBD5E1]"
            >
              <X className="h-4 w-4 mr-1.5" /> Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white"
            >
              <Save className="h-4 w-4 mr-1.5" /> Simpan Visi Misi
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vision card */}
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="h-10 w-10 bg-blue-50 text-[#1B3FAB] rounded-xl flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-extrabold text-[#0f172a]">VISI STUBIA</h4>
              <p className="text-xs font-semibold text-[#64748B] leading-relaxed italic">
                "{data?.vision}"
              </p>
            </div>
            <div className="border-t border-[#CBD5E1]/40 pt-3">
              <span className="text-[10px] font-bold text-[#1B3FAB] tracking-wider uppercase">Strategic Anchor</span>
            </div>
          </div>

          {/* Mission card */}
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 lg:col-span-2">
            <div className="space-y-3.5">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-extrabold text-[#0f172a]">MISI STUBIA</h4>
              <div className="text-xs font-semibold text-[#64748B] leading-relaxed whitespace-pre-line space-y-2">
                {data?.mission}
              </div>
            </div>
            <div className="border-t border-[#CBD5E1]/40 pt-3">
              <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Action Pillars</span>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-gradient-to-br from-[#1B3FAB] to-[#0ea5e9] rounded-2xl p-6 text-white shadow-md lg:col-span-3 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5" /> CORE VALUES KAMI
              </h4>
              <p className="text-xs font-medium text-blue-50 leading-relaxed max-w-2xl">
                Nilai-nilai inti yang mengikat seluruh civitas akademik dan operasional Stubia dalam berkarya demi mencerdaskan generasi bangsa.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shrink-0 max-w-md">
              <p className="text-sm font-extrabold tracking-wide text-center uppercase md:text-right">
                {data?.coreValues}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VisionMissionEditor;

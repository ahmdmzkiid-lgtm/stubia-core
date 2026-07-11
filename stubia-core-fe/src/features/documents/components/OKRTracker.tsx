import React, { useEffect, useState } from 'react';
import { Objective } from '../types/documents.types';
import { documentsApi } from '../api/documentsApi';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import { Badge } from '../../../components/shared/Badge';
import { useAuthStore } from '../../../store/authStore';
import { Plus, Target, Sliders, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const OKRTracker: React.FC = () => {
  const { user } = useAuthStore();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form values for new Objective
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [krs, setKrs] = useState<Array<{ title: string; targetVal: number; unit: string }>>([
    { title: '', targetVal: 100, unit: '%' },
  ]);

  // Editing progress values
  const [editingKRId, setEditingKRId] = useState<string | null>(null);
  const [krProgressValue, setKrProgressValue] = useState<number>(0);

  const isManagerOrAdmin = ['super_admin', 'academic_manager'].includes(user?.role || '');

  const fetchObjectives = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.getObjectives();
      setObjectives(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data OKR.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, []);

  const handleAddKRField = () => {
    setKrs([...krs, { title: '', targetVal: 100, unit: '%' }]);
  };

  const handleRemoveKRField = (index: number) => {
    setKrs(krs.filter((_, idx) => idx !== index));
  };

  const handleKRFieldChange = (index: number, field: string, val: any) => {
    const updated = [...krs];
    updated[index] = { ...updated[index], [field]: val };
    setKrs(updated);
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate || krs.some(kr => !kr.title || !kr.targetVal)) {
      toast.error('Lengkapi semua data Objective dan Key Results.');
      return;
    }

    try {
      await documentsApi.createObjective({
        title,
        targetDate,
        keyResults: krs,
      });
      toast.success('Objective & Key Results OKR berhasil ditambahkan!');
      setIsModalOpen(false);
      setTitle('');
      setTargetDate('');
      setKrs([{ title: '', targetVal: 100, unit: '%' }]);
      fetchObjectives();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat Objective OKR.');
    }
  };

  const handleUpdateKRProgress = async (krId: string) => {
    try {
      await documentsApi.updateKeyResult(krId, krProgressValue);
      toast.success('Kemajuan Key Result berhasil diperbarui!');
      setEditingKRId(null);
      fetchObjectives();
    } catch (err: any) {
      toast.error(err.message || 'Gagal merubah kemajuan.');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ON_TRACK') return <Badge variant="Done"><CheckCircle2 className="h-3 w-3 mr-1" /> On Track</Badge>;
    if (status === 'AT_RISK') return <Badge variant="Warning"><AlertTriangle className="h-3 w-3 mr-1" /> At Risk</Badge>;
    return <Badge variant="Rejected"><XCircle className="h-3 w-3 mr-1" /> Off Track</Badge>;
  };

  const getStatusColor = (status: string) => {
    if (status === 'ON_TRACK') return 'bg-emerald-600';
    if (status === 'AT_RISK') return 'bg-amber-500';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]"></div>
        <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Memuat dashboard OKR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#1B3FAB]" />
          <h3 className="text-base font-bold text-[#0F172A]">Objectives & Key Results (OKR)</h3>
        </div>

        {isManagerOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" /> Tambah Objective OKR
          </Button>
        )}
      </div>

      {objectives.length === 0 ? (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-12 text-center shadow-sm">
          <Target className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-[#0F172A]">Belum Ada Objective OKR</h4>
          <p className="text-xs text-[#64748B] mt-1">Sasaran kinerja perusahaan belum ditambahkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {objectives.map((obj) => (
            <div key={obj.id} className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm space-y-4">
              {/* Header Objective */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#0F172A]">{obj.title}</h4>
                  <p className="text-[10px] text-[#64748B] font-bold">
                    Target Date: {new Date(obj.targetDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(obj.status)}
                  <span className="text-sm font-extrabold text-[#0F172A]">{obj.progress}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getStatusColor(obj.status)}`}
                  style={{ width: `${obj.progress}%` }}
                ></div>
              </div>

              {/* Key Results list */}
              <div className="border-t border-[#CBD5E1]/40 pt-4 mt-2 space-y-3">
                <h5 className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Key Results</h5>

                <div className="grid grid-cols-1 gap-3">
                  {obj.keyResults.map((kr) => {
                    const pct = Math.round(Math.min((kr.currentVal / kr.targetVal) * 100, 100));
                    return (
                      <div key={kr.id} className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#0F172A]">{kr.title}</p>
                          <p className="text-[10px] font-bold text-[#64748B]">
                            Progress: {kr.currentVal} / {kr.targetVal} {kr.unit} ({pct}%)
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1B3FAB]" style={{ width: `${pct}%` }}></div>
                          </div>

                          {editingKRId === kr.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={krProgressValue}
                                onChange={(e) => setKrProgressValue(parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 px-2 border border-[#CBD5E1] rounded text-xs font-bold"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleUpdateKRProgress(kr.id)}
                                className="h-8 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingKRId(null)}
                                className="h-8 text-[10px]"
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKRId(kr.id);
                                setKrProgressValue(kr.currentVal);
                              }}
                              className="text-xs font-bold text-[#1B3FAB] hover:underline flex items-center gap-0.5"
                            >
                              <Sliders className="h-3.5 w-3.5" /> Adjust
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add OKR */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Sasaran OKR Baru">
        <form onSubmit={handleCreateObjective} className="space-y-4 pt-1">
          <Input
            label="Judul Sasaran (Objective)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tingkatkan Kualitas Soal Tryout UTBK 2026"
            required
          />

          <Input
            label="Tenggat Waktu Pencapaian"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />

          {/* Key results inputs */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#64748B]">Indikator Hasil (Key Results)</label>
              <button
                type="button"
                onClick={handleAddKRField}
                className="text-[10px] font-bold text-[#1B3FAB] hover:underline"
              >
                + Tambah Indikator
              </button>
            </div>

            {krs.map((kr, idx) => (
              <div key={idx} className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3 space-y-3 relative">
                {krs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKRField(idx)}
                    className="absolute top-2 right-2 text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Hapus
                  </button>
                )}
                <Input
                  label={`KR #${idx + 1} Judul Indikator`}
                  value={kr.title}
                  onChange={(e) => handleKRFieldChange(idx, 'title', e.target.value)}
                  placeholder="e.g. Produksi 1.500 soal HOTS baru"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nilai Target"
                    type="number"
                    value={kr.targetVal}
                    onChange={(e) => handleKRFieldChange(idx, 'targetVal', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    label="Satuan"
                    value={kr.unit}
                    onChange={(e) => handleKRFieldChange(idx, 'unit', e.target.value)}
                    placeholder="e.g. %, Soal, Ribu"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#CBD5E1]/40 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold border-[#CBD5E1]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white"
            >
              Simpan OKR
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default OKRTracker;

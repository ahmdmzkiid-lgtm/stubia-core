import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  Calendar, 
  User, 
  Briefcase,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Task, TaskStatus } from '../types/tasks.types';

interface TaskActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  targetStatus: TaskStatus;
  onConfirm: (proof?: { name: string; type: string; data: string }, feedback?: string) => Promise<void>;
}

export const TaskActionModal: React.FC<TaskActionModalProps> = ({
  isOpen,
  onClose,
  task,
  targetStatus,
  onConfirm,
}) => {
  const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Format deadline date
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Tidak ada tenggat';

  // Format creation date
  const createdStr = new Date(task.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Format file tidak didukung! Harus berupa Screenshot (PNG/JPG) atau File Excel (XLS/XLSX).');
      setFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Ukuran file terlalu besar! Maksimal adalah 5MB.');
      setFile(null);
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: selectedFile.name,
        type: selectedFile.type,
        data: reader.result as string,
      });
    };
    reader.onerror = () => {
      setError('Gagal membaca file. Silakan coba file lain.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Trigger change handling manually
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(droppedFile);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = {
        target: fileInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (task.status === 'DONE' && targetStatus === 'DONE') {
      onClose();
      return;
    }
    
    // Validate proof file for REVIEW
    if (targetStatus === 'REVIEW' && !file) {
      setError('Anda wajib mengunggah bukti pengerjaan (Screenshot atau File Excel).');
      return;
    }

    // Validate feedback for Revision
    if (targetStatus === 'IN_PROGRESS' && task.status === 'REVIEW' && !feedback.trim()) {
      setError('Anda wajib memberikan catatan revisi untuk penulis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(file || undefined, feedback.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses perubahan status tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get modal metadata based on target status
  const getModalConfig = () => {
    if (task.status === 'DONE' && targetStatus === 'DONE') {
      return {
        title: 'Detail Tugas Selesai',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        iconBg: 'bg-emerald-50',
        submitText: 'Tutup',
        submitColor: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500/25',
        bannerText: 'Tugas ini telah diselesaikan dan disetujui.',
      };
    }

    switch (targetStatus) {
      case 'IN_PROGRESS':
        if (task.status === 'REVIEW') {
          return {
            title: 'Kembalikan untuk Revisi',
            icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
            iconBg: 'bg-rose-50',
            submitText: 'Minta Revisi',
            submitColor: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/25',
            bannerText: 'Tugas akan dikembalikan ke status "Mulai Dikerjakan".',
          };
        }
        if (task.status === 'DONE') {
          return {
            title: 'Buka Kembali Tugas',
            icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
            iconBg: 'bg-rose-50',
            submitText: 'Buka Kembali',
            submitColor: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/25',
            bannerText: 'Tugas akan dikembalikan ke status "Mulai Dikerjakan".',
          };
        }
        return {
          title: 'Mulai Kerjakan Tugas',
          icon: <PlayCircle className="h-5 w-5 text-blue-600" />,
          iconBg: 'bg-blue-50',
          submitText: 'Mulai Pengerjaan',
          submitColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/25',
          bannerText: 'Anda akan menandai tugas ini sebagai sedang dikerjakan.',
        };
      case 'REVIEW':
        return {
          title: 'Kirim Tugas Ke Review',
          icon: <Upload className="h-5 w-5 text-amber-600" />,
          iconBg: 'bg-amber-50',
          submitText: 'Kirim untuk Review',
          submitColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/25',
          bannerText: 'Harap lampirkan hasil pekerjaan (Screenshot / Excel) untuk direview.',
        };
      case 'DONE':
        return {
          title: 'Setujui & Selesaikan Tugas',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50',
          submitText: 'Setujui & Selesai',
          submitColor: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/25',
          bannerText: 'Tugas akan secara resmi diselesaikan dan disetujui.',
        };
      default: // back to IN_PROGRESS (Revisi / Reopen)
        return {
          title: task.status === 'REVIEW' ? 'Kembalikan untuk Revisi' : 'Buka Kembali Tugas',
          icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
          iconBg: 'bg-rose-50',
          submitText: task.status === 'REVIEW' ? 'Minta Revisi' : 'Buka Kembali',
          submitColor: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/25',
          bannerText: 'Tugas akan dikembalikan ke status "Mulai Dikerjakan".',
        };
    }
  };

  const config = getModalConfig();

  // Priority badge styling
  const priorityColors: Record<string, string> = {
    P1: 'bg-red-50 text-red-700 border-red-200',
    P2: 'bg-amber-50 text-amber-700 border-amber-200',
    P3: 'bg-blue-50 text-blue-700 border-blue-200',
    P4: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusLabels: Record<string, string> = {
    TODO: 'Belum Dikerjakan',
    IN_PROGRESS: 'Mulai Dikerjakan',
    REVIEW: 'Menunggu Review',
    DONE: 'Selesai & Disetujui',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${config.iconBg} rounded-2xl border border-slate-100`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{config.title}</h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{config.bannerText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section: Task Detail Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h4 className="text-base font-extrabold text-slate-900 leading-snug max-w-[70%]">
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${priorityColors[task.priority] || priorityColors.P4}`}>
                  Prioritas {task.priority}
                </span>
                <span className="text-[10px] font-extrabold bg-slate-200/60 border border-slate-300/80 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                  {task.type}
                </span>
              </div>
            </div>

            {/* Metagrid Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs border-t border-slate-200/80 pt-4">
              <div className="flex items-center gap-2.5 font-semibold text-slate-600">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 block text-[10px] uppercase tracking-wider">Penerima Tugas (PIC)</strong>
                  {task.assignee?.name || 'Belum ditugaskan'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-semibold text-slate-600">
                <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 block text-[10px] uppercase tracking-wider">Pembuat Tugas</strong>
                  {task.creator?.name || 'Atasan'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-semibold text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 block text-[10px] uppercase tracking-wider">Tenggat Waktu</strong>
                  {deadlineStr}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-semibold text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 block text-[10px] uppercase tracking-wider">Tanggal Dibuat</strong>
                  {createdStr}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-semibold text-slate-600">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 block text-[10px] uppercase tracking-wider">Status Sekarang</strong>
                  <span className="text-slate-700 font-bold">{statusLabels[task.status]}</span>
                </span>
              </div>
            </div>

            {/* FULL DESCRIPTION DETAIL (Scrollable & Complete) */}
            <div className="border-t border-slate-200/80 pt-4 space-y-2">
              <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                Instruksi / Detail Pekerjaan Lengkap
              </h5>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {task.description ? task.description : (
                  <span className="text-slate-400 italic">Tidak ada deskripsi detail pekerjaan untuk tugas ini.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Screenshot / Excel Uploader (only for REVIEW) */}
          {targetStatus === 'REVIEW' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Unggah File Bukti Hasil Kerja</span>
                  <span className="text-red-500 font-extrabold">*</span>
                </label>
                <span className="text-[10px] font-bold text-[#1B3FAB] bg-blue-50 px-2 py-0.5 rounded-md">Wajib Diisi</span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  file
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[320px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                        File terpilih (siap dikirim)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl shadow-sm">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik untuk memilih file bukti atau seret ke sini
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-relaxed">
                        Hanya mendukung berkas Screenshot (PNG, JPG) atau Spreadsheet Excel (XLS, XLSX) <br />
                        dengan ukuran maksimal 5MB.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Revision Feedback (only for Revision from REVIEW to IN_PROGRESS) */}
          {targetStatus === 'IN_PROGRESS' && task.status === 'REVIEW' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Catatan Revisi (Feedback untuk Penulis)</span>
                  <span className="text-red-500 font-extrabold">*</span>
                </label>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Wajib Diisi</span>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tuliskan bagian mana yang perlu diperbaiki oleh penulis..."
                required
                className="w-full h-28 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 whitespace-pre-wrap leading-relaxed"
              />
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 animate-shake">
              <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
            {!(task.status === 'DONE' && targetStatus === 'DONE') && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 h-10 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/25 active:scale-95"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || (targetStatus === 'REVIEW' && !file)}
              className={`px-6 h-10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 active:scale-95 shadow-md ${
                task.status === 'DONE' && targetStatus === 'DONE'
                  ? 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500/25 w-full sm:w-auto'
                  : config.submitColor
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>{config.submitText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskActionModal;

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Modal } from '../../../components/shared/Modal';
import { Input } from '../../../components/shared/Input';
import { Textarea } from '../../../components/shared/Textarea';
import { Button } from '../../../components/shared/Button';
import { tasksApi } from '../api/tasksApi';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const taskSchema = zod.object({
  title: zod.string().min(1, 'Judul tugas wajib diisi'),
  description: zod.string().min(1, 'Deskripsi tugas wajib diisi'),
  assigneeId: zod.string().min(1, 'PIC assignee wajib diisi'),
  deadline: zod.string().min(1, 'Tenggat waktu wajib diisi'),
  priority: zod.string().default('P4'),
});

type TaskFormFields = zod.infer<typeof taskSchema>;

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [writers, setWriters] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'P4',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      tasksApi.getWriters().then(setWriters).catch(console.error);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: TaskFormFields) => {
    try {
      await tasksApi.createTask({
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        deadline: data.deadline,
      });
      toast.success('Tugas berhasil dibuat & ditugaskan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat tugas.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat & Tugaskan Soal Baru">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Title */}
        <Input
          label="Judul Tugas"
          placeholder="e.g. Modul Penalaran Matematika Bab 2"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Description */}
        <Textarea
          label="Deskripsi Detail Instruksi"
          placeholder="Tuliskan petunjuk penulisan materi/soal untuk writer..."
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Assignee */}
        <div>
          <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Pilih PIC Writer</label>
          <select
            className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
            {...register('assigneeId')}
          >
            <option value="">-- Pilih PIC Penulis --</option>
            {writers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.email})
              </option>
            ))}
          </select>
          {errors.assigneeId && (
            <p className="text-xs text-red-500 font-bold mt-1">{errors.assigneeId.message}</p>
          )}
        </div>

        {/* Deadline & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tenggat Ujian (Deadline)"
            type="date"
            error={errors.deadline?.message}
            {...register('deadline')}
          />

          <div>
            <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Skala Prioritas</label>
            <select
              className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent font-semibold"
              {...register('priority')}
            >
              <option value="P1">P1 (Kritis / Urgent)</option>
              <option value="P2">P2 (Tinggi)</option>
              <option value="P3">P3 (Sedang)</option>
              <option value="P4">P4 (Rendah / Normal)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#CBD5E1]/40 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white"
          >
            Tugaskan Penulis
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default CreateTaskModal;

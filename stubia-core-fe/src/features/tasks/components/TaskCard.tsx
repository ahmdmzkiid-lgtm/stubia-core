import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/tasks.types';
import { Calendar, User, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { TaskActionModal } from './TaskActionModal';

interface TaskCardProps {
  task: Task;
  onStatusChange: (
    taskId: string,
    newStatus: TaskStatus,
    proof?: { name: string; type: string; data: string }
  ) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const { user } = useAuthStore();
  const [modalTargetStatus, setModalTargetStatus] = useState<TaskStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isManager = user?.role === 'super_admin' || user?.role === 'academic_manager';
  const isAssignedToMe = task.assigneeId === user?.id;

  const handleStatusClick = (newStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalTargetStatus(newStatus);
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = async (proof?: { name: string; type: string; data: string }) => {
    if (!modalTargetStatus) return;
    await onStatusChange(task.id, modalTargetStatus, proof);
  };

  // Format deadline date
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  // Priority color badge mapping
  const priorityColors: Record<string, string> = {
    P1: 'bg-red-50 text-red-700 border-red-200',
    P2: 'bg-amber-50 text-amber-700 border-amber-200',
    P3: 'bg-blue-50 text-blue-700 border-blue-200',
    P4: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <>
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3.5 select-none relative">
        {/* Header Info: Priority and Type */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[task.priority] || priorityColors.P4}`}>
            {task.priority}
          </span>
          <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">
            {task.type}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-sm font-bold text-[#0F172A] line-clamp-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs font-semibold text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Meta data section */}
        <div className="space-y-1.5 pt-2 border-t border-[#CBD5E1]/40 text-[11px] font-semibold text-[#64748B]">
          {deadlineStr && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Tenggat: {deadlineStr}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">PIC: {task.assignee?.name || 'Belum ditugaskan'}</span>
            </div>
          </div>
        </div>

        {/* Task Proof Link (if uploaded) */}
        {task.proofUrl && (
          <div className="pt-2 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between text-xs bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-semibold text-emerald-800 truncate max-w-[140px]" title={task.proofName || 'Bukti File'}>
                📎 {task.proofName || 'Bukti File'}
              </span>
              <a
                href={task.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-1 shrink-0"
              >
                <span>Lihat Bukti</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {task.status !== 'DONE' && (isAssignedToMe || isManager) && (
          <div className="pt-1">
            {task.status === 'TODO' && (
              <button
                type="button"
                onClick={(e) => handleStatusClick('IN_PROGRESS', e)}
                className="w-full h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97]"
              >
                <span>Mulai Kerjakan</span>
              </button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={(e) => handleStatusClick('REVIEW', e)}
                className="w-full h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97]"
              >
                <span>Kirim ke Review</span>
              </button>
            )}
          </div>
        )}

        {task.status === 'REVIEW' && isManager && (
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={(e) => handleStatusClick('DONE', e)}
              className="flex-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97]"
            >
              <span>Setujui</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleStatusClick('IN_PROGRESS', e)}
              className="flex-1 h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97]"
            >
              <span>Revisi</span>
            </button>
          </div>
        )}

        {task.status === 'REVIEW' && !isManager && (
          <div className="pt-1 text-center text-xs font-semibold text-amber-600 bg-amber-50 py-1.5 rounded-lg border border-amber-200">
            Sedang direview
          </div>
        )}

        {task.status === 'DONE' && (
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={(e) => handleStatusClick('DONE', e)}
              className="flex-1 h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97] border border-slate-200"
            >
              <span>Detail Tugas</span>
            </button>
            {isManager && (
              <button
                type="button"
                onClick={(e) => handleStatusClick('IN_PROGRESS', e)}
                className="flex-1 h-8 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none select-none active:scale-[0.97]"
              >
                <span>Buka Kembali</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && modalTargetStatus && (
        <TaskActionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={task}
          targetStatus={modalTargetStatus}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </>
  );
};

export default TaskCard;

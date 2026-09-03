import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/tasks.types';
import { Calendar, ExternalLink, AlertTriangle, Play, Send, Check, RotateCcw, Clock, Eye } from 'lucide-react';
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

  // Format deadline & status flags
  const isOverdue =
    task.deadline &&
    new Date(task.deadline).getTime() < Date.now() &&
    task.status !== 'DONE';

  const isToday =
    task.deadline &&
    new Date(task.deadline).toDateString() === new Date().toDateString();

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  // Priority details
  const priorityConfig: Record<string, { label: string; dot: string; badge: string; border: string }> = {
    P1: {
      label: 'Mendesak',
      dot: 'bg-rose-500 animate-ping',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      border: 'border-l-rose-500',
    },
    P2: {
      label: 'Tinggi',
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      border: 'border-l-amber-500',
    },
    P3: {
      label: 'Normal',
      dot: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      border: 'border-l-blue-500',
    },
    P4: {
      label: 'Rendah',
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      border: 'border-l-slate-400',
    },
  };

  const pConfig = priorityConfig[task.priority] || priorityConfig.P4;

  // Assignee initials
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <div
        className={`bg-white border border-[#CBD5E1] border-l-4 ${pConfig.border} rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3 select-none relative group cursor-grab active:cursor-grabbing`}
      >
        {/* Header Info: Priority and Type */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pConfig.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${pConfig.dot}`} />
              <span>{task.priority} ({pConfig.label})</span>
            </span>
            <span className="text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {task.type}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-xs font-bold text-[#0F172A] line-clamp-2 group-hover:text-[#1B3FAB] transition-colors leading-snug">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] font-medium text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Metadata section (Deadline & Assignee) */}
        <div className="pt-2 border-t border-[#CBD5E1]/50 space-y-2 text-[11px]">
          {deadlineStr && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] font-medium">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                <span>Tenggat:</span>
              </div>
              {isOverdue ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Terlewat ({deadlineStr})</span>
                </span>
              ) : isToday ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Hari Ini!</span>
                </span>
              ) : (
                <span className="font-semibold text-[#0F172A]">{deadlineStr}</span>
              )}
            </div>
          )}

          {/* PIC Avatar & Name */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[#64748B] font-medium text-[10px]">PIC:</span>
            <div className="flex items-center gap-1.5 max-w-[180px]">
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#1B3FAB] to-blue-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                {getInitials(task.assignee?.name)}
              </div>
              <span className="font-bold text-[#0F172A] text-[11px] truncate">
                {task.assignee?.name || 'Belum ditugaskan'}
              </span>
            </div>
          </div>
        </div>

        {/* Task Proof Link (if uploaded) */}
        {task.proofUrl && (
          <div className="pt-1.5 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between text-xs bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
              <span
                className="font-semibold text-emerald-900 truncate max-w-[140px] text-[11px]"
                title={task.proofName || 'Bukti File'}
              >
                📎 {task.proofName || 'Bukti File'}
              </span>
              <a
                href={task.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-1 shrink-0 ml-1 hover:underline"
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
                className="w-full h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm focus:outline-none"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Mulai Kerjakan</span>
              </button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={(e) => handleStatusClick('REVIEW', e)}
                className="w-full h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm focus:outline-none"
              >
                <Send className="h-3 w-3" />
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
              className="flex-1 h-8 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm focus:outline-none"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Setujui</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleStatusClick('IN_PROGRESS', e)}
              className="flex-1 h-8 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm focus:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Revisi</span>
            </button>
          </div>
        )}

        {task.status === 'REVIEW' && !isManager && (
          <div className="pt-1 text-center text-xs font-bold text-amber-700 bg-amber-50/80 py-1.5 rounded-xl border border-amber-200 flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Sedang ditinjau Manager</span>
          </div>
        )}

        {task.status === 'DONE' && (
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={(e) => handleStatusClick('DONE', e)}
              className="flex-1 h-8 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all focus:outline-none border border-slate-200"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Detail Tugas</span>
            </button>
            {isManager && (
              <button
                type="button"
                onClick={(e) => handleStatusClick('IN_PROGRESS', e)}
                className="flex-1 h-8 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-all focus:outline-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
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

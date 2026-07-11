import React, { useEffect, useState } from 'react';
import { Task, TaskStatus } from '../types/tasks.types';
import { tasksApi } from '../api/tasksApi';
import { KanbanBoard } from './KanbanBoard';
import { CreateTaskModal } from './CreateTaskModal';
import { HRAnalyticsDashboard } from './HRAnalyticsDashboard';
import { Button } from '../../../components/shared/Button';
import { useAuthStore } from '../../../store/authStore';
import { Plus, KanbanSquare, BarChart3, Filter, ClipboardList, Circle, Clock, ClipboardCheck, CheckCircle2, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#64748B', '#F59E0B', '#10B981']; // Slate (Belum Dikerjakan), Amber (Review), Emerald (Done)

export const TasksDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [writers, setWriters] = useState<Array<{ id: string; name: string }>>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kanban' | 'hr'>('kanban');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAcademicOrAdmin = user?.role === 'super_admin' || user?.role === 'academic_manager';
  const isManagement = user?.role === 'super_admin' || user?.role === 'academic_manager' || user?.role === 'hr_ops';
  const showHrTab = isManagement;

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  const doneCount = doneTasks;
  const reviewCount = reviewTasks;
  const todoCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'BACKLOG').length;

  const pieData = [
    { name: 'Belum Dikerjakan', value: todoCount },
    { name: 'Menunggu Review', value: reviewCount },
    { name: 'Selesai & Disetujui', value: doneCount },
  ];

  const submissions = tasks
    .filter((t) => t.status === 'REVIEW' || t.status === 'DONE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await tasksApi.getTasks({
        assigneeId: selectedAssignee || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat tugas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedAssignee]);

  useEffect(() => {
    if (isManagement) {
      tasksApi.getWriters().then(setWriters).catch(console.error);
    }
  }, [isManagement]);

  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
    proof?: { name: string; type: string; data: string },
    feedback?: string
  ) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      await tasksApi.updateTaskStatus(taskId, newStatus, proof, feedback);
      toast.success('Progress tugas berhasil diperbarui!');
      fetchTasks();
    } catch (err: any) {
      // Revert if error
      setTasks(previousTasks);
      toast.error(err.message || 'Gagal memindahkan tugas.');
    }
  };



  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-[#1B3FAB]" />
            <h2 className="text-xl font-bold text-[#0F172A]">Employee Task Tracker</h2>
          </div>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Pantau kemajuan modul soal penulis dan kelola workflow akademik.
          </p>
        </div>

        {isAcademicOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" /> Tambah Tugas Baru
          </Button>
        )}
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
            <ClipboardList className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Tugas</p>
            <h4 className="text-base font-extrabold text-[#0F172A] mt-0.5">{totalTasks}</h4>
          </div>
        </div>

        {/* Card 2: Todo */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
            <Circle className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Belum Dikerjakan</p>
            <h4 className="text-base font-extrabold text-[#0F172A] mt-0.5">{todoTasks}</h4>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 text-[#1B3FAB] rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Mulai Dikerjakan</p>
            <h4 className="text-base font-extrabold text-[#0F172A] mt-0.5">{inProgressTasks}</h4>
          </div>
        </div>

        {/* Card 4: Review */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <ClipboardCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Menunggu Review</p>
            <h4 className="text-base font-extrabold text-[#0F172A] mt-0.5">{reviewTasks}</h4>
          </div>
        </div>

        {/* Card 5: Done */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Selesai & Disetujui</p>
            <h4 className="text-base font-extrabold text-[#0F172A] mt-0.5">{doneTasks}</h4>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
              activeTab === 'kanban'
                ? 'bg-white text-[#1B3FAB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <KanbanSquare className="h-4 w-4" />
            <span>Kanban Board</span>
          </button>
          
          {showHrTab && (
            <button
              type="button"
              onClick={() => setActiveTab('hr')}
              className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none ${
                activeTab === 'hr'
                  ? 'bg-white text-[#1B3FAB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analisis HR / Kinerja</span>
            </button>
          )}
        </div>

        {/* Filter assigned employee */}
        {activeTab === 'kanban' && isManagement && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B] flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter Penulis:
            </span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1B3FAB] font-semibold"
            >
              <option value="">Semua Penulis</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace content */}
      {isLoading && activeTab === 'kanban' ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]"></div>
          <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Memutasi kartu Kanban...</p>
        </div>
      ) : activeTab === 'kanban' ? (
        <div className="space-y-6">
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
          />

          {/* Quick Stats Charts & Submissions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column: Pie Chart (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-[#1B3FAB]" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Persentase Status Tugas</h4>
              </div>

              {totalTasks === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] text-center">
                  <p className="text-xs text-slate-400 italic">Tidak ada data tugas.</p>
                </div>
              ) : (
                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Right Column: Submission History Card (6 cols) */}
            <div className="lg:col-span-6 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Riwayat Pengumpulan Tugas</h4>
              </div>

              <div className="flex-1 overflow-y-auto max-h-60 pr-1 space-y-3 custom-scrollbar">
                {submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[220px] text-center">
                    <p className="text-xs text-slate-400 italic">Belum ada tugas yang dikumpulkan.</p>
                  </div>
                ) : (
                  submissions.map((t) => (
                    <div 
                      key={t.id} 
                      className="border border-slate-100 bg-[#F8FAFC] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{t.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#64748B]">
                          <span>PIC: {t.assignee?.name || 'Belum ditugaskan'}</span>
                          <span>•</span>
                          <span>Tipe: {t.type.toUpperCase()}</span>
                          {t.deadline && (
                            <>
                              <span>•</span>
                              <span>Tenggat: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span 
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            t.status === 'DONE' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {t.status === 'DONE' ? 'SELESAI' : 'REVIEW'}
                        </span>

                        {t.proofUrl && (
                          <a
                            href={t.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-[#1B3FAB] hover:underline flex items-center gap-0.5"
                          >
                            Lihat Bukti <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <HRAnalyticsDashboard />
      )}

      {/* Creation task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
};
export default TasksDashboard;

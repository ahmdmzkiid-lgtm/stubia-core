import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../types/tasks.types';
import { TaskCard } from './TaskCard';
import { useAuthStore } from '../../../store/authStore';
import {
  CircleDashed,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (
    taskId: string,
    newStatus: TaskStatus,
    proof?: { name: string; type: string; data: string }
  ) => Promise<void>;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  subtitle: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
  emptyText: string;
  pulse?: boolean;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'TODO',
    title: 'Belum Dikerjakan',
    subtitle: 'Tugas antrean baru',
    headerBg: 'bg-slate-50/80',
    headerBorder: 'border-t-slate-400',
    headerText: 'text-slate-800',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeBg: 'bg-slate-200/80',
    badgeText: 'text-slate-700',
    icon: CircleDashed,
    emptyText: 'Tidak ada tugas antrean di sini 🎉',
  },
  {
    id: 'IN_PROGRESS',
    title: 'Mulai Dikerjakan',
    subtitle: 'Sedang dikerjakan PIC',
    headerBg: 'bg-blue-50/50',
    headerBorder: 'border-t-blue-600',
    headerText: 'text-blue-900',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    icon: Clock,
    emptyText: 'Belum ada tugas yang sedang berjalan',
    pulse: true,
  },
  {
    id: 'REVIEW',
    title: 'Menunggu Review',
    subtitle: 'Perlu verifikasi manager',
    headerBg: 'bg-amber-50/50',
    headerBorder: 'border-t-amber-500',
    headerText: 'text-amber-900',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    icon: AlertCircle,
    emptyText: 'Semua review tugas telah selesai!',
    pulse: true,
  },
  {
    id: 'DONE',
    title: 'Selesai & Disetujui',
    subtitle: 'Tugas rampung diverifikasi',
    headerBg: 'bg-emerald-50/50',
    headerBorder: 'border-t-emerald-500',
    headerText: 'text-emerald-900',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    icon: CheckCircle2,
    emptyText: 'Belum ada tugas yang disetujui',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
}) => {
  const { user } = useAuthStore();
  const isManager = user?.role === 'super_admin' || user?.role === 'academic_manager';

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  
  // Pagination State: Page size (default 4 items per column to keep screen compact)
  const [pageSize, setPageSize] = useState<number>(4);
  const [pages, setPages] = useState<Record<TaskStatus, number>>({
    BACKLOG: 1,
    TODO: 1,
    IN_PROGRESS: 1,
    REVIEW: 1,
    DONE: 1,
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as TaskStatus;
    onStatusChange(draggableId, newStatus);
  };

  // Filter tasks based on search & priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        selectedPriority === 'ALL' || t.priority === selectedPriority;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, selectedPriority]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };

    filteredTasks.forEach((t) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      }
    });

    return grouped;
  }, [filteredTasks]);

  const handlePageChange = (colId: TaskStatus, newPage: number) => {
    setPages((prev) => ({
      ...prev,
      [colId]: newPage,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Board Controls Toolbar */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Cari judul tugas, deskripsi, atau nama PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:bg-white font-medium transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded transition-colors text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter & Page Size Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Filter Chips */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#CBD5E1] p-1 rounded-xl">
            <span className="text-[10px] font-bold text-[#64748B] px-1.5 hidden md:inline flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Prioritas:
            </span>
            {['ALL', 'P1', 'P2', 'P3', 'P4'].map((p) => {
              const isActive = selectedPriority === p;
              const colorClass =
                p === 'P1'
                  ? 'text-rose-600'
                  : p === 'P2'
                  ? 'text-amber-600'
                  : p === 'P3'
                  ? 'text-blue-600'
                  : p === 'P4'
                  ? 'text-slate-600'
                  : 'text-[#0F172A]';

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPriority(p)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white shadow-sm text-[#1B3FAB] border border-[#CBD5E1]'
                      : `${colorClass} hover:bg-slate-200/60`
                  }`}
                >
                  {p === 'ALL' ? 'Semua' : p}
                </button>
              );
            })}
          </div>

          {/* Page size limit */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#64748B] hidden lg:inline flex items-center gap-1">
              <Layers className="h-3 w-3" /> Tampilkan:
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 px-2.5 border border-[#CBD5E1] rounded-xl text-xs bg-white text-[#0F172A] font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3FAB]"
            >
              <option value={3}>3 per kolom</option>
              <option value={4}>4 per kolom</option>
              <option value={6}>6 per kolom</option>
              <option value={8}>8 per kolom</option>
              <option value={-1}>Semua (Scroll)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const columnTasks = groupedTasks[col.id] || [];
            const totalTasks = columnTasks.length;

            // Pagination calculation
            const effectivePageSize = pageSize === -1 ? totalTasks || 1 : pageSize;
            const totalPages = Math.max(1, Math.ceil(totalTasks / effectivePageSize));
            const rawCurrentPage = pages[col.id] || 1;
            const currentPage = Math.min(rawCurrentPage, totalPages);

            // Sliced tasks for current page
            const startIndex = (currentPage - 1) * effectivePageSize;
            const endIndex = startIndex + effectivePageSize;
            const pagedTasks =
              pageSize === -1
                ? columnTasks
                : columnTasks.slice(startIndex, endIndex);

            return (
              <div
                key={col.id}
                className={`bg-white border border-[#CBD5E1] border-t-4 ${col.headerBorder} rounded-2xl shadow-sm flex flex-col min-h-[560px] transition-all duration-200 overflow-hidden`}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-[#E2E8F0] ${col.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-7 w-7 rounded-lg ${col.iconBg} ${col.iconColor} flex items-center justify-center shrink-0 shadow-xs relative`}>
                        <Icon className="h-4 w-4" />
                        {col.pulse && totalTasks > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xs font-bold ${col.headerText} truncate`}>
                          {col.title}
                        </h3>
                        <p className="text-[10px] text-[#64748B] font-medium truncate">
                          {col.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold ${col.badgeBg} ${col.badgeText} px-2.5 py-0.5 rounded-full shrink-0 ml-2 shadow-xs`}>
                      {totalTasks}
                    </span>
                  </div>
                </div>

                {/* Droppable Workspace Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-grow p-3 space-y-3 min-h-[420px] transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50/40 ring-2 ring-blue-300 ring-dashed ring-inset'
                          : 'bg-[#F8FAFC]/50'
                      }`}
                    >
                      {pagedTasks.length === 0 ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/70">
                          <div className={`h-10 w-10 rounded-full ${col.iconBg} ${col.iconColor} flex items-center justify-center mb-2 opacity-60`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-semibold text-[#64748B] max-w-[180px]">
                            {col.emptyText}
                          </p>
                        </div>
                      ) : (
                        pagedTasks.map((task, idx) => {
                          const isDragDisabled = !isManager && task.status === 'DONE';
                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={idx}
                              isDragDisabled={isDragDisabled}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  style={{
                                    ...dragProvided.draggableProps.style,
                                  }}
                                  className={`transition-transform duration-150 ${
                                    dragSnapshot.isDragging
                                      ? 'rotate-1 scale-105 shadow-2xl ring-2 ring-[#1B3FAB] rounded-2xl z-50'
                                      : ''
                                  }`}
                                >
                                  <TaskCard task={task} onStatusChange={onStatusChange} />
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Column Pagination Footer */}
                <div className="p-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between text-xs">
                  <div className="text-[11px] font-semibold text-[#64748B]">
                    {totalTasks > 0 ? (
                      pageSize === -1 ? (
                        <span>{totalTasks} tugas</span>
                      ) : (
                        <span>
                          {startIndex + 1}–{Math.min(endIndex, totalTasks)} dari{' '}
                          <strong className="text-[#0F172A]">{totalTasks}</strong>
                        </span>
                      )
                    ) : (
                      <span>0 tugas</span>
                    )}
                  </div>

                  {pageSize !== -1 && totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePageChange(col.id, Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-7 w-7 rounded-lg border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Halaman sebelumnya"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      {/* Compact Page Number */}
                      <span className="text-[11px] font-bold text-[#0F172A] px-1.5">
                        {currentPage}/{totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => handlePageChange(col.id, Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="h-7 w-7 rounded-lg border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Halaman berikutnya"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;

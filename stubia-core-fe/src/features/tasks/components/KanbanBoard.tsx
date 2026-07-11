import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../types/tasks.types';
import { TaskCard } from './TaskCard';
import { useAuthStore } from '../../../store/authStore';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (
    taskId: string,
    newStatus: TaskStatus,
    proof?: { name: string; type: string; data: string }
  ) => Promise<void>;
}

const COLUMNS: Array<{ id: TaskStatus; title: string; color: string; border: string }> = [
  { id: 'TODO', title: 'Belum Dikerjakan', color: 'bg-slate-50', border: 'border-t-slate-400' },
  { id: 'IN_PROGRESS', title: 'Mulai Dikerjakan', color: 'bg-blue-50/20', border: 'border-t-[#1B3FAB]' },
  { id: 'REVIEW', title: 'Menunggu Review', color: 'bg-amber-50/15', border: 'border-t-amber-400' },
  { id: 'DONE', title: 'Selesai & Disetujui', color: 'bg-emerald-50/15', border: 'border-t-emerald-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
}) => {
  const { user } = useAuthStore();
  const isManager = user?.role === 'super_admin' || user?.role === 'academic_manager';

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as TaskStatus;
    onStatusChange(draggableId, newStatus);
  };

  // Group tasks by status columns
  const groupedTasks: Record<TaskStatus, Task[]> = {
    BACKLOG: [], // unused but satisfies type checks
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };

  tasks.forEach((t) => {
    if (groupedTasks[t.status]) {
      groupedTasks[t.status].push(t);
    }
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`border border-[#CBD5E1] border-t-4 ${col.border} rounded-2xl p-4 shadow-sm flex flex-col min-h-[500px] ${col.color}`}>
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-[#0F172A]">{col.title}</h3>
              <span className="text-[10px] font-extrabold bg-[#CBD5E1]/40 text-[#64748B] px-2 py-0.5 rounded-full shrink-0">
                {groupedTasks[col.id]?.length || 0}
              </span>
            </div>

            {/* Droppable Workspace Area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-grow space-y-3.5 min-h-[450px] transition-colors rounded-xl p-1 ${
                    snapshot.isDraggingOver ? 'bg-[#CBD5E1]/20' : ''
                  }`}
                >
                  {groupedTasks[col.id]?.map((task, idx) => {
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
                            className={`${dragSnapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
                          >
                            <TaskCard task={task} onStatusChange={onStatusChange} />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;

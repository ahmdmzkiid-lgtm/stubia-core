export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskType = 'soal' | 'review' | 'admin' | 'marketing';

export interface TaskTimeLog {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  stoppedAt?: string | null;
  durationSeconds: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority: string;
  deadline?: string | null;
  estimatedHours: number;
  actualHours: number;
  assigneeId?: string | null;
  creatorId: string;
  createdAt: string;
  
  assignee?: { id: string; name: string; email: string; role: string } | null;
  creator?: { id: string; name: string; email: string };
  timeLogs: TaskTimeLog[];
  proofUrl?: string | null;
  proofName?: string | null;
}

export interface HRAnalyticsData {
  hoursPerEmployee: Array<{ name: string; hours: number }>;
  taskVolumeByStatus: Array<{ name: string; value: number }>;
  avgCompletionVelocity: Array<{ name: string; days: number }>;
  averageCompletionDays: number;
}

export interface Document {
  id: string;
  name: string;
  folderPath: string; // SOP, Legal, Kontrak, Internal
  fileUrl: string;
  fileType: string;
  version: number;
  uploadedById: string;
  uploadedBy?: { id: string; name: string; email: string };
  createdAt: string;
}

export interface DocumentAccessLog {
  id: string;
  action: string;
  accessedAt: string;
  document?: { name: string; folderPath: string };
  user?: { name: string; email: string };
}

export interface VisionMission {
  vision: string;
  mission: string;
  coreValues: string;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  currentVal: number;
  targetVal: number;
  unit: string;
  createdAt: string;
}

export interface Objective {
  id: string;
  title: string;
  targetDate: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
  progress: number;
  keyResults: KeyResult[];
  createdAt: string;
}

export type EventType = 'TRYOUT' | 'INTERNAL' | 'MARKETING';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  description?: string;
  status: string;
  picId: string;
  pic?: { id: string; name: string; email: string };
  tasks?: Array<{ id: string; title: string; status: string }>;
  createdAt: string;
}

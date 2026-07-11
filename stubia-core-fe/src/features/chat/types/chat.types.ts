export interface ChatParticipant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'GLOBAL' | 'DEPARTMENT' | 'PERSONAL';
  department: string | null;
  createdAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

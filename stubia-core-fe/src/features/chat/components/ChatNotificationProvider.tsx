/**
 * ChatNotificationProvider — global real-time chat listener.
 *
 * Mounts once at the app level after login. Subscribes to ALL chat rooms
 * the user is part of. Shows toast + plays sound whenever a new message
 * arrives in a room other than the one currently open.
 */
import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { chatApi } from '../api/chatApi';
import { getChatSocket } from '../socket/chatSocket';
import { notificationSound } from '../../../utils/notificationSound';
import { MessageSquare } from 'lucide-react';

interface ChatNotificationProviderProps {
  children: React.ReactNode;
  activeRoomId?: string | null; // currently open room — don't toast for its own messages
}

export const ChatNotificationProvider: React.FC<ChatNotificationProviderProps> = ({
  children,
  activeRoomId,
}) => {
  const { user } = useAuthStore();
  const joinedRooms = useRef<Set<string>>(new Set());
  const activeRoomRef = useRef<string | null>(activeRoomId ?? null);

  // Keep the ref in sync with the prop (avoids stale closure)
  useEffect(() => {
    activeRoomRef.current = activeRoomId ?? null;
  }, [activeRoomId]);

  useEffect(() => {
    if (!user) return;

    const socket = getChatSocket();

    // Join all accessible rooms for global notifications
    const joinAllRooms = async () => {
      try {
        const rooms = await chatApi.getRooms();
        rooms.forEach((room) => {
          if (!joinedRooms.current.has(room.id)) {
            socket.emit('join_room', room.id);
            joinedRooms.current.add(room.id);
          }
        });
      } catch {
        // ignore
      }
    };

    socket.on('connect', () => {
      joinAllRooms();
    });

    // If already connected, join immediately
    if (socket.connected) {
      joinAllRooms();
    }

    // Listen for messages from ALL rooms
    const handleNewMessage = (message: {
      id: string;
      roomId: string;
      content: string;
      senderId: string;
      sender: { name: string; role: string };
    }) => {
      // Don't notify for own messages
      if (message.senderId === user.id) return;

      // Don't show toast if already in the active room (ChatWindow handles it)
      if (message.roomId === activeRoomRef.current) return;

      // Play notification sound
      notificationSound.notifyChime();

      // Show custom toast notification
      toast.custom(
        (t) => (
          <div
            className={`flex items-start gap-3 bg-white border border-[#CBD5E1] rounded-xl shadow-xl px-4 py-3 min-w-[260px] max-w-sm cursor-pointer transition-all ${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
            onClick={() => toast.dismiss(t.id)}
          >
            <div className="h-8 w-8 rounded-full bg-[#1B3FAB]/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-[#1B3FAB]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-[#0F172A] truncate">{message.sender.name}</p>
              <p className="text-[11px] font-semibold text-[#64748B] truncate mt-0.5">{message.content}</p>
            </div>
            <span className="text-[9px] text-[#94A3B8] font-bold shrink-0">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right',
        }
      );
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('connect');
    };
  }, [user]);

  return <>{children}</>;
};

export default ChatNotificationProvider;

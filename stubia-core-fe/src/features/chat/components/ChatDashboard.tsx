import React, { useEffect, useState } from 'react';
import { ChatRoom } from '../types/chat.types';
import { chatApi } from '../api/chatApi';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatNotificationProvider } from './ChatNotificationProvider';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async (autoSelectFirst = true) => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
      if (autoSelectFirst && data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(data[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat saluran chat.');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await chatApi.getActiveUsers();
      setActiveUsers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const initData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRooms(false), fetchUsers()]);
    setIsLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      localStorage.setItem('chat-active-room-id', selectedRoomId);
    } else {
      localStorage.removeItem('chat-active-room-id');
    }
    return () => {
      localStorage.removeItem('chat-active-room-id');
    };
  }, [selectedRoomId]);

  const handleStartPersonalChat = async (targetUserId: string) => {
    try {
      const room = await chatApi.initiatePersonalChat(targetUserId);
      setSelectedRoomId(room.id);
      fetchRooms(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulai chat personal.');
    }
  };

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]" />
        <p className="mt-3 text-xs font-semibold text-[#64748B] animate-pulse">Menghubungkan ke pusat chat...</p>
      </div>
    );
  }

  return (
    // ChatNotificationProvider wraps the dashboard so it knows the active room
    // and can suppress toasts for messages the user already sees
    <ChatNotificationProvider activeRoomId={selectedRoomId}>
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Sidebar (30%) */}
          <div className={`lg:col-span-3 ${selectedRoomId ? 'hidden lg:block' : 'block'}`}>
            <ChatSidebar
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
              activeUsers={activeUsers}
              onStartPersonalChat={handleStartPersonalChat}
              onRoomsRefresh={() => fetchRooms(false)}
            />
          </div>

          {/* Chat window (70%) */}
          <div className={`lg:col-span-7 ${!selectedRoomId ? 'hidden lg:block' : 'block'}`}>
            {activeRoom ? (
              <ChatWindow room={activeRoom} onBack={() => setSelectedRoomId(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-[#CBD5E1] rounded-2xl h-[600px] shadow-sm text-slate-400">
                <div className="h-16 w-16 rounded-2xl bg-[#1B3FAB]/5 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-[#1B3FAB]/40 animate-pulse" />
                </div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">Silakan Pilih Percakapan</h4>
                <p className="text-xs text-[#64748B] mt-1.5 max-w-[240px]">
                  Pilih grup departemen atau ketuk tombol "+" untuk memulai direct message personal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatNotificationProvider>
  );
};

export default ChatDashboard;

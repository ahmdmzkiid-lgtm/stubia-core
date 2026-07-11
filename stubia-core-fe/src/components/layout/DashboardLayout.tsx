import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../features/chat/api/chatApi';
import { getChatSocket } from '../../features/chat/socket/chatSocket';
import { tasksApi } from '../../features/tasks/api/tasksApi';
import { notificationSound } from '../../utils/notificationSound';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  link: string;
  read: boolean;
}

export const DashboardLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('global-notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    localStorage.setItem('global-notifications', JSON.stringify(updated));
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('global-notifications', JSON.stringify(updated));
    toast.success('Semua notifikasi ditandai dibaca');
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.setItem('global-notifications', JSON.stringify([]));
    toast.success('Riwayat notifikasi dibersihkan');
  };

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check task deadlines periodically
  useEffect(() => {
    if (!user) return;

    const checkDeadlines = async () => {
      try {
        const tasks = await tasksApi.getTasks();
        const now = Date.now();
        const notifiedTasksStr = localStorage.getItem('notified-deadline-tasks') || '[]';
        const notifiedTasks: string[] = JSON.parse(notifiedTasksStr);
        const newNotified: string[] = [...notifiedTasks];

        tasks.forEach((task) => {
          if (task.status === 'DONE' || task.status === 'REVIEW') return;
          if (!task.deadline) return;

          const deadlineTime = new Date(task.deadline).getTime();
          const timeLeftHours = (deadlineTime - now) / (1000 * 60 * 60);

          if (timeLeftHours > 0 && timeLeftHours <= 24 && !notifiedTasks.includes(task.id)) {
            // Trigger native OS push notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Tenggat Tugas Mendekati Akhir', {
                body: `Tugas "${task.title}" harus diselesaikan dalam waktu kurang dari 24 jam!`,
                icon: '/icons/icon-192.png',
              });
            }

            // Add to local notification bell
            setNotifications((prev) => {
              const newItem: NotificationItem = {
                id: `${Date.now()}-${Math.random()}`,
                title: 'Tenggat Tugas Dekat',
                desc: `Tugas "${task.title}" akan berakhir dalam ${Math.round(timeLeftHours)} jam!`,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                link: '/tasks',
                read: false,
              };
              const updated = [newItem, ...prev].slice(0, 20);
              localStorage.setItem('global-notifications', JSON.stringify(updated));
              return updated;
            });

            newNotified.push(task.id);
          }
        });

        if (newNotified.length !== notifiedTasks.length) {
          localStorage.setItem('notified-deadline-tasks', JSON.stringify(newNotified));
        }
      } catch (err) {
        console.error('Failed to check task deadlines:', err);
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const socket = getChatSocket();

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

    if (socket.connected) {
      joinAllRooms();
    }

    const handleNewMessage = (message: {
      id: string;
      roomId: string;
      content: string;
      senderId: string;
      sender: { name: string; role: string };
    }) => {
      if (message.senderId === user.id) return;

      // Don't notify if we are inside the chat room
      const activeRoomId = localStorage.getItem('chat-active-room-id');
      if (message.roomId === activeRoomId && window.location.pathname === '/chat') return;

      // Play sound
      notificationSound.notifyChime();

      // Show toast
      toast.custom(
        (t) => (
          <div
            className={`flex items-start gap-3 bg-white border border-[#CBD5E1] rounded-xl shadow-xl px-4 py-3 min-w-[260px] max-w-sm cursor-pointer transition-all ${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            } z-50`}
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
          duration: 4000,
          position: 'top-right',
        }
      );

      // Show native OS push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Pesan dari ${message.sender.name}`, {
          body: message.content,
          icon: '/icons/icon-192.png',
        });
      }

      // Add to notifications list
      setNotifications((prev) => {
        const newItem: NotificationItem = {
          id: `${Date.now()}-${Math.random()}`,
          title: message.sender.name,
          desc: message.content,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          link: '/chat',
          read: false,
        };
        const updated = [newItem, ...prev].slice(0, 20); // Keep max 20 notifications
        localStorage.setItem('global-notifications', JSON.stringify(updated));
        return updated;
      });
    };

    socket.on('new_message', handleNewMessage);

    // Refresh rooms periodically (e.g. every 60s) to join new rooms
    const interval = setInterval(joinAllRooms, 60000);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('connect');
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex relative">
      {/* Collapsible Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-20 md:hidden backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Main Content Area Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          isCollapsed ? 'md:pl-16' : 'md:pl-60'
        } pl-0`}
      >
        {/* Topbar navigation */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'md:left-16' : 'md:left-60'} left-0`}>
          <Topbar 
            isCollapsed={isCollapsed} 
            onMenuClick={() => setIsMobileOpen(!isMobileOpen)} 
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={handleMarkAsRead}
            onMarkAllRead={handleMarkAllRead}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Page Inner Container */}
        <main className="flex-1 p-4 md:p-6 mt-14 overflow-y-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

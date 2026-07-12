import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Bell, User as UserIcon, Menu } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  link: string;
  read: boolean;
}

interface TopbarProps {
  isCollapsed: boolean;
  onMenuClick?: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  isCollapsed, 
  onMenuClick,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll
}) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          toast.success('Notifikasi berhasil diaktifkan!');
          window.dispatchEvent(new CustomEvent('sync-push-subscription'));
        } else if (permission === 'denied') {
          toast.error('Izin notifikasi ditolak. Harap aktifkan di pengaturan browser.');
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  const getBreadcrumb = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Beranda';
    
    // Capitalize and clean up path segment
    return path
      .split('/')
      .map(segment => segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .join(' / ');
  };

  return (
    <header className={`h-14 bg-white border-b border-[#CBD5E1] flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 z-20 transition-all duration-300 left-0 ${
      isCollapsed ? 'md:left-16' : 'md:left-60'
    }`}>
      {/* Breadcrumbs / Mobile Menu Toggle */}
      <div className="flex items-center space-x-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors mr-1 shrink-0"
          title="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs font-semibold text-[#64748B] hover:text-[#1B3FAB] transition-colors cursor-pointer hidden sm:inline shrink-0">
          Stubia Core
        </span>
        <span className="text-xs text-[#CBD5E1] hidden sm:inline shrink-0">/</span>
        <h1 className="text-sm font-bold text-[#0F172A] truncate max-w-[150px] sm:max-w-none">
          {getBreadcrumb()}
        </h1>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Enable Notification Button (For iOS/Android Mobile click-gesture requirement) */}
        {typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default' && (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all rounded-lg text-[10px] font-extrabold shadow-sm shrink-0"
            title="Aktifkan Notifikasi di HP Anda"
          >
            <Bell className="h-3.5 w-3.5 animate-bounce text-amber-600" />
            <span className="hidden sm:inline">Aktifkan Notifikasi</span>
            <span className="sm:hidden">Aktifkan</span>
          </button>
        )}

        {/* Notifications Bell Dropdown container */}
        <div className="relative">
          {/* Notifications Bell Button */}
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative text-[#64748B] hover:text-[#1B3FAB] transition-colors p-1.5 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center"
            title="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[8px] font-bold border border-white shrink-0 scale-90">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#CBD5E1] rounded-2xl shadow-xl z-50 text-xs font-bold text-slate-800 divide-y divide-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 flex items-center justify-between bg-slate-50/50">
                <span className="font-extrabold text-[#0F172A]">Notifikasi</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      onMarkAllRead();
                      setIsDropdownOpen(false);
                    }}
                    className="text-[10px] text-[#1B3FAB] hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-semibold italic">
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        onMarkRead(n.id);
                        setIsDropdownOpen(false);
                        navigate(n.link);
                      }}
                      className={`p-3.5 flex gap-2.5 hover:bg-slate-50/30 cursor-pointer transition-colors ${!n.read ? 'bg-[#1B3FAB]/3' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-full bg-[#1B3FAB]/10 text-[#1B3FAB] flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-3 py-2 bg-slate-50/50 text-center">
                  <button 
                    onClick={() => {
                      onClearAll();
                      setIsDropdownOpen(false);
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-extrabold"
                  >
                    Hapus Semua Riwayat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 pl-2 sm:pl-3 border-l border-[#CBD5E1]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#0F172A] leading-tight">
              {user?.name}
            </p>
            <p className="text-xs font-semibold text-[#64748B] capitalize">
              {user?.role.replace('_', ' ')}
            </p>
          </div>

          <div className="h-9 w-9 bg-[#1B3FAB]/10 text-[#1B3FAB] rounded-full flex items-center justify-center font-bold text-sm border border-[#1B3FAB]/20 shrink-0">
            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>
        </div>
      </div>
    </header>
  );
};

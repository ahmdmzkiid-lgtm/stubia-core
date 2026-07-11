import React, { useState } from 'react';
import { ChatRoom } from '../types/chat.types';
import { chatAdminApi } from '../api/chatAdminApi';
import {
  Search,
  MessageSquarePlus,
  Users,
  Settings,
  UserPlus,
  Trash2,
  MoreVertical,
  CircleDot,
  CheckCheck,
  Pin
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  activeUsers: Array<{ id: string; name: string; email: string; role: string }>;
  onStartPersonalChat: (targetUserId: string) => void;
  onRoomsRefresh: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  academic_manager: 'Academic Mgr',
  content_creator: 'Content Creator',
  hr_ops: 'HR & Ops',
  finance_officer: 'Finance',
};

// Generates consistent background colors for avatars based on user name
const getAvatarBg = (name: string) => {
  const colors = [
    'bg-red-500 text-white',
    'bg-blue-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-indigo-500 text-white',
    'bg-purple-500 text-white',
    'bg-pink-500 text-white',
    'bg-teal-500 text-white',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  activeUsers,
  onStartPersonalChat,
  onRoomsRefresh,
}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin';

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [managingRoomId, setManagingRoomId] = useState<string | null>(null);
  const [addUserDropdown, setAddUserDropdown] = useState(false);
  
  // WhatsApp Filters
  const [activeTab, setActiveTab] = useState<'all' | 'group' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [pinnedRoomIds, setPinnedRoomIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('chat-pinned-rooms');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleTogglePin = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let updated: string[];
    if (pinnedRoomIds.includes(roomId)) {
      updated = pinnedRoomIds.filter(id => id !== roomId);
      toast.success('Chat dilepas pin');
    } else {
      if (pinnedRoomIds.length >= 3) {
        toast.error('Maksimal sematkan 3 chat!');
        return;
      }
      updated = [...pinnedRoomIds, roomId];
      toast.success('Chat disematkan');
    }
    
    setPinnedRoomIds(updated);
    localStorage.setItem('chat-pinned-rooms', JSON.stringify(updated));
  };

  const managingRoom = rooms.find((r) => r.id === managingRoomId);

  const getPartnerName = (room: ChatRoom) => {
    const partner = room.participants.find((p) => p.userId !== user?.id);
    return partner ? partner.user.name : room.name || 'Chat Personal';
  };

  const getPartnerRole = (room: ChatRoom) => {
    const partner = room.participants.find((p) => p.userId !== user?.id);
    return partner ? ROLE_LABELS[partner.user.role] || partner.user.role : '';
  };

  const handleAddToGroup = async (roomId: string, userId: string) => {
    try {
      await chatAdminApi.addParticipant(roomId, userId);
      toast.success('Peserta berhasil ditambahkan!');
      onRoomsRefresh();
      setAddUserDropdown(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan peserta');
    }
  };

  const handleRemoveFromGroup = async (roomId: string, targetUserId: string, name: string) => {
    if (!confirm(`Hapus ${name} dari grup ini?`)) return;
    try {
      await chatAdminApi.removeParticipant(roomId, targetUserId);
      toast.success(`${name} dihapus dari grup`);
      onRoomsRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus peserta');
    }
  };

  const nonParticipants = (room: ChatRoom) =>
    activeUsers.filter((u) => !room.participants.some((p) => p.userId === u.id) && u.id !== user?.id);

  // Filter rooms based on activeTab and searchQuery
  const filteredRooms = rooms.filter((room) => {
    // 1. Tab filter
    if (activeTab === 'group' && room.type === 'PERSONAL') return false;
    if (activeTab === 'personal' && room.type !== 'PERSONAL') return false;

    // 2. Search query filter
    const nameToSearch = room.type === 'PERSONAL' ? getPartnerName(room) : room.name || '';
    return nameToSearch.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getRoomTime = (r: ChatRoom) => {
    const lastMsg = r.messages?.[0];
    return lastMsg ? new Date(lastMsg.createdAt).getTime() : new Date(r.createdAt || 0).getTime();
  };

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aPinned = pinnedRoomIds.includes(a.id);
    const bPinned = pinnedRoomIds.includes(b.id);
    
    if (aPinned && bPinned) {
      return pinnedRoomIds.indexOf(a.id) - pinnedRoomIds.indexOf(b.id);
    }
    if (aPinned) return -1;
    if (bPinned) return 1;
    
    return getRoomTime(b) - getRoomTime(a);
  });

  return (
    <div className="bg-[#FFFFFF] border border-[#E9EDF0] rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
      
      {/* ── WhatsApp Header Bar ── */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-[#E9EDF0] shrink-0">
        {/* User avatar and profile icon */}
        <div className="flex items-center gap-2">
          <div className={`h-9 w-9 rounded-full ${getAvatarBg(user?.name || '')} flex items-center justify-center font-extrabold text-sm shadow-sm`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="leading-none">
            <p className="text-xs font-bold text-[#111B21]">{user?.name}</p>
            <p className="text-[9px] text-[#667781] font-semibold mt-0.5">{ROLE_LABELS[user?.role || ''] || user?.role}</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-[#54656F]">
          <button
            type="button"
            className="h-9 w-9 hover:bg-[#D9DBD9]/40 rounded-full flex items-center justify-center transition-colors"
            title="Status"
          >
            <CircleDot className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewChatOpen(!isNewChatOpen)}
            className={`h-9 w-9 hover:bg-[#D9DBD9]/40 rounded-full flex items-center justify-center transition-colors ${
              isNewChatOpen ? 'bg-[#D9DBD9]/50 text-[#00A884]' : ''
            }`}
            title="Mulai Chat Baru"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="h-9 w-9 hover:bg-[#D9DBD9]/40 rounded-full flex items-center justify-center transition-colors"
            title="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Search Input (WhatsApp Style) ── */}
      <div className="px-3 py-2 bg-white border-b border-[#E9EDF0] shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#667781]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari atau mulai chat baru"
            className="w-full h-9 pl-10 pr-4 bg-[#F0F2F5] rounded-lg text-xs font-semibold text-[#111B21] placeholder-[#667781] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00A884]"
          />
        </div>
      </div>

      {/* ── Category Tabs (WhatsApp Style Filters) ── */}
      <div className="px-3 py-2 bg-white flex gap-2 shrink-0 border-b border-[#F0F2F5]">
        {(['all', 'personal', 'group'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeTab === tab
                ? 'bg-[#E7F8F5] text-[#008069]'
                : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDF0]'
            }`}
          >
            {tab === 'all' ? 'Semua' : tab === 'personal' ? 'Personal' : 'Grup'}
          </button>
        ))}
      </div>

      {/* ── DM / New Chat Picker ── */}
      {isNewChatOpen && (
        <div className="mx-3 my-2 bg-[#F8FAFC] border border-[#00A884]/20 rounded-xl p-3 max-h-[160px] overflow-y-auto shrink-0 shadow-inner">
          <p className="text-[9px] font-extrabold text-[#008069] uppercase tracking-wider mb-2">Pilih Rekan Kerja untuk Chat</p>
          {activeUsers.length === 0 ? (
            <p className="text-[10px] text-[#667781] italic">Tidak ada user aktif lain.</p>
          ) : (
            <div className="space-y-1">
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onStartPersonalChat(u.id);
                    setIsNewChatOpen(false);
                  }}
                  className="w-full text-left text-xs font-bold px-2.5 py-2 rounded-lg hover:bg-white text-slate-700 flex items-center justify-between transition-colors shadow-sm border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full ${getAvatarBg(u.name)} flex items-center justify-center text-[9px] font-black shrink-0`}>
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span>{u.name}</span>
                  </div>
                  <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">{ROLE_LABELS[u.role] || u.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scrollable Chat List (WhatsApp Style) ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F0F2F5] bg-white">
        {sortedRooms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#667781]">
            <p className="text-xs font-semibold">Tidak ada chat ditemukan.</p>
          </div>
        ) : (
          sortedRooms.map((room) => {
            const active = selectedRoomId === room.id;
            const isManaging = managingRoomId === room.id;
            const lastMsg = room.messages?.[0];
            const isPersonal = room.type === 'PERSONAL';

            const chatTitle = isPersonal ? getPartnerName(room) : room.name || 'Grup';
            const subtitle = isPersonal ? getPartnerRole(room) : room.type === 'GLOBAL' ? 'Grup Umum' : `Departemen ${room.department}`;

            return (
              <div key={room.id} className="relative">
                <div
                  className={`flex items-center transition-colors cursor-pointer pr-3 ${
                    active ? 'bg-[#F0F2F5]' : 'hover:bg-[#F0F2F5]/60'
                  }`}
                >
                  {/* Left click area */}
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    className="flex-1 text-left p-3.5 flex items-center gap-3 min-w-0"
                  >
                    {/* Avatar icon */}
                    <div className="shrink-0 relative">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm ${
                        isPersonal ? getAvatarBg(chatTitle) : 'bg-[#00A884]/15 text-[#008069]'
                      }`}>
                        {isPersonal ? chatTitle.charAt(0).toUpperCase() : <Users className="h-5 w-5" />}
                      </div>
                      {/* Sub-badge indicating group vs personal */}
                      {!isPersonal && (
                        <span className="absolute bottom-0 right-0 h-4 w-4 bg-[#00A884] rounded-full border border-white flex items-center justify-center">
                          <Users className="h-2 w-2 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Chat details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h5 className="text-sm font-bold text-[#111B21] truncate">{chatTitle}</h5>
                        {lastMsg && (
                          <span className="text-[10px] text-[#667781] font-semibold shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Info / Subtitle / Last message preview */}
                      <p className="text-[10px] text-[#667781] font-bold truncate mt-0.5">{subtitle}</p>
                      
                      {lastMsg ? (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-[#667781] min-w-0">
                          {lastMsg.senderId === user?.id && (
                            <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] shrink-0" />
                          )}
                          <span className="truncate flex-1">
                            {lastMsg.senderId !== user?.id && <span className="font-semibold text-slate-700">{lastMsg.sender?.name}: </span>}
                            {lastMsg.content}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#667781]/60 italic mt-1">Belum ada pesan</p>
                      )}
                    </div>
                  </button>

                  {/* Pin/Unpin chat button */}
                  <button
                    type="button"
                    onClick={(e) => handleTogglePin(room.id, e)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      pinnedRoomIds.includes(room.id)
                        ? 'text-[#008069] bg-[#E7F8F5]'
                        : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                    }`}
                    title={pinnedRoomIds.includes(room.id) ? 'Lepas Sematkan' : 'Sematkan Chat (Maks 3)'}
                  >
                    <Pin className={`h-4 w-4 transition-transform ${pinnedRoomIds.includes(room.id) ? 'fill-[#008069] rotate-45' : ''}`} />
                  </button>

                  {/* WhatsApp Admin Manage Group Settings button */}
                  {!isPersonal && isAdmin && (
                    <button
                      type="button"
                      onClick={() => setManagingRoomId(isManaging ? null : room.id)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ml-1 ${
                        isManaging ? 'bg-[#00A884] text-white' : 'hover:bg-[#D9DBD9]/40 text-[#54656F]'
                      }`}
                      title="Kelola Peserta Grup"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* ── WhatsApp Style Group Member Panel ── */}
                {!isPersonal && isAdmin && isManaging && managingRoom && (
                  <div className="bg-[#F8FAFC] border-y border-[#E9EDF0] px-4 py-3 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold text-[#008069] uppercase tracking-wider">
                        Anggota ({managingRoom.participants.length})
                      </p>
                      
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAddUserDropdown(!addUserDropdown)}
                          className="flex items-center gap-1 text-[10px] font-extrabold text-[#008069] hover:underline"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Tambah
                        </button>
                        
                        {addUserDropdown && (
                          <div className="absolute right-0 top-6 z-20 bg-white border border-[#E9EDF0] rounded-xl shadow-lg w-48 max-h-40 overflow-y-auto">
                            {nonParticipants(managingRoom).length === 0 ? (
                              <p className="text-[9px] text-slate-400 p-3 italic">Semua user sudah di grup.</p>
                            ) : (
                              nonParticipants(managingRoom).map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleAddToGroup(managingRoom.id, u.id)}
                                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-slate-50 flex items-center justify-between border-b border-[#F0F2F5]"
                                >
                                  <span className="truncate">{u.name}</span>
                                  <span className="text-[8px] text-slate-400 shrink-0 ml-1">
                                    {ROLE_LABELS[u.role]?.split(' ')[0]}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {managingRoom.participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-5 w-5 rounded-full ${getAvatarBg(p.user.name)} flex items-center justify-center text-[8px] font-black`}>
                              {p.user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-[#111B21] truncate max-w-[120px]">
                              {p.user.name}
                            </span>
                            <span className="text-[8px] text-slate-400 font-semibold">
                              {ROLE_LABELS[p.user.role]?.split(' ')[0]}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveFromGroup(managingRoom.id, p.userId, p.user.name)}
                            className="h-6 w-6 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
                            title="Hapus dari grup"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;

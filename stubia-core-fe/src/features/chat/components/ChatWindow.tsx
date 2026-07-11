import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChatRoom, ChatMessage } from '../types/chat.types';
import { chatApi } from '../api/chatApi';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/shared/Button';
import {
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  Search,
  CheckCheck,
  MessageSquare,
  Users,
  Image,
  File,
  Download,
  Palette,
  FileText,
  ChevronDown,
  Copy,
  Edit3,
  Trash,
  X,
  ArrowLeft
} from 'lucide-react';
import { getChatSocket } from '../socket/chatSocket';
import { notificationSound } from '../../../utils/notificationSound';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  room: ChatRoom;
  onBack?: () => void;
}

// Background Theme Presets
const THEMES = [
  { id: 'light', name: 'Terang / Light', bg: 'bg-[#F8FAFC]', text: 'text-[#111B21]', isDark: false },
  { id: 'cream', name: 'Krem / Cream', bg: 'bg-[#FDFBF7]', text: 'text-[#111B21]', isDark: false },
  { id: 'dark', name: 'Gelap / Dark', bg: 'bg-[#0B141A]', text: 'text-white', isDark: true },
  { id: 'mint', name: 'Mint Green', bg: 'bg-[#E1F2E8]', text: 'text-[#111B21]', isDark: false },
  { id: 'sky', name: 'Sky Blue', bg: 'bg-[#E0F2FE]', text: 'text-[#111B21]', isDark: false },
  { id: 'lavender', name: 'Lavender', bg: 'bg-[#F3E8FF]', text: 'text-[#111B21]', isDark: false },
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

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
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ room, onBack }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Attachment & Theme state
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('chat-theme') || 'light');

  // Edit / Delete states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [localDeletedMessageIds, setLocalDeletedMessageIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`chat-deleted-for-me-${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevRoomId = useRef<string | null>(null);

  const fetchMessages = useCallback(async (rid: string) => {
    setIsLoading(true);
    try {
      const data = await chatApi.getMessages(rid);
      setMessages(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pesan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(room.id);
    inputRef.current?.focus();
    setActiveMenuMessageId(null);
    setEditingMessageId(null);
  }, [room.id, fetchMessages]);

  useEffect(() => {
    const socket = getChatSocket();
    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join_room', room.id);
    };
    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId !== user?.id) {
        notificationSound.chatPing();
      }
    };

    const handleMessageUpdated = (message: ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const handleMessageDeleted = (payload: { id: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== payload.id));
    };

    if (prevRoomId.current && prevRoomId.current !== room.id) {
      socket.emit('leave_room', prevRoomId.current);
    }
    prevRoomId.current = room.id;

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join_room', room.id);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [room.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (contentStr: string) => {
    if (!contentStr.trim() || isSending) return;
    setIsSending(true);
    try {
      if (editingMessageId) {
        // Edit flow
        const updated = await chatApi.updateMessage(editingMessageId, contentStr.trim());
        setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? updated : m)));
        setEditingMessageId(null);
        toast.success('Pesan diubah');
      } else {
        // Send new message flow
        await chatApi.sendMessage(room.id, contentStr.trim());
        notificationSound.sentClick();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pesan.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSend(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e as any);
    }
  };

  // Switch Chat Theme
  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('chat-theme', themeId);
    setIsThemeOpen(false);
    toast.success(`Tema latar belakang diganti!`);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAttachOpen(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const contentPayload = `[IMAGE]${file.name}|${base64}`;
      await handleSend(contentPayload);
    };
    reader.readAsDataURL(file);
  };

  // Document Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAttachOpen(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const contentPayload = `[FILE]${file.name}|${sizeMb} MB|${base64}`;
      await handleSend(contentPayload);
    };
    reader.readAsDataURL(file);
  };

  // Message menu option actions
  const handleCopyMessage = (text: string) => {
    // Strip metadata prefixes if copying files
    const cleanText = text.startsWith('[IMAGE]') || text.startsWith('[FILE]')
      ? text.replace(/\[IMAGE\]|\[FILE\]/g, '').split('|')[0]
      : text;
    navigator.clipboard.writeText(cleanText);
    toast.success('Pesan disalin ke clipboard');
    setActiveMenuMessageId(null);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    if (msg.content.startsWith('[IMAGE]') || msg.content.startsWith('[FILE]')) {
      toast.error('Media tidak dapat diedit');
      return;
    }
    setEditingMessageId(msg.id);
    setInputText(msg.content);
    setActiveMenuMessageId(null);
    inputRef.current?.focus();
  };

  const handleDeleteForMe = (messageId: string) => {
    const updated = [...localDeletedMessageIds, messageId];
    setLocalDeletedMessageIds(updated);
    localStorage.setItem(`chat-deleted-for-me-${user?.id}`, JSON.stringify(updated));
    toast.success('Pesan dihapus untuk Anda');
    setActiveMenuMessageId(null);
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (!confirm('Hapus pesan ini untuk semua orang?')) return;
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Pesan dihapus untuk semua orang');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pesan');
    } finally {
      setActiveMenuMessageId(null);
    }
  };

  // Custom Bubble Renderer for Photos and Files
  const renderMessageContent = (msg: ChatMessage) => {
    const text = msg.content;

    if (text.startsWith('[IMAGE]')) {
      const parts = text.replace('[IMAGE]', '').split('|');
      const filename = parts[0];
      const base64Data = parts[1] || '';
      return (
        <div className="space-y-1 mt-1">
          <img
            src={base64Data}
            alt={filename}
            className="rounded-lg max-w-[240px] max-h-[180px] object-cover shadow-sm border border-slate-100 hover:opacity-95 cursor-zoom-in"
            onClick={() => {
              const w = window.open();
              w?.document.write(`<img src="${base64Data}" style="max-width:100%; height:auto;" />`);
            }}
          />
          <p className="text-[10px] text-slate-400 italic truncate max-w-[240px]">{filename}</p>
        </div>
      );
    }

    if (text.startsWith('[FILE]')) {
      const parts = text.replace('[FILE]', '').split('|');
      const filename = parts[0];
      const sizeStr = parts[1] || '';
      const base64Data = parts[2] || '';
      return (
        <div className="flex items-center gap-3 bg-black/5 rounded-lg p-2.5 mt-1 border border-black/10 max-w-[280px]">
          <div className="h-9 w-9 rounded-lg bg-red-500 flex items-center justify-center text-white shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-[#111B21]">{filename}</p>
            <p className="text-[10px] text-[#667781] font-semibold">{sizeStr}</p>
          </div>
          <a
            href={base64Data}
            download={filename}
            className="h-8 w-8 hover:bg-black/10 rounded-full flex items-center justify-center text-[#54656F] transition-colors shrink-0"
            title="Download Dokumen"
          >
            <Download className="h-4.5 w-4.5" />
          </a>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  };

  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];
  const getRoomTitle = () => {
    if (room.type === 'PERSONAL') {
      const partner = room.participants.find((p) => p.userId !== user?.id);
      return partner ? partner.user.name : room.name || 'Chat Personal';
    }
    return room.name || 'Grup Chat';
  };

  const getPartnerDetails = () => {
    if (room.type === 'PERSONAL') {
      const partner = room.participants.find((p) => p.userId !== user?.id);
      if (partner) return partner.user.role.replace(/_/g, ' ').toUpperCase();
    }
    if (room.type === 'GLOBAL') return 'Semua Karyawan';
    if (room.type === 'DEPARTMENT') return `Departemen: ${(room.department || '').toUpperCase()}`;
    return room.type;
  };

  // Filter out messages that the current user deleted "for me"
  const visibleMessages = messages.filter((m) => !localDeletedMessageIds.includes(m.id));

  return (
    <div className={`flex flex-col h-[600px] ${currentTheme.bg} border border-[#E9EDF0] rounded-2xl shadow-sm overflow-hidden relative transition-all duration-300`}>
      {/* Hidden File Inputs */}
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" />

      {/* ── Chat Header Bar ── */}
      <div className="bg-[#F0F2F5] text-[#111B21] px-4 py-3 flex items-center justify-between border-b border-[#E9EDF0] shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 hover:bg-black/5 rounded-lg text-slate-700 transition-colors shrink-0 -ml-1 mr-0.5"
              title="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm ${
            room.type === 'PERSONAL' ? getAvatarBg(getRoomTitle()) : 'bg-[#00A884]/10 text-[#008069]'
          }`}>
            {room.type === 'PERSONAL' ? getRoomTitle().charAt(0).toUpperCase() : <Users className="h-5 w-5" />}
          </div>

          <div className="leading-none min-w-0">
            <h4 className="text-sm font-extrabold truncate">{getRoomTitle()}</h4>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
              <p className="text-[10px] text-[#667781] font-semibold truncate">
                {getPartnerDetails()} • {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3.5 text-[#54656F] relative">
          {/* Theme switcher palette trigger */}
          <button
            type="button"
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className={`hover:text-[#008069] transition-colors ${isThemeOpen ? 'text-[#008069]' : ''}`}
            title="Ubah Latar Belakang Chat"
          >
            <Palette className="h-4.5 w-4.5" />
          </button>
          
          {/* Theme dropdown */}
          {isThemeOpen && (
            <div className="absolute right-8 top-8 z-30 bg-white border border-[#E9EDF0] rounded-xl shadow-xl p-2 w-48 text-xs font-bold text-[#111B21]">
              <p className="px-3 py-1.5 border-b border-[#F0F2F5] text-[9px] text-[#667781] uppercase tracking-wider">Latar Belakang Chat</p>
              <div className="space-y-0.5 mt-1">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-[#F0F2F5] flex items-center justify-between ${
                      activeTheme === theme.id ? 'bg-[#E7F8F5] text-[#008069]' : ''
                    }`}
                  >
                    <span>{theme.name}</span>
                    <span className={`h-3 w-3 rounded-full border border-[#CBD5E1] ${theme.bg}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
          <button type="button" className="hover:text-[#111B21] transition-colors"><Search className="h-4.5 w-4.5" /></button>
          <button type="button" className="hover:text-[#111B21] transition-colors"><MoreVertical className="h-4.5 w-4.5" /></button>
        </div>
      </div>

      {/* ── Scrollable Chat Messages ── */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 z-10 flex flex-col">
        {isLoading ? (
          <div className="my-auto flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A884]" />
            <p className="mt-2 text-xs font-semibold text-[#667781] animate-pulse">Memuat pesan...</p>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="h-14 w-14 rounded-full bg-[#00A884]/10 flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 text-[#008069]" />
            </div>
            <p className="text-xs font-bold text-[#111B21]">Kirim pesan pertama Anda</p>
            <p className="text-[10px] mt-0.5 max-w-[200px] text-[#667781]">
              Ketik pesan atau kirim file untuk memulai diskusi.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isMenuOpen = activeMenuMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] relative group ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Message Bubble container */}
                <div
                  className={`rounded-xl px-3.5 py-2 shadow-sm text-xs font-medium leading-relaxed relative border transition-all ${
                    isMe
                      ? 'bg-[#D9FDD3] border-[#D9FDD3] text-[#111B21] rounded-tr-none'
                      : 'bg-white border-[#E9EDF0] text-[#111B21] rounded-tl-none'
                  }`}
                >
                  {/* Sender Name block (Group only) */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-[#008069]">
                      <span>{msg.sender.name}</span>
                      <span className="text-[8px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#008069] border border-[#00A884]/20 scale-90">
                        {msg.sender.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Render content */}
                  {renderMessageContent(msg)}
                  
                  {/* Message Footer Info (Timestamp + Read status) */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-[#667781] font-semibold text-right select-none float-right ml-4">
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
                  </div>

                  {/* Floating Action Chevron trigger (WhatsApp Style) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuMessageId(isMenuOpen ? null : msg.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-0.5 bg-inherit rounded-full shadow-sm border border-slate-200/50 hover:bg-slate-100 text-[#54656F] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Menu Pesan"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Message Options Action Dropdown menu */}
                  {isMenuOpen && (
                    <div className={`absolute z-30 bg-white border border-[#E9EDF0] rounded-xl shadow-2xl p-1.5 w-40 text-xs font-bold text-[#111B21] top-7 ${
                      isMe ? 'right-0' : 'left-0'
                    }`}>
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Salin</span>
                      </button>

                      {/* Edit (only own messages, excluding media) */}
                      {isMe && !msg.content.startsWith('[IMAGE]') && !msg.content.startsWith('[FILE]') && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete for Me */}
                      <button
                        type="button"
                        onClick={() => handleDeleteForMe(msg.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2 text-slate-600"
                      >
                        <Trash className="h-3.5 w-3.5 text-slate-500" />
                        <span>Hapus untuk Saya</span>
                      </button>

                      {/* Delete for Everyone (only own messages or super admin) */}
                      {(isMe || user?.role === 'super_admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteForEveryone(msg.id)}
                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2 text-red-500"
                        >
                          <Trash className="h-3.5 w-3.5 text-red-500" />
                          <span>Hapus Semua Orang</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Active Edit Message Info Ribbon ── */}
      {editingMessageId && (
        <div className="bg-[#E7F8F5] border-t border-[#00A884]/20 px-4 py-2 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-[#008069]" />
            <span className="text-xs font-bold text-[#008069]">Mengedit Pesan</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessageId(null);
              setInputText('');
            }}
            className="h-5 w-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── WhatsApp Bottom Input & Action Bar ── */}
      <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center gap-3 shrink-0 z-20 border-t border-[#E9EDF0] relative">
        
        {/* Attachment menu trigger */}
        <div className="flex items-center gap-1.5 text-[#54656F] relative">
          <button type="button" className="hover:text-[#111B21] transition-colors p-1"><Smile className="h-5.5 w-5.5" /></button>
          
          <button
            type="button"
            onClick={() => setIsAttachOpen(!isAttachOpen)}
            className={`hover:text-[#008069] transition-colors p-1 relative ${isAttachOpen ? 'text-[#008069]' : ''}`}
            title="Kirim Media / Lampiran"
          >
            <Paperclip className="h-5.5 w-5.5" />
          </button>

          {/* Attachment list popover menu */}
          {isAttachOpen && (
            <div className="absolute left-8 bottom-12 z-30 bg-white border border-[#E9EDF0] rounded-xl shadow-xl p-2 w-40 text-xs font-bold text-[#111B21]">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2.5"
              >
                <Image className="h-4.5 w-4.5 text-blue-500" />
                <span>Foto & Video</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F0F2F5] flex items-center gap-2.5"
              >
                <File className="h-4.5 w-4.5 text-purple-500" />
                <span>Dokumen / File</span>
              </button>
            </div>
          )}
        </div>

        {/* Normal Text input form */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessageId ? "Ubah pesan Anda..." : "Ketik pesan"}
            disabled={isSending}
            className="flex-1 h-9 px-4 bg-white rounded-lg text-xs font-semibold text-[#111B21] placeholder-[#667781] focus:outline-none focus:ring-0 w-full"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className={`h-9 w-9 rounded-full flex items-center justify-center p-0 shrink-0 shadow-sm active:scale-95 ${
              isSending || !inputText.trim()
                ? 'bg-[#54656F] text-white opacity-80 cursor-not-allowed'
                : 'bg-[#00A884] hover:bg-[#008069] text-white'
            }`}
            disabled={isSending || !inputText.trim()}
          >
            {isSending ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Send className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

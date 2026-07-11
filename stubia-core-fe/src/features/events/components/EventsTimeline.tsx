import React, { useEffect, useState } from 'react';
import { Event, EventType } from '../types/events.types';
import { eventsApi } from '../api/eventsApi';
import { InteractiveCalendar } from './InteractiveCalendar';
import { Modal } from '../../../components/shared/Modal';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Textarea } from '../../../components/shared/Textarea';
import { Badge } from '../../../components/shared/Badge';
import { CalendarRange, Info, X, Clock, User, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const EventsTimeline: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('TRYOUT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventsApi.getEvents();
      setEvents(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat event.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error('Silakan lengkapi data judul, tanggal mulai, dan tanggal selesai.');
      return;
    }

    setIsSaving(true);
    try {
      await eventsApi.createEvent({
        title,
        type,
        startDate,
        endDate,
        description,
      });

      toast.success(
        type === 'TRYOUT'
          ? 'Event Tryout dibuat & 3 subtask otomatis digenerate!'
          : 'Event berhasil dibuat!'
      );
      
      setIsAddOpen(false);
      setTitle('');
      setType('TRYOUT');
      setStartDate('');
      setEndDate('');
      setDescription('');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventsApi.deleteEvent(id);
      toast.success('Event berhasil dihapus!');
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus event.');
    }
  };

  const getEventColors = (eventType: EventType) => {
    if (eventType === 'TRYOUT') return 'bg-blue-50 text-[#1B3FAB] border-blue-200';
    if (eventType === 'MARKETING') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getTaskStatusBadge = (status: string) => {
    if (status === 'DONE') return <Badge variant="Done">Selesai</Badge>;
    if (status === 'IN_PROGRESS') return <Badge variant="InProgress">In Progress</Badge>;
    if (status === 'REVIEW') return <Badge variant="Warning">Review</Badge>;
    return <Badge variant="Default">To Do</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overview panel */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-[#1B3FAB]" />
          <h2 className="text-xl font-bold text-[#0F172A]">Event & Linimasa Ujian</h2>
        </div>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Kelola linimasa pelaksanaan tryout nasional, event internal stubia.id, dan auto-generasi subtask kepanitiaan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Calendar Component (60%) */}
        <div className="lg:col-span-6">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white border border-[#CBD5E1] rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3FAB]"></div>
              <p className="mt-3 text-xs font-semibold text-[#64748B]">Memuat kalender event...</p>
            </div>
          ) : (
            <InteractiveCalendar
              events={events}
              onSelectEvent={setSelectedEvent}
              onAddEventClick={() => setIsAddOpen(true)}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </div>

        {/* Sliding Detail Panel / Side panel on right (40%) */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-5 h-fit min-h-[420px] flex flex-col justify-between">
          {selectedEvent ? (
            <div className="space-y-4">
              {/* Header with dismiss */}
              <div className="flex items-start justify-between border-b border-[#CBD5E1]/40 pb-3">
                <div className="space-y-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full capitalize ${getEventColors(selectedEvent.type)}`}>
                    {selectedEvent.type.toLowerCase()}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#0F172A]">{selectedEvent.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] focus:outline-none"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Detail fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-[#1B3FAB]" />
                  <span>
                    {new Date(selectedEvent.startDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' — '}
                    {new Date(selectedEvent.endDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <User className="h-4 w-4 text-[#1B3FAB]" />
                  <span>PIC: {selectedEvent.pic?.name} ({selectedEvent.pic?.email})</span>
                </div>

                {selectedEvent.description && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1">Rincian Deskripsi</p>
                    <p className="text-xs font-semibold text-[#0F172A] leading-relaxed whitespace-pre-line">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Auto-generated Tasks */}
              {selectedEvent.type === 'TRYOUT' && (
                <div className="space-y-2 border-t border-[#CBD5E1]/40 pt-4">
                  <h5 className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5 text-[#1B3FAB]" /> Subtask Terkait (Kanban)
                  </h5>

                  <div className="space-y-2">
                    {selectedEvent.tasks && selectedEvent.tasks.length > 0 ? (
                      selectedEvent.tasks.map((task) => (
                        <div key={task.id} className="border border-slate-100 bg-[#F8FAFC] rounded-lg p-2.5 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-bold text-[#0F172A] truncate" title={task.title}>
                            {task.title.split(' — ')[0]}
                          </p>
                          <div className="shrink-0">
                            {getTaskStatusBadge(task.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#64748B] italic">Tidak ada task tertaut ke event ini.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
              <CalendarRange className="h-8 w-8 text-[#CBD5E1] mb-2.5 animate-bounce" style={{ animationDuration: '3s' }} />
              <h4 className="text-xs font-bold text-[#0F172A]">Pratinjau Linimasa Event</h4>
              <p className="text-[10px] text-[#64748B] mt-0.5 max-w-xs leading-relaxed font-medium">
                Pilih salah satu kartu event di kalender untuk melihat rincian PIC, subtask otomatis, dan timeline dependensi.
              </p>
            </div>
          )}

          {selectedEvent && (
            <div className="border-t border-[#CBD5E1]/40 pt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Yakin ingin menghapus event ini beserta subtask terkait?')) {
                    handleDeleteEvent(selectedEvent.id);
                  }
                }}
                className="text-[10px] font-bold border-red-200 text-red-600 hover:bg-red-50"
              >
                Hapus Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Jadwalkan Event Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
          <Input
            label="Nama Event"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tryout UTBK Akbar Gelombang 1"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Tipe Event</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] font-semibold"
            >
              <option value="TRYOUT">Tryout Akbar (Otomatis Subtasks)</option>
              <option value="INTERNAL">Internal Meeting / SOP</option>
              <option value="MARKETING">Marketing Campaign</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Deskripsi Kebutuhan Event"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Ujian simulasi gelombang 1 untuk siswa reguler..."
          />

          {type === 'TRYOUT' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-[#1B3FAB]">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold leading-relaxed">
                <strong>Sistem Otomasi:</strong> Tipe event <strong>Tryout Akbar</strong> akan secara otomatis menugaskan 3 subtask di Kanban Board (Validasi Soal H-14, Deploy Tryout H-7, Push Notifikasi H-3) ke Academic Manager.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-[#CBD5E1]/40 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-bold border-[#CBD5E1]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white"
            >
              Jadwalkan Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default EventsTimeline;

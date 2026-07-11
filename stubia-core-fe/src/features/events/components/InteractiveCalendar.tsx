import React, { useState } from 'react';
import { Event, EventType } from '../types/events.types';
import { Button } from '../../../components/shared/Button';
import { ChevronLeft, ChevronRight, Calendar, User, Eye, Trash2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface InteractiveCalendarProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onAddEventClick: () => void;
  onDeleteEvent: (id: string) => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  events,
  onSelectEvent,
  onAddEventClick,
  onDeleteEvent,
}) => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const isOpsOrAdmin = ['super_admin', 'hr_ops', 'academic_manager'].includes(user?.role || '');

  // Helper date metrics
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday is 0

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getEventColors = (type: EventType) => {
    if (type === 'TRYOUT') return 'bg-blue-50 text-[#1B3FAB] border-blue-200 hover:bg-blue-100/50';
    if (type === 'MARKETING') return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50';
    return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/50';
  };

  const getEventBadgeDot = (type: EventType) => {
    if (type === 'TRYOUT') return 'bg-[#1B3FAB]';
    if (type === 'MARKETING') return 'bg-amber-500';
    return 'bg-slate-500';
  };

  // Compile calendar cells
  const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

  // Previous month padding days
  const prevMonthPaddingCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align Mon-Sun
  for (let i = prevMonthPaddingCount - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const paddingMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const paddingYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    cells.push({
      day: dayNum,
      isCurrentMonth: false,
      date: new Date(paddingYear, paddingMonth, dayNum),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, i),
    });
  }

  // Next month padding days
  const totalCells = Math.ceil(cells.length / 7) * 7;
  const nextMonthPaddingCount = totalCells - cells.length;
  for (let i = 1; i <= nextMonthPaddingCount; i++) {
    const paddingMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const paddingYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    cells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(paddingYear, paddingMonth, i),
    });
  }

  // Days headings Indonesian
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const cellDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const checkStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const checkEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      return cellDate >= checkStart && cellDate <= checkEnd;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatIDRDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#CBD5E1]/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 text-[#1B3FAB] rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0F172A] capitalize">
              {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-[10px] text-[#64748B] font-semibold">Gantt & Event linimasa tryout</p>
          </div>
        </div>

        {/* View togglers & actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Switch views */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md focus:outline-none ${
                viewMode === 'month' ? 'bg-white text-[#1B3FAB] shadow-sm' : 'text-[#64748B]'
              }`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md focus:outline-none ${
                viewMode === 'list' ? 'bg-white text-[#1B3FAB] shadow-sm' : 'text-[#64748B]'
              }`}
            >
              Daftar Event
            </button>
          </div>

          {/* Month switch buttons */}
          <div className="flex items-center border border-[#CBD5E1] rounded-lg">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 border-r border-[#CBD5E1] text-[#64748B]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 text-[#64748B]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {isOpsOrAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddEventClick}
              className="text-xs font-bold"
            >
              Tambah Event
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="space-y-1">
          {/* Day Columns Headings */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map((name) => (
              <span key={name} className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider py-1">
                {name}
              </span>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1 border-t border-slate-100 pt-1">
            {cells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isTodayCell = isToday(cell.date);

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] border border-slate-100 rounded-xl p-1.5 flex flex-col justify-between group transition-colors ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 opacity-40'
                  } ${isTodayCell ? 'ring-1 ring-[#1B3FAB] bg-blue-50/5' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ${
                      isTodayCell ? 'bg-[#1B3FAB] text-white' : 'text-[#64748B]'
                    }`}>
                      {cell.day}
                    </span>
                  </div>

                  {/* Day Events stack (max 3, else count) */}
                  <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto max-h-[72px]">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md cursor-pointer truncate flex items-center gap-1 transition-all ${getEventColors(
                          evt.type
                        )}`}
                        title={evt.title}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getEventBadgeDot(evt.type)}`}></span>
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0F172A]">Belum Ada Event Terjadwal</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Silakan buat event tryout atau event internal baru.</p>
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="border border-[#CBD5E1] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:border-[#1B3FAB] transition-colors cursor-pointer"
                onClick={() => onSelectEvent(evt)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full capitalize ${getEventColors(evt.type)}`}>
                      {evt.type.toLowerCase()}
                    </span>
                    <h4 className="text-xs font-bold text-[#0F172A]">{evt.title}</h4>
                  </div>
                  <p className="text-[10px] text-[#64748B] font-semibold flex items-center gap-1.5">
                    <span>{formatIDRDate(evt.startDate)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{formatIDRDate(evt.endDate)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> PIC: {evt.pic?.name}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isOpsOrAdmin && (
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Yakin ingin menghapus event ini?')) {
                            onDeleteEvent(evt.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default InteractiveCalendar;

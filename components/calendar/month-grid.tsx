'use client';

import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { Schedule, Appointment, Category } from '@/types/database.types';
import { getScheduleOccurrences } from '@/lib/recurrence-engine';
import { Calendar as CalendarIcon, Clock, Users, Plus, CheckCircle } from 'lucide-react';

interface MonthGridProps {
  currentDate: Date;
  schedules: Schedule[];
  appointments: Appointment[];
  selectedCategoryId: string | null;
  onSelectDate: (date: Date) => void;
  onAddScheduleForDate: (date: Date) => void;
  onSelectEvent: (event: any) => void;
}

export function MonthGrid({
  currentDate,
  schedules,
  appointments,
  selectedCategoryId,
  onSelectDate,
  onAddScheduleForDate,
  onSelectEvent,
}: MonthGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filter schedules by category if selected
  const filteredSchedules = selectedCategoryId
    ? schedules.filter((s) => s.category_id === selectedCategoryId)
    : schedules;

  // Calculate occurrences in the visible calendar window
  const allOccurrences = filteredSchedules.flatMap((sched) =>
    getScheduleOccurrences(sched, calendarStart, calendarEnd)
  );

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/40 text-center py-2.5">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`text-xs font-bold uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-rose-400/80' : 'text-slate-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80 bg-slate-950/20">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          // Get day occurrences
          const dayOccurrences = allOccurrences.filter((occ) =>
            isSameDay(occ.startTime, day)
          );

          // Get day appointments
          const dayAppointments = appointments.filter((appt) =>
            isSameDay(new Date(appt.start_time), day)
          );

          const totalEventsCount = dayOccurrences.length + dayAppointments.length;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`min-h-[110px] p-2 transition-all group flex flex-col justify-between relative cursor-pointer ${
                isCurrentMonth ? 'bg-slate-900/40' : 'bg-slate-950/60 opacity-40'
              } ${isCurrentDay ? 'bg-indigo-950/20 ring-1 ring-inset ring-indigo-500/50' : ''} hover:bg-slate-800/40`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-lg transition-colors ${
                    isCurrentDay
                      ? 'bg-indigo-600 text-white shadow-glow-primary/40 font-black'
                      : isCurrentMonth
                      ? 'text-slate-200 group-hover:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Quick Add Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddScheduleForDate(day);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-md transition-all"
                  title="Add schedule on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Events Chips */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[75px] custom-scrollbar flex-1">
                {/* Appointments */}
                {dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent({ ...appt, type: 'appointment' });
                    }}
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 text-[10px] font-semibold truncate hover:brightness-125 transition-all shadow-sm"
                  >
                    <Users className="w-2.5 h-2.5 flex-shrink-0 text-cyan-400" />
                    <span className="truncate">{appt.title}</span>
                  </div>
                ))}

                {/* Recurring Schedule Occurrences */}
                {dayOccurrences.slice(0, 3).map((occ) => {
                  const catColor = occ.category?.color || '#6366F1';
                  return (
                    <div
                      key={occ.occurrenceId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(occ);
                      }}
                      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate hover:brightness-125 transition-all shadow-sm border"
                      style={{
                        backgroundColor: `${catColor}18`,
                        borderColor: `${catColor}40`,
                        color: catColor,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="truncate">{occ.title}</span>
                      {occ.timeSlotLabel && (
                        <span className="text-[8px] opacity-70 ml-auto flex-shrink-0">
                          {occ.timeSlotLabel}
                        </span>
                      )}
                    </div>
                  );
                })}

                {dayOccurrences.length > 3 && (
                  <div className="text-[9px] font-bold text-slate-400 px-1">
                    +{dayOccurrences.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

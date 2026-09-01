'use client';

import React from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  setHours,
  setMinutes,
  addMinutes,
} from 'date-fns';
import { Schedule, Appointment } from '@/types/database.types';
import { getScheduleOccurrences } from '@/lib/recurrence-engine';
import { Users, Clock, Plus } from 'lucide-react';

interface WeekGridProps {
  currentDate: Date;
  schedules: Schedule[];
  appointments: Appointment[];
  selectedCategoryId: string | null;
  onSelectEvent: (event: any) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

export function WeekGrid({
  currentDate,
  schedules,
  appointments,
  selectedCategoryId,
  onSelectEvent,
  onSlotClick,
}: WeekGridProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredSchedules = selectedCategoryId
    ? schedules.filter((s) => s.category_id === selectedCategoryId)
    : schedules;

  const allOccurrences = filteredSchedules.flatMap((sched) =>
    getScheduleOccurrences(sched, weekStart, weekEnd)
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-950/40 sticky top-0 z-20">
        <div className="p-3 text-center text-xs font-bold text-slate-500 border-r border-slate-800/80">
          Time
        </div>
        {days.map((day) => {
          const isCurr = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-r border-slate-800/80 last:border-r-0 ${
                isCurr ? 'bg-indigo-950/30' : ''
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-sm font-black mt-0.5 inline-block px-2 py-0.5 rounded-lg ${
                  isCurr ? 'bg-indigo-600 text-white' : 'text-slate-200'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Rows */}
      <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto custom-scrollbar relative">
        {HOURS.map((hour) => {
          const formattedHour = format(setHours(new Date(), hour), 'h a');

          return (
            <div key={hour} className="grid grid-cols-8 min-h-[64px] relative group">
              {/* Hour Label */}
              <div className="p-2 text-right pr-3 text-xs font-mono font-semibold text-slate-500 border-r border-slate-800/80 select-none bg-slate-950/20">
                {formattedHour}
              </div>

              {/* Day Columns for this hour */}
              {days.map((day) => {
                const slotDate = setMinutes(setHours(day, hour), 0);

                // Find items that start or occur during this hour
                const matchingOccurrences = allOccurrences.filter((occ) => {
                  return (
                    isSameDay(occ.startTime, day) &&
                    occ.startTime.getHours() === hour
                  );
                });

                const matchingAppointments = appointments.filter((appt) => {
                  const s = new Date(appt.start_time);
                  return isSameDay(s, day) && s.getHours() === hour;
                });

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => onSlotClick(slotDate)}
                    className="border-r border-slate-800/60 last:border-r-0 p-1 relative hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    {/* Render matching appointments */}
                    {matchingAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent({ ...appt, type: 'appointment' });
                        }}
                        className="p-1.5 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-100 text-[11px] font-semibold mb-1 shadow-sm hover:brightness-125 transition-all"
                      >
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{appt.title}</span>
                        </div>
                        <div className="text-[9px] text-cyan-300 font-mono mt-0.5">
                          {format(new Date(appt.start_time), 'h:mm a')}
                        </div>
                      </div>
                    ))}

                    {/* Render matching schedule occurrences */}
                    {matchingOccurrences.map((occ) => {
                      const catColor = occ.category?.color || '#6366F1';
                      return (
                        <div
                          key={occ.occurrenceId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(occ);
                          }}
                          className="p-1.5 rounded-lg text-[11px] font-semibold mb-1 shadow-sm hover:brightness-125 transition-all border"
                          style={{
                            backgroundColor: `${catColor}20`,
                            borderColor: `${catColor}50`,
                            color: catColor,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: catColor }}
                            />
                            <span className="truncate">{occ.title}</span>
                          </div>
                          <div className="text-[9px] opacity-80 font-mono mt-0.5">
                            {format(occ.startTime, 'h:mm a')} · {occ.frequency}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  startOfDay,
  endOfDay,
  isToday,
  format,
  setHours,
  setMinutes,
  addMinutes,
} from 'date-fns';
import { Schedule, Appointment } from '@/types/database.types';
import { getScheduleOccurrences } from '@/lib/recurrence-engine';
import { useSchedule } from '@/context/schedule-context';
import { Users, CheckCircle2, Circle, Clock, Sparkles, MapPin } from 'lucide-react';
import { FrequencyBadge } from '@/components/schedules/frequency-badge';

interface DayGridProps {
  currentDate: Date;
  schedules: Schedule[];
  appointments: Appointment[];
  selectedCategoryId: string | null;
  onSelectEvent: (event: any) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

export function DayGrid({
  currentDate,
  schedules,
  appointments,
  selectedCategoryId,
  onSelectEvent,
  onSlotClick,
}: DayGridProps) {
  const { toggleScheduleCompleted } = useSchedule();
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  const filteredSchedules = selectedCategoryId
    ? schedules.filter((s) => s.category_id === selectedCategoryId)
    : schedules;

  const occurrences = filteredSchedules.flatMap((sched) =>
    getScheduleOccurrences(sched, dayStart, dayEnd)
  );

  const dayAppointments = appointments.filter((appt) => {
    const s = new Date(appt.start_time);
    return s >= dayStart && s <= dayEnd;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Day Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {format(currentDate, 'EEEE')}
          </span>
          <h2 className="text-xl font-black text-slate-100">
            {format(currentDate, 'MMMM d, yyyy')}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Activities</span>
          <div className="text-lg font-black text-slate-200">
            {occurrences.length + dayAppointments.length}
          </div>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto custom-scrollbar">
        {HOURS.map((hour) => {
          const slotTime = setMinutes(setHours(currentDate, hour), 0);
          const formattedHour = format(slotTime, 'h:mm a');

          const hourOccurrences = occurrences.filter(
            (occ) => occ.startTime.getHours() === hour
          );
          const hourAppointments = dayAppointments.filter(
            (appt) => new Date(appt.start_time).getHours() === hour
          );

          return (
            <div
              key={hour}
              className="grid grid-cols-12 min-h-[72px] hover:bg-slate-800/20 transition-colors group cursor-pointer"
              onClick={() => onSlotClick(slotTime)}
            >
              {/* Time Label */}
              <div className="col-span-2 sm:col-span-1 p-3 text-right pr-4 text-xs font-mono font-bold text-slate-500 border-r border-slate-800/80 bg-slate-950/20 select-none">
                {formattedHour}
              </div>

              {/* Slot Content */}
              <div className="col-span-10 sm:col-span-11 p-2 space-y-2">
                {/* Appointments in this hour */}
                {hourAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent({ ...appt, type: 'appointment' });
                    }}
                    className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/30 shadow-md hover:border-cyan-400 transition-all flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-cyan-100">{appt.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                          {format(new Date(appt.start_time), 'h:mm a')} –{' '}
                          {format(new Date(appt.end_time), 'h:mm a')}
                        </span>
                      </div>
                      {appt.description && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {appt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Schedules in this hour */}
                {hourOccurrences.map((occ) => {
                  const catColor = occ.category?.color || '#6366F1';
                  return (
                    <div
                      key={occ.occurrenceId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(occ);
                      }}
                      className="p-3 rounded-xl shadow-md border hover:brightness-110 transition-all flex items-start justify-between"
                      style={{
                        backgroundColor: `${catColor}15`,
                        borderColor: `${catColor}40`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleScheduleCompleted(occ.scheduleId);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {occ.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-bold ${
                                occ.isCompleted
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-100'
                              }`}
                            >
                              {occ.title}
                            </h4>
                            <FrequencyBadge frequency={occ.frequency} />
                          </div>
                          {occ.description && (
                            <p className="text-xs text-slate-300 mt-1">{occ.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono text-slate-400">
                        {format(occ.startTime, 'h:mm a')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

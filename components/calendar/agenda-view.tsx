'use client';

import React from 'react';
import {
  addDays,
  isToday,
  isTomorrow,
  format,
  isSameDay,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Schedule, Appointment, AppointmentParticipantWithProfile } from '@/types/database.types';
import { getScheduleOccurrences } from '@/lib/recurrence-engine';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { FrequencyBadge } from '@/components/schedules/frequency-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Calendar,
  Sparkles,
  Share2,
  Check,
  X,
} from 'lucide-react';
import Image from 'next/image';

interface AgendaViewProps {
  currentDate: Date;
  schedules: Schedule[];
  appointments: Appointment[];
  selectedCategoryId: string | null;
  onSelectEvent: (event: any) => void;
  onForwardAppointment: (appointment: Appointment) => void;
}

export function AgendaView({
  currentDate,
  schedules,
  appointments,
  selectedCategoryId,
  onSelectEvent,
  onForwardAppointment,
}: AgendaViewProps) {
  const { toggleScheduleCompleted, respondToAppointment, participants } = useSchedule();
  const { currentUser } = useAuth();

  // Generate stream for next 14 days
  const streamDays = Array.from({ length: 14 }, (_, i) => addDays(currentDate, i));
  const windowStart = startOfDay(streamDays[0]);
  const windowEnd = endOfDay(streamDays[streamDays.length - 1]);

  const filteredSchedules = selectedCategoryId
    ? schedules.filter((s) => s.category_id === selectedCategoryId)
    : schedules;

  const allOccurrences = filteredSchedules.flatMap((sched) =>
    getScheduleOccurrences(sched, windowStart, windowEnd)
  );

  return (
    <div className="space-y-6">
      {streamDays.map((day) => {
        const dayOccurrences = allOccurrences.filter((occ) =>
          isSameDay(occ.startTime, day)
        );

        const dayAppointments = appointments.filter((appt) =>
          isSameDay(new Date(appt.start_time), day)
        );

        if (dayOccurrences.length === 0 && dayAppointments.length === 0) {
          return null;
        }

        const isCurr = isToday(day);
        const isTmrw = isTomorrow(day);

        let dateLabel = format(day, 'EEEE, MMMM d');
        if (isCurr) dateLabel = `Today · ${format(day, 'MMMM d')}`;
        if (isTmrw) dateLabel = `Tomorrow · ${format(day, 'MMMM d')}`;

        return (
          <div
            key={day.toISOString()}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md"
          >
            {/* Date Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCurr ? 'bg-indigo-500 shadow-glow-primary animate-pulse' : 'bg-slate-700'
                  }`}
                />
                <h3 className="text-base font-bold text-slate-100">{dateLabel}</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {dayOccurrences.length + dayAppointments.length} events
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {/* Appointments */}
              {dayAppointments.map((appt) => {
                const apptParticipants = participants.filter((p) => p.appointment_id === appt.id);
                const myParticipantRecord = apptParticipants.find((p) => p.user_id === currentUser?.id);
                const isCreator = appt.creator_id === currentUser?.id;
                const canReshare = isCreator || (myParticipantRecord && myParticipantRecord.can_reshare);

                return (
                  <div
                    key={appt.id}
                    onClick={() => onSelectEvent({ ...appt, type: 'appointment' })}
                    className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 shadow-lg hover:border-cyan-500/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="info">
                          <Users className="w-3 h-3" /> Appointment
                        </Badge>
                        <h4 className="text-sm font-bold text-white">{appt.title}</h4>
                      </div>

                      {appt.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {appt.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {format(new Date(appt.start_time), 'h:mm a')} –{' '}
                          {format(new Date(appt.end_time), 'h:mm a')}
                        </span>
                      </div>
                    </div>

                    {/* Right action block */}
                    <div
                      className="flex items-center gap-2 self-end sm:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Attendees Avatars */}
                      <div className="flex -space-x-2 mr-2">
                        {apptParticipants.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="relative w-7 h-7 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800"
                            title={`${p.profile?.full_name} (${p.status})`}
                          >
                            {p.profile?.avatar_url && (
                              <Image
                                src={p.profile.avatar_url}
                                alt={p.profile.full_name || 'User'}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* RSVP Buttons if invited & pending */}
                      {myParticipantRecord && myParticipantRecord.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => respondToAppointment(appt.id, 'accepted')}
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToAppointment(appt.id, 'declined')}
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </Button>
                        </div>
                      )}

                      {/* Secondary forward button */}
                      {canReshare && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onForwardAppointment(appt)}
                        >
                          <Share2 className="w-3.5 h-3.5" /> Forward
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Schedules Occurrences */}
              {dayOccurrences.map((occ) => {
                const catColor = occ.category?.color || '#6366F1';

                return (
                  <div
                    key={occ.occurrenceId}
                    onClick={() => onSelectEvent(occ)}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-md hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleScheduleCompleted(occ.scheduleId);
                        }}
                        className="text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                      >
                        {occ.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm font-bold truncate ${
                              occ.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {occ.title}
                          </h4>
                          <FrequencyBadge frequency={occ.frequency} />
                          {occ.category && (
                            <Badge
                              variant="custom"
                              customBg={occ.category.color}
                              className="text-[10px]"
                            >
                              {occ.category.name}
                            </Badge>
                          )}
                        </div>

                        {occ.description && (
                          <p className="text-xs text-slate-300 truncate">{occ.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono font-medium text-slate-400 flex-shrink-0">
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
  );
}

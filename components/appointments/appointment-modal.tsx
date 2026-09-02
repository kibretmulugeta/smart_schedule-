'use client';

import React, { useState, useEffect } from 'react';
import { Appointment } from '@/types/database.types';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { detectScheduleConflicts, generateMeetingAgenda } from '@/lib/ai-scheduler';
import { Users, AlertTriangle, Sparkles, Check, Share2, Shield } from 'lucide-react';
import Image from 'next/image';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppointment?: Appointment | null;
  defaultStartTime?: Date;
}

export function AppointmentModal({
  isOpen,
  onClose,
  initialAppointment,
  defaultStartTime,
}: AppointmentModalProps) {
  const { createAppointment, updateAppointment, schedules, appointments } = useSchedule();
  const { currentUser, allProfiles } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<{ userId: string; canReshare: boolean }[]>([]);
  const [agendaSuggestions, setAgendaSuggestions] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    if (initialAppointment) {
      setTitle(initialAppointment.title);
      setDescription(initialAppointment.description || '');
      setStartDateTime(formatToDateTimeLocal(new Date(initialAppointment.start_time)));
      setEndDateTime(formatToDateTimeLocal(new Date(initialAppointment.end_time)));
    } else {
      const base = defaultStartTime || new Date();
      setTitle('');
      setDescription('');
      setStartDateTime(formatToDateTimeLocal(base));
      const end = new Date(base.getTime() + 60 * 60 * 1000);
      setEndDateTime(formatToDateTimeLocal(end));
      // Pre-select other team members
      const others = allProfiles
        .filter((p) => p.id !== currentUser?.id)
        .slice(0, 2)
        .map((p) => ({ userId: p.id, canReshare: true }));
      setSelectedParticipants(others);
    }
  }, [initialAppointment, defaultStartTime, isOpen, currentUser, allProfiles]);

  function formatToDateTimeLocal(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  // Conflict checking on start/end change
  useEffect(() => {
    if (!startDateTime || !endDateTime) return;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return;

    const existingEvents = [
      ...appointments
        .filter((a) => a.id !== initialAppointment?.id)
        .map((a) => ({
          title: a.title,
          startTime: new Date(a.start_time),
          endTime: new Date(a.end_time),
        })),
    ];

    const detected = detectScheduleConflicts(start, end, existingEvents);
    setConflicts(detected);
  }, [startDateTime, endDateTime, appointments, initialAppointment]);

  const toggleParticipant = (userId: string) => {
    const exists = selectedParticipants.some((p) => p.userId === userId);
    if (exists) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.userId !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, { userId, canReshare: true }]);
    }
  };

  const toggleResharePermission = (userId: string) => {
    setSelectedParticipants(
      selectedParticipants.map((p) =>
        p.userId === userId ? { ...p, canReshare: !p.canReshare } : p
      )
    );
  };

  const handleGenerateAgenda = () => {
    const items = generateMeetingAgenda(title || 'Strategic Synchronization', description);
    setAgendaSuggestions(items);
    if (!description) {
      setDescription(items.join('\n'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDateTime || !endDateTime) return;

    const start = new Date(startDateTime).toISOString();
    const end = new Date(endDateTime).toISOString();

    if (initialAppointment) {
      await updateAppointment(initialAppointment.id, {
        title: title.trim(),
        description: description.trim() || null,
        start_time: start,
        end_time: end,
      });
    } else {
      await createAppointment(
        {
          title: title.trim(),
          description: description.trim() || null,
          start_time: start,
          end_time: end,
        },
        selectedParticipants
      );
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAppointment ? 'Edit Appointment' : 'Schedule Multi-Party Appointment'}
      subtitle="Collaborative scheduling with participant invitations & forwarding permissions."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="Meeting / Appointment Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Executive Strategy Review, Architecture Deep Dive"
          required
        />

        {/* Date Time Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              End Time *
            </label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              required
            />
          </div>
        </div>

        {/* Conflict Warning Banner */}
        {conflicts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Schedule Conflict Detected: </span>
              <span>
                Overlaps with &quot;{conflicts[0].conflictingEventTitle}&quot;. {conflicts[0].recommendation}
              </span>
            </div>
          </div>
        )}

        {/* Description & AI Agenda Generator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Meeting Description & Agenda
            </label>
            <button
              type="button"
              onClick={handleGenerateAgenda}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Draft Agenda
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Meeting goals, video call link (Google Meet / Zoom), or key topics..."
          />
        </div>

        {/* Participant Selection & Forwarding Permissions (RLS can_reshare) */}
        {!initialAppointment && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                Invite Participants & Set Reshare Permissions
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedParticipants.length} invited
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {allProfiles
                .filter((p) => p.id !== currentUser?.id)
                .map((profile) => {
                  const isSelected = selectedParticipants.some((p) => p.userId === profile.id);
                  const participantData = selectedParticipants.find((p) => p.userId === profile.id);
                  const canReshare = participantData?.canReshare ?? true;

                  return (
                    <div
                      key={profile.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-950/20'
                          : 'border-slate-800 bg-slate-900/50 opacity-75'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleParticipant(profile.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                          {profile.avatar_url && (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.full_name || 'User'}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            {profile.full_name || profile.email}
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                              {profile.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{profile.email}</div>
                        </div>
                      </button>

                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleResharePermission(profile.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              canReshare
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                            title="Allows participant to forward invite to others"
                          >
                            <Share2 className="w-3 h-3" />
                            {canReshare ? 'Can Reshare' : 'No Forwarding'}
                          </button>
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialAppointment ? 'Update Appointment' : 'Send Invitations'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

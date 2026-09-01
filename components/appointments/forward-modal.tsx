'use client';

import React, { useState } from 'react';
import { Appointment } from '@/types/database.types';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Share2, Users, Check, Shield } from 'lucide-react';
import Image from 'next/image';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function ForwardModal({ isOpen, onClose, appointment }: ForwardModalProps) {
  const { forwardAppointment, participants } = useSchedule();
  const { currentUser, allProfiles } = useAuth();

  const [targetUserId, setTargetUserId] = useState<string>('');
  const [canReshare, setCanReshare] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  // Filter out users already in the appointment
  const existingParticipantUserIds = participants
    .filter((p) => p.appointment_id === appointment.id)
    .map((p) => p.user_id);

  const availableProfiles = allProfiles.filter(
    (p) => !existingParticipantUserIds.includes(p.id)
  );

  const handleForward = async () => {
    if (!targetUserId) return;
    setLoading(true);
    const success = await forwardAppointment(appointment.id, targetUserId, canReshare);
    setLoading(false);
    if (success) {
      setTargetUserId('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forward / Reshare Appointment"
      subtitle={`Invite secondary participants to "${appointment.title}"`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">Event:</span> {appointment.title}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Secondary invitations will be logged with your attribution (<span className="text-indigo-400 font-medium">Invited by {currentUser.full_name}</span>) as per Row Level Security policies.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Select Colleague to Invite
          </label>
          {availableProfiles.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              All team members are already participants in this meeting.
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {availableProfiles.map((p) => {
                const isSelected = targetUserId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetUserId(p.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                        {p.avatar_url && (
                          <Image
                            src={p.avatar_url}
                            alt={p.full_name || 'User'}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400">{p.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstream can_reshare toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Allow Downstream Forwarding
            </div>
            <div className="text-[11px] text-slate-400">
              Grant this user permission to forward the invite further.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCanReshare(!canReshare)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              canReshare
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {canReshare ? 'Allowed' : 'Restricted'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!targetUserId || loading}
            onClick={handleForward}
          >
            <Share2 className="w-4 h-4" />
            Send Forwarded Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
}

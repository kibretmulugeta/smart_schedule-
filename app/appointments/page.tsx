'use client';

import React, { useState } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { AppointmentModal } from '@/components/appointments/appointment-modal';
import { ForwardModal } from '@/components/appointments/forward-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/types/database.types';
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Trash2,
  Calendar,
  Check,
  X,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

import { FormalInviteModal } from '@/components/invitations/formal-invite-modal';

export default function AppointmentsPage() {
  const {
    getUserAppointments,
    getAppointmentParticipants,
    respondToAppointment,
    deleteAppointment,
  } = useSchedule();
  const { currentUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'created' | 'invited' | 'pending'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormalInviteOpen, setIsFormalInviteOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [forwardModalAppointment, setForwardModalAppointment] = useState<Appointment | null>(null);

  const userAppointments = getUserAppointments();

  const filteredAppointments = userAppointments.filter((appt) => {
    const isCreator = appt.creator_id === currentUser?.id;
    const participants = getAppointmentParticipants(appt.id);
    const myRecord = participants.find((p) => p.user_id === currentUser?.id);

    if (activeFilter === 'created') return isCreator;
    if (activeFilter === 'invited') return !isCreator;
    if (activeFilter === 'pending') return myRecord && myRecord.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Multi-Party Appointments & Forwarding
          </div>
          <h1 className="text-2xl font-black text-white">Collaborative Meetings & Invites</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Invite registered team members or non-registered email addresses to meeting appointments or formal platform registration.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="secondary"
            onClick={() => setIsFormalInviteOpen(true)}
            className="text-xs font-semibold"
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            Invite via Email
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setEditingAppointment(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Tabs / Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Appointments' },
          { id: 'created', label: 'Created by Me' },
          { id: 'invited', label: 'Invited to Me' },
          { id: 'pending', label: 'Pending RSVPs' },
        ].map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.map((appt) => {
          const participants = getAppointmentParticipants(appt.id);
          const isCreator = appt.creator_id === currentUser?.id;
          const myRecord = participants.find((p) => p.user_id === currentUser?.id);
          const canReshare = isCreator || (myRecord && myRecord.can_reshare);

          return (
            <div
              key={appt.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(appt.start_time), 'EEEE, MMM d · h:mm a')} –{' '}
                      {format(new Date(appt.end_time), 'h:mm a')}
                    </span>
                    {isCreator && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        Host / Creator
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{appt.title}</h3>
                  {appt.description && (
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-3xl whitespace-pre-line">
                      {appt.description}
                    </p>
                  )}
                </div>

                {/* RSVP or Cancel Actions */}
                <div className="flex items-center gap-2 self-end sm:self-start flex-wrap">
                  {myRecord && myRecord.status === 'pending' && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
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

                  {canReshare && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setForwardModalAppointment(appt)}
                      title="Forward invite to other team members"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Forward Invite
                    </Button>
                  )}

                  {isCreator && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteAppointment(appt.id)}
                      title="Cancel meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Participants Roster */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Invited Participants ({participants.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {participants.map((p) => {
                    const isSelf = p.user_id === currentUser?.id;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                            {p.profile?.avatar_url && (
                              <Image
                                src={p.profile.avatar_url}
                                alt={p.profile.full_name || 'User'}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">
                              {p.profile?.full_name || 'Colleague'}
                              {isSelf && ' (You)'}
                            </div>
                            {p.invited_by && p.invited_by !== appt.creator_id && (
                              <div className="text-[9px] text-indigo-400 truncate">
                                Forwarded by {p.invited_by_profile?.full_name?.split(' ')[0] || 'Peer'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0 pl-1">
                          {p.status === 'accepted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" /> Accepted
                            </span>
                          )}
                          {p.status === 'declined' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" /> Declined
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAppointments.length === 0 && (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
            <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-300">No appointments found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Create a new collaborative appointment to invite your team.
            </p>
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
        initialAppointment={editingAppointment}
      />

      <ForwardModal
        isOpen={Boolean(forwardModalAppointment)}
        onClose={() => setForwardModalAppointment(null)}
        appointment={forwardModalAppointment}
      />

      <FormalInviteModal
        isOpen={isFormalInviteOpen}
        onClose={() => setIsFormalInviteOpen(false)}
      />
    </div>
  );
}

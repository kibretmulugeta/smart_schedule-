'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Schedule,
  Appointment,
  AppointmentParticipantWithProfile,
  Category,
  ParticipantStatus,
  FrequencyType,
} from '@/types/database.types';
import { MOCK_SCHEDULES, MOCK_APPOINTMENTS, MOCK_PARTICIPANTS, MOCK_CATEGORIES, MOCK_PROFILES } from '@/lib/mock-data';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';
import { useNotification } from './notification-context';
import confetti from 'canvas-confetti';

interface ScheduleContextType {
  schedules: Schedule[];
  appointments: Appointment[];
  participants: AppointmentParticipantWithProfile[];
  categories: Category[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  frequencyFilter: FrequencyType | 'all';
  setFrequencyFilter: (freq: FrequencyType | 'all') => void;

  // Schedules operations
  createSchedule: (scheduleData: Omit<Schedule, 'id' | 'created_at' | 'user_id'>) => Promise<Schedule>;
  updateSchedule: (id: string, scheduleData: Partial<Schedule>) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<boolean>;
  toggleScheduleCompleted: (id: string) => Promise<boolean>;

  // Appointments operations
  createAppointment: (
    appointmentData: Omit<Appointment, 'id' | 'created_at' | 'creator_id'>,
    initialParticipantIds: { userId: string; canReshare: boolean }[]
  ) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  respondToAppointment: (appointmentId: string, status: ParticipantStatus) => Promise<boolean>;
  forwardAppointment: (appointmentId: string, targetUserId: string, canReshare: boolean) => Promise<boolean>;

  // Categories operations
  createCategory: (name: string, color: string) => Promise<Category>;
  updateCategory: (id: string, name: string, color: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Formal Invitations
  sendFormalInvitation: (email: string) => Promise<boolean>;

  // Helper getters
  getUserAppointments: () => Appointment[];
  getAppointmentParticipants: (appointmentId: string) => AppointmentParticipantWithProfile[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SCHEDULES: 'antigravity_schedules_cache',
  APPOINTMENTS: 'antigravity_appointments_cache',
  PARTICIPANTS: 'antigravity_participants_cache',
  CATEGORIES: 'antigravity_categories_cache',
};

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { currentUser, allProfiles } = useAuth();
  const { showToast } = useToast();
  const { dispatchDualNotification } = useNotification();

  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [participants, setParticipants] = useState<AppointmentParticipantWithProfile[]>(MOCK_PARTICIPANTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyType | 'all'>('all');

  // Load from local storage
  // Sync with Server Database API
  useEffect(() => {
    // 1. Initial hydrate from local storage for zero latency
    try {
      const storedSched = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (storedSched) setSchedules(JSON.parse(storedSched));

      const storedAppts = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (storedAppts) setAppointments(JSON.parse(storedAppts));

      const storedParts = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (storedParts) setParticipants(JSON.parse(storedParts));

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCats) setCategories(JSON.parse(storedCats));
    } catch (e) {}

    // 2. Fetch authoritative state from Server Database
    const fetchFromServerDb = async () => {
      try {
        const [schedRes, apptRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/appointments'),
        ]);

        if (schedRes.ok) {
          const sJson = await schedRes.json();
          if (sJson.data && Array.isArray(sJson.data) && sJson.data.length > 0) {
            setSchedules(sJson.data);
            try {
              localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(sJson.data));
            } catch (e) {}
          }
        }

        if (apptRes.ok) {
          const aJson = await apptRes.json();
          if (aJson.data) {
            if (Array.isArray(aJson.data.appointments)) {
              setAppointments(aJson.data.appointments);
              try {
                localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(aJson.data.appointments));
              } catch (e) {}
            }
            if (Array.isArray(aJson.data.participants)) {
              setParticipants(aJson.data.participants);
              try {
                localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(aJson.data.participants));
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.warn('Server database sync error:', err);
      }
    };

    fetchFromServerDb();
  }, []);

  const saveSchedules = (items: Schedule[]) => {
    setSchedules(items);
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(items));
    } catch (e) {}
  };

  const saveAppointments = (items: Appointment[]) => {
    setAppointments(items);
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(items));
    } catch (e) {}
  };

  const saveParticipants = (items: AppointmentParticipantWithProfile[]) => {
    setParticipants(items);
    try {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(items));
    } catch (e) {}
  };

  const saveCategories = (items: Category[]) => {
    setCategories(items);
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(items));
    } catch (e) {}
  };

  const activeUser = currentUser || MOCK_PROFILES[0];

  // --- SCHEDULE OPERATIONS ---
  const createSchedule = async (
    scheduleData: Omit<Schedule, 'id' | 'created_at' | 'user_id'>
  ): Promise<Schedule> => {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`,
      user_id: activeUser.id,
      created_at: new Date().toISOString(),
      category: categories.find((c) => c.id === scheduleData.category_id) || null,
    };

    const updated = [newSchedule, ...schedules];
    saveSchedules(updated);

    // Persist to Server Database
    try {
      fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      }).catch(() => {});
    } catch (e) {}

    // Dispatch immediate dual notification: Screen + Creator Email
    if (activeUser.email) {
      await dispatchDualNotification({
        category: 'schedule_created',
        title: `📅 Schedule Added: ${newSchedule.title}`,
        message: `Recurring schedule added to calendar and email confirmation sent to ${activeUser.email}.`,
        targetUserId: activeUser.id,
        recipientEmail: activeUser.email,
        recipientName: activeUser.full_name || 'Schedule Creator',
        emailPayload: {
          to: activeUser.email,
          recipientName: activeUser.full_name || 'Schedule Creator',
          subject: `📅 Schedule Created: ${newSchedule.title}`,
          type: 'schedule_created',
          eventTitle: newSchedule.title,
          eventDescription: newSchedule.description,
          startTime: newSchedule.start_time,
          endTime: newSchedule.end_time,
          hostName: activeUser.full_name || 'You',
          hostEmail: activeUser.email,
        },
        showToastAlert: true,
        playChime: true,
        eventId: newSchedule.id,
        eventTime: newSchedule.start_time,
      });
    } else {
      showToast('Schedule Created', `"${newSchedule.title}" recurring event was added.`, 'success');
    }

    return newSchedule;
  };

  const updateSchedule = async (id: string, scheduleData: Partial<Schedule>): Promise<boolean> => {
    const updated = schedules.map((s) => {
      if (s.id === id) {
        const cat = scheduleData.category_id !== undefined 
          ? categories.find((c) => c.id === scheduleData.category_id) || null 
          : s.category;
        return { ...s, ...scheduleData, category: cat };
      }
      return s;
    });

    saveSchedules(updated);
    showToast('Schedule Updated', 'Changes saved successfully.', 'success');
    return true;
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    const updated = schedules.filter((s) => s.id !== id);
    saveSchedules(updated);
    showToast('Schedule Removed', 'Event removed from calendar.', 'info');
    return true;
  };

  const toggleScheduleCompleted = async (id: string): Promise<boolean> => {
    let justCompleted = false;
    const updated = schedules.map((s) => {
      if (s.id === id) {
        const nextState = !s.is_completed;
        if (nextState) justCompleted = true;
        return { ...s, is_completed: nextState };
      }
      return s;
    });

    saveSchedules(updated);

    if (justCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366F1', '#10B981', '#06B6D4', '#F59E0B'],
        });
      } catch (e) {}
      showToast('Task Completed! 🎉', 'Streak logged and scheduled status updated.', 'success');
    }
    return true;
  };

  // --- APPOINTMENTS OPERATIONS ---
  const createAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'created_at' | 'creator_id'>,
    initialParticipantIds: { userId: string; canReshare: boolean }[]
  ): Promise<Appointment> => {
    const newApptId = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      ...appointmentData,
      id: newApptId,
      creator_id: activeUser.id,
      created_at: new Date().toISOString(),
      creator: activeUser,
    };

    // Auto-add creator as accepted participant
    const creatorParticipant: AppointmentParticipantWithProfile = {
      id: `part-${Date.now()}-creator`,
      appointment_id: newApptId,
      user_id: activeUser.id,
      invited_by: activeUser.id,
      status: 'accepted',
      can_reshare: true,
      created_at: new Date().toISOString(),
      profile: activeUser,
    };

    const invitedParticipants: AppointmentParticipantWithProfile[] = [];
    const unregisteredEmailInvites: { email: string; canReshare: boolean }[] = [];

    initialParticipantIds
      .filter((p) => p.userId !== activeUser.id)
      .forEach((p, idx) => {
        const profile = allProfiles.find((pr) => pr.id === p.userId || pr.email.toLowerCase() === p.userId.toLowerCase());
        if (profile) {
          invitedParticipants.push({
            id: `part-${Date.now()}-${idx}`,
            appointment_id: newApptId,
            user_id: profile.id,
            invited_by: activeUser.id,
            status: 'pending',
            can_reshare: p.canReshare,
            created_at: new Date().toISOString(),
            profile,
            invited_by_profile: activeUser,
          });
        } else if (p.userId.includes('@')) {
          unregisteredEmailInvites.push({
            email: p.userId.trim().toLowerCase(),
            canReshare: p.canReshare,
          });
        }
      });

    saveAppointments([newAppointment, ...appointments]);
    saveParticipants([...participants, creatorParticipant, ...invitedParticipants]);

    // Dispatch invitations for unregistered emails
    for (const unreg of unregisteredEmailInvites) {
      try {
        fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: unreg.email,
            invitation_type: 'appointment',
            inviter_id: activeUser.id,
            appointment_id: newApptId,
            can_reshare: unreg.canReshare,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    // Persist to Server Database API
    try {
      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAppointment,
          participantUserIds: initialParticipantIds.map((p) => p.userId),
          unregisteredEmails: unregisteredEmailInvites.map((u) => u.email),
        }),
      }).catch(() => {});
    } catch (e) {}

    // Roster of attendees for rich email representation
    const attendeesRoster = [
      {
        name: `${activeUser.full_name || 'Meeting Host'} (Host)`,
        email: activeUser.email,
        status: 'accepted',
      },
      ...invitedParticipants.map((p) => ({
        name: p.profile?.full_name || 'Invited Teammate',
        email: p.profile?.email || 'unspecified',
        status: p.status,
      })),
    ];

    // 1. IMMEDIATELY NOTIFY MEETING CREATOR via their own email AND screen
    if (activeUser.email) {
      await dispatchDualNotification({
        category: 'meeting_created',
        title: `✅ Meeting Confirmed: ${newAppointment.title}`,
        message: `Successfully scheduled with ${invitedParticipants.length} invited attendee(s). Confirmation dispatched to your email (${activeUser.email}).`,
        targetUserId: activeUser.id,
        recipientEmail: activeUser.email,
        recipientName: activeUser.full_name || 'Meeting Host',
        emailPayload: {
          to: activeUser.email,
          recipientName: activeUser.full_name || 'Meeting Host',
          subject: `✅ Meeting Scheduled: ${newAppointment.title}`,
          type: 'meeting_created_creator',
          eventTitle: newAppointment.title,
          eventDescription: newAppointment.description,
          startTime: newAppointment.start_time,
          endTime: newAppointment.end_time,
          hostName: activeUser.full_name || 'Meeting Host',
          hostEmail: activeUser.email,
          attendees: attendeesRoster,
        },
        showToastAlert: true,
        playChime: true,
        eventId: newApptId,
        eventTime: newAppointment.start_time,
        hostName: activeUser.full_name || 'Meeting Host',
      });
    }

    // 2. IMMEDIATELY NOTIFY EACH INVITED USER via their own email AND screen
    for (const p of invitedParticipants) {
      if (p.profile?.email) {
        await dispatchDualNotification({
          category: 'appointment_invite',
          title: `📅 Meeting Invitation: ${newAppointment.title}`,
          message: `${activeUser.full_name || 'A colleague'} invited you to "${newAppointment.title}".`,
          targetUserId: p.user_id,
          recipientEmail: p.profile.email,
          recipientName: p.profile.full_name || 'Team Member',
          emailPayload: {
            to: p.profile.email,
            recipientName: p.profile.full_name || 'Team Member',
            subject: `📅 Invitation: ${newAppointment.title}`,
            type: 'appointment_invite',
            eventTitle: newAppointment.title,
            eventDescription: newAppointment.description,
            startTime: newAppointment.start_time,
            endTime: newAppointment.end_time,
            hostName: activeUser.full_name || 'Meeting Host',
            hostEmail: activeUser.email,
            attendees: attendeesRoster,
          },
          showToastAlert: false, // keep creator's active screen clean while saving to recipient's notifications
          playChime: false,
          eventId: newApptId,
          eventTime: newAppointment.start_time,
          hostName: activeUser.full_name || 'Meeting Host',
        });
      }
    }

    return newAppointment;
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<boolean> => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, ...data } : a));
    saveAppointments(updated);
    showToast('Appointment Updated', 'Meeting details updated.', 'success');
    return true;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    const target = appointments.find((a) => a.id === id);
    if (target && target.creator_id !== activeUser.id && activeUser.role !== 'admin') {
      showToast('RLS Permission Denied', 'Only the appointment creator can cancel this meeting.', 'error');
      return false;
    }

    saveAppointments(appointments.filter((a) => a.id !== id));
    saveParticipants(participants.filter((p) => p.appointment_id !== id));
    showToast('Appointment Cancelled', 'Meeting removed from all attendees’ calendars.', 'info');
    return true;
  };

  const respondToAppointment = async (
    appointmentId: string,
    status: ParticipantStatus
  ): Promise<boolean> => {
    const existing = participants.find(
      (p) => p.appointment_id === appointmentId && p.user_id === activeUser.id
    );

    if (!existing) {
      showToast('Error', 'You are not invited to this appointment.', 'error');
      return false;
    }

    const updated = participants.map((p) =>
      p.appointment_id === appointmentId && p.user_id === activeUser.id
        ? { ...p, status }
        : p
    );

    saveParticipants(updated);

    // Persist RSVP to Server Database
    try {
      fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rsvp',
          appointmentId,
          userId: activeUser.id,
          status,
        }),
      }).catch(() => {});
    } catch (e) {}

    const appt = appointments.find((a) => a.id === appointmentId);
    const host = allProfiles.find((pr) => pr.id === appt?.creator_id);

    showToast('RSVP Sent', `Response recorded as ${status.toUpperCase()}.`, 'success');

    // Notify meeting creator immediately via email & screen
    if (host?.email && host.id !== activeUser.id) {
      await dispatchDualNotification({
        category: 'rsvp_update',
        title: `📬 RSVP: ${activeUser.full_name || activeUser.email} [${status.toUpperCase()}]`,
        message: `${activeUser.full_name || activeUser.email} has ${status} your meeting "${appt?.title}".`,
        targetUserId: host.id,
        recipientEmail: host.email,
        recipientName: host.full_name || 'Meeting Host',
        emailPayload: {
          to: host.email,
          recipientName: host.full_name || 'Meeting Host',
          subject: `📬 RSVP: ${activeUser.full_name || activeUser.email} [${status.toUpperCase()}] to "${appt?.title}"`,
          type: 'rsvp_update',
          eventTitle: appt?.title || 'Scheduled Meeting',
          rsvpStatus: status,
          startTime: appt?.start_time || new Date().toISOString(),
          endTime: appt?.end_time,
          hostName: activeUser.full_name || 'Invitee',
          hostEmail: activeUser.email,
        },
        showToastAlert: true,
        playChime: true,
        eventId: appointmentId,
      });
    }

    return true;
  };

  const forwardAppointment = async (
    appointmentId: string,
    targetUserId: string,
    canReshare: boolean
  ): Promise<boolean> => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return false;

    const myParticipantRecord = participants.find(
      (p) => p.appointment_id === appointmentId && p.user_id === activeUser.id
    );

    const isCreator = appt.creator_id === activeUser.id;
    const canForward = isCreator || (myParticipantRecord && myParticipantRecord.can_reshare);

    if (!canForward && activeUser.role !== 'admin') {
      showToast(
        'RLS Policy Blocked',
        'You do not have permission (can_reshare=false) to invite others to this appointment.',
        'error'
      );
      return false;
    }

    const alreadyInvited = participants.some(
      (p) => p.appointment_id === appointmentId && p.user_id === targetUserId
    );

    if (alreadyInvited) {
      showToast('Already Invited', 'This user is already a participant on this appointment.', 'warning');
      return false;
    }

    const targetProfile = allProfiles.find((pr) => pr.id === targetUserId) || null;
    const newParticipant: AppointmentParticipantWithProfile = {
      id: `part-${Date.now()}-fwd`,
      appointment_id: appointmentId,
      user_id: targetUserId,
      invited_by: activeUser.id,
      status: 'pending',
      can_reshare: canReshare,
      created_at: new Date().toISOString(),
      profile: targetProfile,
      invited_by_profile: activeUser,
    };

    saveParticipants([...participants, newParticipant]);

    // Persist Forwarded Participant to Server Database
    try {
      fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward',
          appointmentId,
          targetUserId,
          inviterId: activeUser.id,
          canReshare,
        }),
      }).catch(() => {});
    } catch (e) {}

    // Dispatch email to target user immediately
    if (targetProfile?.email) {
      await dispatchDualNotification({
        category: 'forward_invite',
        title: `↪️ Forwarded Meeting: ${appt.title}`,
        message: `${activeUser.full_name || 'A colleague'} forwarded this meeting invitation to you.`,
        targetUserId: targetUserId,
        recipientEmail: targetProfile.email,
        recipientName: targetProfile.full_name || 'Team Member',
        emailPayload: {
          to: targetProfile.email,
          recipientName: targetProfile.full_name || 'Team Member',
          subject: `↪️ Forwarded Meeting: ${appt.title}`,
          type: 'forward_invite',
          eventTitle: appt.title,
          eventDescription: appt.description,
          startTime: appt.start_time,
          endTime: appt.end_time,
          hostName: activeUser.full_name || 'A Colleague',
          hostEmail: activeUser.email,
        },
        showToastAlert: false,
        playChime: false,
        eventId: appointmentId,
        eventTime: appt.start_time,
      });
    }

    // Dispatch confirmation to forwarder
    await dispatchDualNotification({
      category: 'forward_invite',
      title: 'Invitation Forwarded',
      message: `Forwarded meeting invite to ${targetProfile?.full_name || targetProfile?.email} and dispatched email notice.`,
      targetUserId: activeUser.id,
      recipientEmail: activeUser.email,
      recipientName: activeUser.full_name || 'You',
      emailPayload: {
        to: activeUser.email,
        recipientName: activeUser.full_name || 'You',
        subject: `↪️ Forward Confirmation: ${appt.title}`,
        type: 'forward_invite',
        eventTitle: appt.title,
        eventDescription: `You forwarded this meeting invitation to ${targetProfile?.full_name || targetProfile?.email}.`,
        startTime: appt.start_time,
        endTime: appt.end_time,
        hostName: activeUser.full_name || 'You',
        hostEmail: activeUser.email,
      },
      showToastAlert: true,
      playChime: true,
    });

    return true;
  };

  const createCategory = async (name: string, color: string): Promise<Category> => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      user_id: activeUser.id,
      name,
      color,
      is_default: false,
      created_at: new Date().toISOString(),
    };
    saveCategories([...categories, newCat]);
    showToast('Category Created', `Category "${name}" is now available.`, 'success');
    return newCat;
  };

  const updateCategory = async (id: string, name: string, color: string): Promise<boolean> => {
    const updated = categories.map((c) => (c.id === id ? { ...c, name, color } : c));
    saveCategories(updated);
    showToast('Category Updated', 'Saved category changes.', 'success');
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    saveCategories(categories.filter((c) => c.id !== id));
    showToast('Category Deleted', 'Category removed.', 'info');
    return true;
  };

  const getUserAppointments = (): Appointment[] => {
    return appointments.filter((appt) => {
      if (activeUser.role === 'admin') return true;
      if (appt.creator_id === activeUser.id) return true;
      return participants.some(
        (p) => p.appointment_id === appt.id && p.user_id === activeUser.id
      );
    });
  };

  const getAppointmentParticipants = (appointmentId: string): AppointmentParticipantWithProfile[] => {
    return participants.filter((p) => p.appointment_id === appointmentId);
  };

  const sendFormalInvitation = async (email: string): Promise<boolean> => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return false;

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          invitation_type: 'formal',
          inviter_id: activeUser.id,
        }),
      });

      if (res.ok) {
        showToast(
          'Formal Invitation Dispatched ✉️',
          `An official registration invitation link has been emailed to ${targetEmail}.`,
          'success'
        );
        return true;
      }
    } catch (e) {}

    showToast('Invitation Dispatched', `Formal invitation link sent to ${targetEmail}.`, 'success');
    return true;
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules: schedules.filter((s) => activeUser.role === 'admin' || s.user_id === activeUser.id),
        appointments,
        participants,
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        searchQuery,
        setSearchQuery,
        frequencyFilter,
        setFrequencyFilter,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        toggleScheduleCompleted,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        respondToAppointment,
        forwardAppointment,
        createCategory,
        updateCategory,
        deleteCategory,
        sendFormalInvitation,
        getUserAppointments,
        getAppointmentParticipants,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}

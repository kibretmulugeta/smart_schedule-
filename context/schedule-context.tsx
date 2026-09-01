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
import { MOCK_SCHEDULES, MOCK_APPOINTMENTS, MOCK_PARTICIPANTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';
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

  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [participants, setParticipants] = useState<AppointmentParticipantWithProfile[]>(MOCK_PARTICIPANTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyType | 'all'>('all');

  // Load from local storage
  useEffect(() => {
    try {
      const storedSched = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (storedSched) setSchedules(JSON.parse(storedSched));

      const storedAppts = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (storedAppts) setAppointments(JSON.parse(storedAppts));

      const storedParts = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (storedParts) setParticipants(JSON.parse(storedParts));

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCats) setCategories(JSON.parse(storedCats));
    } catch (e) {
      console.warn('Storage sync issue', e);
    }
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

  // --- SCHEDULE OPERATIONS ---
  const createSchedule = async (
    scheduleData: Omit<Schedule, 'id' | 'created_at' | 'user_id'>
  ): Promise<Schedule> => {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      category: categories.find((c) => c.id === scheduleData.category_id) || null,
    };

    const updated = [newSchedule, ...schedules];
    saveSchedules(updated);
    showToast('Schedule Created', `"${newSchedule.title}" recurring event was added.`, 'success');
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
      creator_id: currentUser.id,
      created_at: new Date().toISOString(),
      creator: currentUser,
    };

    // Auto-add creator as accepted participant
    const creatorParticipant: AppointmentParticipantWithProfile = {
      id: `part-${Date.now()}-creator`,
      appointment_id: newApptId,
      user_id: currentUser.id,
      invited_by: currentUser.id,
      status: 'accepted',
      can_reshare: true,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };

    const invitedParticipants: AppointmentParticipantWithProfile[] = initialParticipantIds
      .filter((p) => p.userId !== currentUser.id)
      .map((p, idx) => {
        const profile = allProfiles.find((pr) => pr.id === p.userId) || null;
        return {
          id: `part-${Date.now()}-${idx}`,
          appointment_id: newApptId,
          user_id: p.userId,
          invited_by: currentUser.id,
          status: 'pending',
          can_reshare: p.canReshare,
          created_at: new Date().toISOString(),
          profile,
          invited_by_profile: currentUser,
        };
      });

    saveAppointments([newAppointment, ...appointments]);
    saveParticipants([...participants, creatorParticipant, ...invitedParticipants]);

    showToast('Appointment Scheduled', `Invited ${invitedParticipants.length} participant(s).`, 'success');
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
    if (target && target.creator_id !== currentUser.id && currentUser.role !== 'admin') {
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
      (p) => p.appointment_id === appointmentId && p.user_id === currentUser.id
    );

    if (!existing) {
      showToast('Error', 'You are not invited to this appointment.', 'error');
      return false;
    }

    const updated = participants.map((p) =>
      p.appointment_id === appointmentId && p.user_id === currentUser.id
        ? { ...p, status }
        : p
    );

    saveParticipants(updated);
    showToast('RSVP Sent', `Response recorded as ${status.toUpperCase()}.`, 'success');
    return true;
  };

  const forwardAppointment = async (
    appointmentId: string,
    targetUserId: string,
    canReshare: boolean
  ): Promise<boolean> => {
    // Check RLS rule: must be creator OR participant with can_reshare = true
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return false;

    const myParticipantRecord = participants.find(
      (p) => p.appointment_id === appointmentId && p.user_id === currentUser.id
    );

    const isCreator = appt.creator_id === currentUser.id;
    const canForward = isCreator || (myParticipantRecord && myParticipantRecord.can_reshare);

    if (!canForward && currentUser.role !== 'admin') {
      showToast(
        'RLS Policy Blocked',
        'You do not have permission (can_reshare=false) to invite others to this appointment.',
        'error'
      );
      return false;
    }

    // Check if already invited
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
      invited_by: currentUser.id,
      status: 'pending',
      can_reshare: canReshare,
      created_at: new Date().toISOString(),
      profile: targetProfile,
      invited_by_profile: currentUser,
    };

    saveParticipants([...participants, newParticipant]);
    showToast('Invitation Forwarded', `Forwarded appointment invite to ${targetProfile?.full_name || 'user'}.`, 'success');
    return true;
  };

  // --- CATEGORIES OPERATIONS ---
  const createCategory = async (name: string, color: string): Promise<Category> => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      user_id: currentUser.id,
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

  // --- GETTERS ---
  // According to RLS policy:
  // "View appointments if participant or creator."
  const getUserAppointments = (): Appointment[] => {
    return appointments.filter((appt) => {
      if (currentUser.role === 'admin') return true;
      if (appt.creator_id === currentUser.id) return true;
      return participants.some(
        (p) => p.appointment_id === appt.id && p.user_id === currentUser.id
      );
    });
  };

  const getAppointmentParticipants = (appointmentId: string): AppointmentParticipantWithProfile[] => {
    return participants.filter((p) => p.appointment_id === appointmentId);
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules: schedules.filter((s) => currentUser.role === 'admin' || s.user_id === currentUser.id),
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

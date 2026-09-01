export type UserRole = 'admin' | 'user';

export type FrequencyType =
  | 'custom_minutes'
  | 'hourly'
  | 'half_day'
  | 'daily'
  | 'couple_of_days'
  | 'weekly'
  | 'couple_of_weeks'
  | 'monthly'
  | 'first_day_of_month'
  | 'last_day_of_month'
  | 'beginning_five_days'
  | 'last_three_days'
  | 'weekends'
  | 'custom_multi_times_per_day';

export type ParticipantStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface CustomRuleJson {
  // for custom_multi_times_per_day, e.g. ["09:00", "14:00", "20:00"]
  times_of_day?: string[];
  // for custom weekdays, e.g. [1, 3, 5] (Monday, Wednesday, Friday)
  days_of_week?: number[];
  // for custom minutes or custom interval
  custom_minutes_step?: number;
  // notes or custom labels
  tag?: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  frequency: FrequencyType;
  interval_value: number | null;
  custom_rule_json: CustomRuleJson | null;
  start_time: string;
  end_time: string | null;
  is_completed: boolean;
  created_at: string;
  // joined fields
  category?: Category | null;
}

export interface Appointment {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
  // joined fields
  creator?: Profile | null;
  participants?: AppointmentParticipantWithProfile[];
}

export interface AppointmentParticipant {
  id: string;
  appointment_id: string;
  user_id: string;
  invited_by: string | null;
  status: ParticipantStatus;
  can_reshare: boolean;
  created_at: string;
}

export interface AppointmentParticipantWithProfile extends AppointmentParticipant {
  profile?: Profile | null;
  invited_by_profile?: Profile | null;
}

// Occurrence instance calculated by Recurrence Engine
export interface ScheduleOccurrence {
  occurrenceId: string;
  scheduleId: string;
  title: string;
  description?: string | null;
  category?: Category | null;
  startTime: Date;
  endTime: Date;
  frequency: FrequencyType;
  isCompleted: boolean;
  isCustomMultiTime?: boolean;
  timeSlotLabel?: string;
  type: 'schedule';
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  color?: string;
  type: 'schedule' | 'appointment';
  isCompleted?: boolean;
  scheduleData?: Schedule;
  appointmentData?: Appointment;
  participantStatus?: ParticipantStatus;
  canReshare?: boolean;
  creator?: Profile | null;
  category?: Category | null;
}

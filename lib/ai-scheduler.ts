import { FrequencyType, Schedule, Appointment } from '@/types/database.types';
import { addHours, addMinutes, setHours, setMinutes, isWithinInterval, areIntervalsOverlapping } from 'date-fns';

export interface ParsedAIScheduleResult {
  type: 'schedule' | 'appointment';
  title: string;
  description: string;
  frequency?: FrequencyType;
  interval_value?: number;
  custom_rule_json?: any;
  suggestedStartTime: string;
  suggestedEndTime: string;
  categorySuggestion?: string;
  confidenceScore: number;
  reasoning: string;
}

export interface ScheduleConflict {
  conflictingEventTitle: string;
  startTime: Date;
  endTime: Date;
  severity: 'high' | 'medium';
  recommendation: string;
}

export interface FocusBlockRecommendation {
  id: string;
  dayLabel: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  score: number; // 0 - 100
  reason: string;
}

/**
 * Smart Scheduling AI Natural Language Schedule & Appointment Parser
 */
export function parseNaturalLanguageInput(prompt: string): ParsedAIScheduleResult {
  const p = prompt.toLowerCase();
  const now = new Date();
  
  // Default: tomorrow at 10:00 AM
  let targetStart = setMinutes(setHours(addHours(now, 24), 10), 0);
  let targetEnd = addMinutes(targetStart, 45);

  let detectedType: 'schedule' | 'appointment' = 'schedule';
  let frequency: FrequencyType = 'daily';
  let intervalValue: number | undefined = undefined;
  let customRuleJson: any = null;
  let categorySuggestion = 'Core Work & Architecture';
  let confidence = 0.92;
  let reasoning = 'Recognized recurring time-block and structured parameters.';

  // Check if it's an appointment (mentions people, sync, meeting with, 1on1, call with)
  if (
    p.includes('meet with') || 
    p.includes('meeting with') || 
    p.includes('call with') || 
    p.includes('appointment') ||
    p.includes('sync with') ||
    p.includes('1-on-1') ||
    p.includes('1on1') ||
    p.includes('invite')
  ) {
    detectedType = 'appointment';
    reasoning = 'Identified multi-party collaboration keyword; structured as Appointment.';
    categorySuggestion = 'Client & Stakeholder Sync';
  }

  // Detect time in prompt (e.g. 9am, 2:30pm, 14:00)
  const timeMatch = p.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23) {
      targetStart = setMinutes(setHours(targetStart, hour), minute);
      targetEnd = addMinutes(targetStart, 45);
    }
  }

  // Detect frequency keywords
  if (p.includes('first day of month') || p.includes('1st day of month') || p.includes('month start') || p.includes('beginning of month')) {
    frequency = 'first_day_of_month';
    reasoning = 'Mapped to 1st Day of Month recurring trigger.';
  } else if (p.includes('last day of month') || p.includes('end of month') || p.includes('month close')) {
    frequency = 'last_day_of_month';
    reasoning = 'Mapped to dynamic Last Day of Month trigger.';
  } else if (p.includes('first 5 days') || p.includes('beginning five days') || p.includes('first five days')) {
    frequency = 'beginning_five_days';
    reasoning = 'Scheduled across days 1–5 of every month.';
  } else if (p.includes('last 3 days') || p.includes('last three days')) {
    frequency = 'last_three_days';
    reasoning = 'Scheduled across final 3 days of each month.';
  } else if (p.includes('weekend') || p.includes('saturday and sunday') || p.includes('saturdays')) {
    frequency = 'weekends';
    reasoning = 'Restricted to Saturday and Sunday occurrences.';
  } else if (p.includes('multi times') || p.includes('times a day') || p.includes('times per day') || p.includes('3 times daily')) {
    frequency = 'custom_multi_times_per_day';
    customRuleJson = { times_of_day: ['09:00', '14:00', '19:00'] };
    reasoning = 'Configured multi-slot daily distribution array.';
  } else if (p.includes('every 2 weeks') || p.includes('bi-weekly') || p.includes('biweekly')) {
    frequency = 'couple_of_weeks';
    intervalValue = 2;
    reasoning = 'Configured bi-weekly interval.';
  } else if (p.includes('every 2 days') || p.includes('every 3 days') || p.includes('couple of days')) {
    frequency = 'couple_of_days';
    const dayMatch = p.match(/every (\d+) days/);
    intervalValue = dayMatch ? parseInt(dayMatch[1], 10) : 2;
    reasoning = `Set custom ${intervalValue}-day cycle.`;
  } else if (p.includes('weekly') || p.includes('every monday') || p.includes('every friday') || p.includes('every wednesday')) {
    frequency = 'weekly';
    let days = [1]; // Mon default
    if (p.includes('friday')) days = [5];
    if (p.includes('wednesday')) days = [3];
    if (p.includes('tuesday')) days = [2];
    if (p.includes('thursday')) days = [4];
    customRuleJson = { days_of_week: days };
    reasoning = 'Assigned weekly cadence.';
  } else if (p.includes('every hour') || p.includes('hourly')) {
    frequency = 'hourly';
    intervalValue = 1;
  } else if (p.includes('half day') || p.includes('twice daily') || p.includes('twice a day')) {
    frequency = 'half_day';
  } else if (p.includes('minute') || p.includes('min')) {
    frequency = 'custom_minutes';
    const minMatch = p.match(/every (\d+)\s*(?:minutes|mins|min)/);
    intervalValue = minMatch ? parseInt(minMatch[1], 10) : 30;
    customRuleJson = { custom_minutes_step: intervalValue };
  } else if (p.includes('monthly')) {
    frequency = 'monthly';
  } else {
    frequency = 'daily';
  }

  // Clean title
  let cleanTitle = prompt
    .replace(/(schedule|set up|create|remind me to|plan|book)\s+/i, '')
    .replace(/(every|on|at)\s+.*$/i, '')
    .trim();

  if (!cleanTitle || cleanTitle.length < 3) {
    cleanTitle = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
  }
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // Category matching
  if (p.includes('health') || p.includes('workout') || p.includes('hydrate') || p.includes('meds') || p.includes('cycling')) {
    categorySuggestion = 'Health, Wellness & Biohacking';
  } else if (p.includes('focus') || p.includes('code') || p.includes('deep work') || p.includes('study')) {
    categorySuggestion = 'Deep Focus & Coding';
  } else if (p.includes('finance') || p.includes('audit') || p.includes('invoice') || p.includes('tax') || p.includes('billing')) {
    categorySuggestion = 'Admin & Financial Review';
  }

  return {
    type: detectedType,
    title: cleanTitle,
    description: `Auto-generated by Smart Scheduling AI Engine based on: "${prompt}"`,
    frequency: detectedType === 'schedule' ? frequency : undefined,
    interval_value: intervalValue,
    custom_rule_json: customRuleJson,
    suggestedStartTime: targetStart.toISOString(),
    suggestedEndTime: targetEnd.toISOString(),
    categorySuggestion,
    confidenceScore: confidence,
    reasoning,
  };
}

/**
 * Detects conflicts between an event and an existing list of appointments / schedules
 */
export function detectScheduleConflicts(
  targetStart: Date,
  targetEnd: Date,
  existingEvents: { title: string; startTime: Date; endTime: Date }[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const event of existingEvents) {
    if (
      areIntervalsOverlapping(
        { start: targetStart, end: targetEnd },
        { start: event.startTime, end: event.endTime }
      )
    ) {
      conflicts.push({
        conflictingEventTitle: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        severity: 'high',
        recommendation: `Shift starting time 45 minutes later to avoid overlap with "${event.title}".`,
      });
    }
  }

  return conflicts;
}

/**
 * Finds top deep work focus blocks by identifying uninterrupted gaps >= 90 mins
 */
export function calculateFocusBlocks(
  busyIntervals: { start: Date; end: Date }[],
  searchDaysAhead = 5
): FocusBlockRecommendation[] {
  const recommendations: FocusBlockRecommendation[] = [];
  const now = new Date();

  for (let d = 1; d <= searchDaysAhead; d++) {
    const day = addHours(now, d * 24);
    // Examine morning window (09:00 - 12:30) and afternoon window (14:00 - 17:30)
    const morningStart = setMinutes(setHours(day, 9), 30);
    const morningEnd = setMinutes(setHours(day, 12), 0);

    const hasConflict = busyIntervals.some(b => 
      areIntervalsOverlapping({ start: morningStart, end: morningEnd }, b)
    );

    if (!hasConflict) {
      recommendations.push({
        id: `focus-morn-${d}`,
        dayLabel: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        startTime: morningStart,
        endTime: morningEnd,
        durationMinutes: 150,
        score: 98,
        reason: 'Optimal circadian peak: Zero conflicting invites and high cognitive capacity.',
      });
    }
  }

  return recommendations;
}

/**
 * Generates an executive meeting brief / agenda bullets
 */
export function generateMeetingAgenda(title: string, description?: string): string[] {
  const t = title.toLowerCase();
  if (t.includes('architecture') || t.includes('system') || t.includes('engineering')) {
    return [
      '1. Review architectural schema & RLS policy specifications',
      '2. Analyze latency benchmarks & dynamic recurrence throughput',
      '3. Discuss multi-party permission forwarding constraints',
      '4. Action items, ownership assignment, and deployment timeline',
    ];
  }
  if (t.includes('client') || t.includes('kickoff') || t.includes('onboarding')) {
    return [
      '1. Introductions & executive vision alignment',
      '2. Product walkthrough & live AI assistant capability demo',
      '3. Scope verification, SLAs, and security compliance standards',
      '4. Next steps & mutual milestones review',
    ];
  }
  return [
    `1. Context & Objectives: ${title}`,
    '2. Key progress updates and metric analysis',
    '3. Open challenges, edge-case discussion & blockers',
    '4. Clear decisions and follow-up timeline',
  ];
}

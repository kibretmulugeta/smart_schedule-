import {
  addDays,
  addWeeks,
  addMonths,
  addHours,
  addMinutes,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  getDate,
  getDay,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  lastDayOfMonth,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  parseISO,
} from 'date-fns';
import { Schedule, ScheduleOccurrence, FrequencyType } from '@/types/database.types';

/**
 * Calculates all occurrences of a Schedule within a specified date window.
 * Supports all 14 database frequency types plus custom JSON rules.
 */
export function getScheduleOccurrences(
  schedule: Schedule,
  windowStart: Date,
  windowEnd: Date
): ScheduleOccurrence[] {
  const occurrences: ScheduleOccurrence[] = [];
  const scheduleStart = typeof schedule.start_time === 'string' 
    ? parseISO(schedule.start_time) 
    : new Date(schedule.start_time);
  
  const scheduleEnd = schedule.end_time 
    ? (typeof schedule.end_time === 'string' ? parseISO(schedule.end_time) : new Date(schedule.end_time))
    : null;

  // If the schedule has ended before windowStart, nothing to render
  if (scheduleEnd && isBefore(scheduleEnd, windowStart)) {
    return [];
  }

  const durationMs = scheduleEnd 
    ? Math.max(15 * 60 * 1000, scheduleEnd.getTime() - scheduleStart.getTime())
    : 30 * 60 * 1000; // default 30 min

  const baseHours = scheduleStart.getHours();
  const baseMinutes = scheduleStart.getMinutes();

  // Normalize search window
  const actualStart = isBefore(scheduleStart, windowStart) ? windowStart : scheduleStart;
  const actualEnd = scheduleEnd && isBefore(scheduleEnd, windowEnd) ? scheduleEnd : windowEnd;

  const freq = schedule.frequency;
  const interval = schedule.interval_value && schedule.interval_value > 0 ? schedule.interval_value : 1;
  const customRule = schedule.custom_rule_json;

  switch (freq) {
    case 'custom_minutes': {
      const stepMinutes = customRule?.custom_minutes_step || interval || 30;
      let curr = new Date(actualStart);
      
      // Generate within active day windows
      while (isBefore(curr, actualEnd) || curr.getTime() === actualEnd.getTime()) {
        const occStart = new Date(curr);
        const occEnd = new Date(occStart.getTime() + (stepMinutes * 60 * 1000));
        
        // Keep within reasonable daily bounds (07:00 to 22:00) to prevent overwhelming
        const occHour = occStart.getHours();
        if (occHour >= 7 && occHour <= 21) {
          occurrences.push({
            occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
            scheduleId: schedule.id,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            startTime: occStart,
            endTime: occEnd,
            frequency: freq,
            isCompleted: schedule.is_completed,
            timeSlotLabel: `Every ${stepMinutes}m`,
            type: 'schedule',
          });
        }
        curr = addMinutes(curr, stepMinutes);
        if (occurrences.length > 500) break; // safety limit
      }
      break;
    }

    case 'hourly': {
      const stepHours = interval || 1;
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit)) {
        for (let h = 8; h <= 20; h += stepHours) {
          const occStart = setMinutes(setHours(currDay, h), baseMinutes);
          if (occStart >= actualStart && occStart <= actualEnd) {
            const occEnd = new Date(occStart.getTime() + durationMs);
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: occEnd,
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: `Every ${stepHours}h`,
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'half_day': {
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit)) {
        const slot1 = setMinutes(setHours(currDay, baseHours), baseMinutes);
        const slot2 = setMinutes(setHours(currDay, (baseHours + 12) % 24), baseMinutes);

        for (const slot of [slot1, slot2]) {
          if (slot >= actualStart && slot <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${slot.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: slot,
              endTime: new Date(slot.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: 'Twice daily',
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'daily': {
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        const occStart = setMinutes(setHours(currDay, baseHours), baseMinutes);
        if (occStart >= actualStart && occStart <= actualEnd) {
          occurrences.push({
            occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
            scheduleId: schedule.id,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            startTime: occStart,
            endTime: new Date(occStart.getTime() + durationMs),
            frequency: freq,
            isCompleted: schedule.is_completed,
            type: 'schedule',
          });
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'couple_of_days': {
      const stepDays = interval && interval > 1 ? interval : 2;
      let currDay = startOfDay(scheduleStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        if (currDay >= startOfDay(actualStart)) {
          const occStart = setMinutes(setHours(currDay, baseHours), baseMinutes);
          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: `Every ${stepDays} days`,
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, stepDays);
      }
      break;
    }

    case 'weekly': {
      const targetDays = customRule?.days_of_week?.length 
        ? customRule.days_of_week 
        : [getDay(scheduleStart)];

      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        const dayOfWeek = getDay(currDay);
        if (targetDays.includes(dayOfWeek)) {
          const occStart = setMinutes(setHours(currDay, baseHours), baseMinutes);
          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'couple_of_weeks': {
      const baseWeek = startOfDay(scheduleStart);
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        const weeksDiff = differenceInCalendarWeeks(currDay, baseWeek);
        if (weeksDiff % 2 === 0 && getDay(currDay) === getDay(scheduleStart)) {
          const occStart = setMinutes(setHours(currDay, baseHours), baseMinutes);
          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: 'Bi-weekly',
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'monthly': {
      const dayOfMonth = getDate(scheduleStart);
      let currMonth = startOfMonth(actualStart);
      const endMonthLimit = endOfMonth(actualEnd);

      while (isBefore(currMonth, endMonthLimit) || isSameDay(currMonth, endMonthLimit)) {
        const lastDay = getDate(lastDayOfMonth(currMonth));
        const effectiveDay = Math.min(dayOfMonth, lastDay);
        const occDate = setDate(currMonth, effectiveDay);
        const occStart = setMinutes(setHours(occDate, baseHours), baseMinutes);

        if (occStart >= actualStart && occStart <= actualEnd) {
          occurrences.push({
            occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
            scheduleId: schedule.id,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            startTime: occStart,
            endTime: new Date(occStart.getTime() + durationMs),
            frequency: freq,
            isCompleted: schedule.is_completed,
            type: 'schedule',
          });
        }
        currMonth = addMonths(currMonth, 1);
      }
      break;
    }

    case 'first_day_of_month': {
      let currMonth = startOfMonth(actualStart);
      const endMonthLimit = endOfMonth(actualEnd);

      while (isBefore(currMonth, endMonthLimit) || isSameDay(currMonth, endMonthLimit)) {
        const occDate = setDate(currMonth, 1);
        const occStart = setMinutes(setHours(occDate, baseHours), baseMinutes);

        if (occStart >= actualStart && occStart <= actualEnd) {
          occurrences.push({
            occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
            scheduleId: schedule.id,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            startTime: occStart,
            endTime: new Date(occStart.getTime() + durationMs),
            frequency: freq,
            isCompleted: schedule.is_completed,
            timeSlotLabel: '1st of month',
            type: 'schedule',
          });
        }
        currMonth = addMonths(currMonth, 1);
      }
      break;
    }

    case 'last_day_of_month': {
      let currMonth = startOfMonth(actualStart);
      const endMonthLimit = endOfMonth(actualEnd);

      while (isBefore(currMonth, endMonthLimit) || isSameDay(currMonth, endMonthLimit)) {
        const lastDate = lastDayOfMonth(currMonth);
        const occStart = setMinutes(setHours(lastDate, baseHours), baseMinutes);

        if (occStart >= actualStart && occStart <= actualEnd) {
          occurrences.push({
            occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
            scheduleId: schedule.id,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            startTime: occStart,
            endTime: new Date(occStart.getTime() + durationMs),
            frequency: freq,
            isCompleted: schedule.is_completed,
            timeSlotLabel: 'Month end',
            type: 'schedule',
          });
        }
        currMonth = addMonths(currMonth, 1);
      }
      break;
    }

    case 'beginning_five_days': {
      let currMonth = startOfMonth(actualStart);
      const endMonthLimit = endOfMonth(actualEnd);

      while (isBefore(currMonth, endMonthLimit) || isSameDay(currMonth, endMonthLimit)) {
        for (let d = 1; d <= 5; d++) {
          const occDate = setDate(currMonth, d);
          const occStart = setMinutes(setHours(occDate, baseHours), baseMinutes);

          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: `Day ${d}/5`,
              type: 'schedule',
            });
          }
        }
        currMonth = addMonths(currMonth, 1);
      }
      break;
    }

    case 'last_three_days': {
      let currMonth = startOfMonth(actualStart);
      const endMonthLimit = endOfMonth(actualEnd);

      while (isBefore(currMonth, endMonthLimit) || isSameDay(currMonth, endMonthLimit)) {
        const lastDay = getDate(lastDayOfMonth(currMonth));
        for (let d = lastDay - 2; d <= lastDay; d++) {
          const occDate = setDate(currMonth, d);
          const occStart = setMinutes(setHours(occDate, baseHours), baseMinutes);

          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: `Month close (Day ${d})`,
              type: 'schedule',
            });
          }
        }
        currMonth = addMonths(currMonth, 1);
      }
      break;
    }

    case 'weekends': {
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        const dayOfWeek = getDay(currDay);
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const occStart = setMinutes(setHours(currDay, baseHours), baseMinutes);
          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              timeSlotLabel: dayOfWeek === 6 ? 'Saturday' : 'Sunday',
              type: 'schedule',
            });
          }
        }
        currDay = addDays(currDay, 1);
      }
      break;
    }

    case 'custom_multi_times_per_day': {
      const timesList = customRule?.times_of_day?.length 
        ? customRule.times_of_day 
        : ['09:00', '14:00', '19:00'];
      
      let currDay = startOfDay(actualStart);
      const endDayLimit = endOfDay(actualEnd);

      while (isBefore(currDay, endDayLimit) || isSameDay(currDay, endDayLimit)) {
        timesList.forEach((timeStr) => {
          const [hStr, mStr] = timeStr.split(':');
          const h = parseInt(hStr, 10) || 0;
          const m = parseInt(mStr, 10) || 0;

          const occStart = setMinutes(setHours(currDay, h), m);
          if (occStart >= actualStart && occStart <= actualEnd) {
            occurrences.push({
              occurrenceId: `${schedule.id}_${occStart.toISOString()}`,
              scheduleId: schedule.id,
              title: schedule.title,
              description: schedule.description,
              category: schedule.category,
              startTime: occStart,
              endTime: new Date(occStart.getTime() + durationMs),
              frequency: freq,
              isCompleted: schedule.is_completed,
              isCustomMultiTime: true,
              timeSlotLabel: timeStr,
              type: 'schedule',
            });
          }
        });
        currDay = addDays(currDay, 1);
      }
      break;
    }
  }

  return occurrences.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Human-readable frequency label formatter
 */
export function formatFrequencyLabel(
  frequency: FrequencyType,
  intervalValue?: number | null,
  customRule?: any
): string {
  switch (frequency) {
    case 'custom_minutes':
      return `Every ${customRule?.custom_minutes_step || intervalValue || 30} minutes`;
    case 'hourly':
      return intervalValue && intervalValue > 1 ? `Every ${intervalValue} hours` : 'Hourly';
    case 'half_day':
      return 'Twice a Day (12h)';
    case 'daily':
      return 'Daily';
    case 'couple_of_days':
      return `Every ${intervalValue || 2} Days`;
    case 'weekly':
      if (customRule?.days_of_week?.length) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Weekly on ${customRule.days_of_week.map((d: number) => days[d]).join(', ')}`;
      }
      return 'Weekly';
    case 'couple_of_weeks':
      return 'Every 2 Weeks (Bi-weekly)';
    case 'monthly':
      return 'Monthly';
    case 'first_day_of_month':
      return '1st Day of Each Month';
    case 'last_day_of_month':
      return 'Last Day of Each Month';
    case 'beginning_five_days':
      return 'First 5 Days of Each Month (Days 1–5)';
    case 'last_three_days':
      return 'Last 3 Days of Each Month';
    case 'weekends':
      return 'Weekends Only (Sat & Sun)';
    case 'custom_multi_times_per_day':
      if (customRule?.times_of_day?.length) {
        return `Multi-times: ${customRule.times_of_day.join(', ')}`;
      }
      return 'Custom Multi-times per Day';
    default:
      return frequency;
  }
}

'use client';

import React, { useState, useEffect } from 'react';
import { FrequencyType, Schedule, Category, CustomRuleJson } from '@/types/database.types';
import { useSchedule } from '@/context/schedule-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatFrequencyLabel } from '@/lib/recurrence-engine';
import { Clock, Plus, Trash2, Calendar, Sparkles, Check } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchedule?: Schedule | null;
  defaultStartTime?: Date;
}

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string; desc: string }[] = [
  { value: 'daily', label: 'Daily', desc: 'Every day at the specified time' },
  { value: 'weekly', label: 'Weekly', desc: 'Specific day(s) of the week' },
  { value: 'custom_multi_times_per_day', label: 'Multi-Times Per Day', desc: 'Multiple specific times each day (e.g. 9am, 2pm, 7pm)' },
  { value: 'custom_minutes', label: 'Custom Minutes', desc: 'Every X minutes (e.g. 30m, 45m)' },
  { value: 'hourly', label: 'Hourly', desc: 'Every X hours during active day' },
  { value: 'half_day', label: 'Twice a Day (12h)', desc: 'Morning & evening intervals' },
  { value: 'couple_of_days', label: 'Every N Days', desc: 'Recur every 2, 3, or N days' },
  { value: 'couple_of_weeks', label: 'Bi-Weekly', desc: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', desc: 'Same day of every month' },
  { value: 'first_day_of_month', label: '1st of Month', desc: 'Triggers on the 1st of each month' },
  { value: 'last_day_of_month', label: 'Last Day of Month', desc: 'Dynamic last day (28/29/30/31)' },
  { value: 'beginning_five_days', label: 'First 5 Days', desc: 'Days 1, 2, 3, 4, 5 of each month' },
  { value: 'last_three_days', label: 'Last 3 Days', desc: 'Final 3 days of each month' },
  { value: 'weekends', label: 'Weekends Only', desc: 'Saturdays and Sundays' },
];

export function ScheduleModal({
  isOpen,
  onClose,
  initialSchedule,
  defaultStartTime,
}: ScheduleModalProps) {
  const { createSchedule, updateSchedule, categories, createCategory } = useSchedule();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [intervalValue, setIntervalValue] = useState<number>(1);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');

  // Custom Rules
  const [multiTimes, setMultiTimes] = useState<string[]>(['09:00', '14:00', '19:00']);
  const [newTimeSlot, setNewTimeSlot] = useState('12:00');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [minutesStep, setMinutesStep] = useState<number>(30);

  // New category inline
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');

  useEffect(() => {
    if (initialSchedule) {
      setTitle(initialSchedule.title);
      setDescription(initialSchedule.description || '');
      setCategoryId(initialSchedule.category_id || '');
      setFrequency(initialSchedule.frequency);
      setIntervalValue(initialSchedule.interval_value || 1);
      
      const s = new Date(initialSchedule.start_time);
      setStartDateTime(formatToDateTimeLocal(s));
      if (initialSchedule.end_time) {
        setEndDateTime(formatToDateTimeLocal(new Date(initialSchedule.end_time)));
      }

      if (initialSchedule.custom_rule_json?.times_of_day) {
        setMultiTimes(initialSchedule.custom_rule_json.times_of_day);
      }
      if (initialSchedule.custom_rule_json?.days_of_week) {
        setSelectedWeekdays(initialSchedule.custom_rule_json.days_of_week);
      }
      if (initialSchedule.custom_rule_json?.custom_minutes_step) {
        setMinutesStep(initialSchedule.custom_rule_json.custom_minutes_step);
      }
    } else {
      const base = defaultStartTime || new Date();
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setFrequency('daily');
      setIntervalValue(1);
      setStartDateTime(formatToDateTimeLocal(base));
      const end = new Date(base.getTime() + 45 * 60 * 1000);
      setEndDateTime(formatToDateTimeLocal(end));
      setMultiTimes(['09:00', '14:00', '19:00']);
      setSelectedWeekdays([1, 3, 5]);
      setMinutesStep(30);
    }
  }, [initialSchedule, defaultStartTime, isOpen, categories]);

  function formatToDateTimeLocal(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  const handleAddMultiTime = () => {
    if (newTimeSlot && !multiTimes.includes(newTimeSlot)) {
      setMultiTimes([...multiTimes, newTimeSlot].sort());
    }
  };

  const handleRemoveMultiTime = (timeToRemove: string) => {
    setMultiTimes(multiTimes.filter((t) => t !== timeToRemove));
  };

  const toggleWeekday = (dayIndex: number) => {
    if (selectedWeekdays.includes(dayIndex)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayIndex].sort());
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCatName.trim()) return;
    const cat = await createCategory(newCatName.trim(), newCatColor);
    setCategoryId(cat.id);
    setShowNewCat(false);
    setNewCatName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let customRule: CustomRuleJson | null = null;
    if (frequency === 'custom_multi_times_per_day') {
      customRule = { times_of_day: multiTimes };
    } else if (frequency === 'weekly') {
      customRule = { days_of_week: selectedWeekdays };
    } else if (frequency === 'custom_minutes') {
      customRule = { custom_minutes_step: minutesStep };
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      frequency,
      interval_value: intervalValue,
      custom_rule_json: customRule,
      start_time: new Date(startDateTime).toISOString(),
      end_time: endDateTime ? new Date(endDateTime).toISOString() : null,
      is_completed: initialSchedule ? initialSchedule.is_completed : false,
    };

    if (initialSchedule) {
      await updateSchedule(initialSchedule.id, payload);
    } else {
      await createSchedule(payload);
    }

    onClose();
  };

  const weekdays = [
    { label: 'Sun', index: 0 },
    { label: 'Mon', index: 1 },
    { label: 'Tue', index: 2 },
    { label: 'Wed', index: 3 },
    { label: 'Thu', index: 4 },
    { label: 'Fri', index: 5 },
    { label: 'Sat', index: 6 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSchedule ? 'Edit Schedule & Recurrence' : 'Create Recurring Schedule'}
      subtitle="Configure dynamic frequencies, custom intervals, and categorization."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="Schedule Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Morning Neuro-Focus Block, Core Standup, Financial Close"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description & Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Details, link, or agenda..."
          />
        </div>

        {/* Category Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowNewCat(!showNewCat)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewCat ? 'Cancel' : 'New Category'}
            </button>
          </div>

          {showNewCat ? (
            <div className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <Button type="button" size="sm" onClick={handleCreateNewCategory}>
                Save
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Frequency Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Recurrence Frequency *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = frequency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`flex flex-col p-2.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-glow-primary/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-100 flex items-center justify-between">
                    {opt.label}
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Frequency Parameters */}
        {frequency === 'custom_minutes' && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-indigo-200">
              Minute Interval (e.g. 15, 30, 45, 60 minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={180}
                step={5}
                value={minutesStep}
                onChange={(e) => setMinutesStep(parseInt(e.target.value, 10) || 30)}
                className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
              <span className="text-xs text-slate-400">minutes between each occurrence</span>
            </div>
          </div>
        )}

        {frequency === 'hourly' && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-indigo-200">
              Hour Interval (Every X Hours)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={intervalValue}
              onChange={(e) => setIntervalValue(parseInt(e.target.value, 10) || 1)}
              className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
            />
          </div>
        )}

        {frequency === 'couple_of_days' && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-indigo-200">
              Day Interval (e.g. every 2 or 3 days)
            </label>
            <input
              type="number"
              min={2}
              max={30}
              value={intervalValue}
              onChange={(e) => setIntervalValue(parseInt(e.target.value, 10) || 2)}
              className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
            />
          </div>
        )}

        {frequency === 'weekly' && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-indigo-200">
              Active Days of the Week
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {weekdays.map((w) => {
                const isActive = selectedWeekdays.includes(w.index);
                return (
                  <button
                    key={w.index}
                    type="button"
                    onClick={() => toggleWeekday(w.index)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {frequency === 'custom_multi_times_per_day' && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-3">
            <label className="block text-xs font-semibold text-indigo-200">
              Daily Time Slots Array
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {multiTimes.map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded-lg text-xs font-mono font-bold"
                >
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {time}
                  <button
                    type="button"
                    onClick={() => handleRemoveMultiTime(time)}
                    className="text-rose-400 hover:text-rose-300 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="time"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddMultiTime}>
                <Plus className="w-3 h-3" /> Add Time
              </Button>
            </div>
          </div>
        )}

        {/* Date Time Bounds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start Date & Base Time *
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
              End Date / Expiry (Optional)
            </label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Live Recurrence Preview */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-indigo-300">Recurrence Summary: </span>
            <span className="text-slate-300">
              {formatFrequencyLabel(frequency, intervalValue, {
                days_of_week: selectedWeekdays,
                times_of_day: multiTimes,
                custom_minutes_step: minutesStep,
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialSchedule ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { FrequencyBadge } from '@/components/schedules/frequency-badge';
import { ScheduleModal } from '@/components/schedules/schedule-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Schedule, FrequencyType } from '@/types/database.types';
import {
  Plus,
  Repeat,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Search,
  Filter,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

export default function SchedulesPage() {
  const {
    schedules,
    categories,
    deleteSchedule,
    toggleScheduleCompleted,
  } = useSchedule();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedFreq, setSelectedFreq] = useState<FrequencyType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const filtered = schedules.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || s.category_id === selectedCategory;
    const matchesFreq = selectedFreq === 'all' || s.frequency === selectedFreq;

    return matchesSearch && matchesCat && matchesFreq;
  });

  const completedCount = schedules.filter((s) => s.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Repeat className="w-4 h-4" /> Personal Schedules & Habits
          </div>
          <h1 className="text-2xl font-black text-white">Recurring Schedules & Workflows</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Manage your dynamic recurrence cadences across 14 frequency engines including multi-times per day, custom minute intervals, and monthly edge days.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingSchedule(null);
            setIsModalOpen(true);
          }}
          className="self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Create New Schedule
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Active Schedules</div>
          <div className="text-2xl font-black text-white mt-1">{schedules.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Completed Habits (Today)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
            {completedCount} <span className="text-xs text-slate-400 font-normal">/ {schedules.length}</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Completion Rate</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">
            {schedules.length > 0 ? Math.round((completedCount / schedules.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedules by title or keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Frequency filter */}
        <select
          value={selectedFreq}
          onChange={(e) => setSelectedFreq(e.target.value as any)}
          className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Frequencies</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom_multi_times_per_day">Multi-Times Per Day</option>
          <option value="first_day_of_month">1st of Month</option>
          <option value="last_day_of_month">Last Day of Month</option>
          <option value="beginning_five_days">Beginning 5 Days</option>
          <option value="last_three_days">Last 3 Days</option>
          <option value="weekends">Weekends</option>
          <option value="custom_minutes">Custom Minutes</option>
          <option value="hourly">Hourly</option>
        </select>
      </div>

      {/* Schedules Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((schedule) => {
          const cat = categories.find((c) => c.id === schedule.category_id);
          return (
            <div
              key={schedule.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleScheduleCompleted(schedule.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                      title={schedule.is_completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {schedule.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-sm font-bold ${
                          schedule.is_completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {schedule.title}
                      </h3>
                      {cat && (
                        <span
                          className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}40`,
                            color: cat.color,
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {schedule.description && (
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {schedule.description}
                  </p>
                )}
              </div>

              {/* Footer details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between pl-8">
                <FrequencyBadge
                  frequency={schedule.frequency}
                  intervalValue={schedule.interval_value}
                  customRule={schedule.custom_rule_json}
                />
                <div className="text-[11px] font-mono text-slate-400">
                  {format(new Date(schedule.start_time), 'h:mm a')}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
            <Repeat className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-300">No matching schedules found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or create a new recurring schedule.
            </p>
          </div>
        )}
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        initialSchedule={editingSchedule}
      />
    </div>
  );
}

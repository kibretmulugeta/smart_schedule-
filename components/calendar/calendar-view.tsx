'use client';

import React, { useState } from 'react';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
} from 'date-fns';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { MonthGrid } from './month-grid';
import { WeekGrid } from './week-grid';
import { DayGrid } from './day-grid';
import { AgendaView } from './agenda-view';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScheduleModal } from '@/components/schedules/schedule-modal';
import { AppointmentModal } from '@/components/appointments/appointment-modal';
import { ForwardModal } from '@/components/appointments/forward-modal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Sparkles,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import { Appointment, Schedule } from '@/types/database.types';

export function CalendarView() {
  const {
    schedules,
    appointments,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    getUserAppointments,
  } = useSchedule();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Modal triggers
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [selectedAppointmentForForward, setSelectedAppointmentForForward] = useState<Appointment | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date>(new Date());

  // Navigation handlers
  const handlePrev = () => {
    if (activeTab === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (activeTab === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (activeTab === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (activeTab === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (date: Date) => {
    setModalInitialDate(date);
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    if (event.type === 'appointment') {
      setEditingAppointment(event);
      setIsAppointmentModalOpen(true);
    } else {
      const originalSchedule = schedules.find((s) => s.id === event.scheduleId);
      if (originalSchedule) {
        setEditingSchedule(originalSchedule);
        setIsScheduleModalOpen(true);
      }
    }
  };

  const handleForward = (appt: Appointment) => {
    setSelectedAppointmentForForward(appt);
    setIsForwardModalOpen(true);
  };

  const userAppointments = getUserAppointments();

  const tabsConfig = [
    { id: 'month', label: 'Month' },
    { id: 'week', label: 'Week' },
    { id: 'day', label: 'Day' },
    { id: 'agenda', label: 'Agenda Stream' },
  ];

  return (
    <div className="space-y-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-100 min-w-[180px]">
            {activeTab === 'day'
              ? format(currentDate, 'MMMM d, yyyy')
              : format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingAppointment(null);
                setModalInitialDate(new Date());
                setIsAppointmentModalOpen(true);
              }}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">New</span> Meeting
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingSchedule(null);
                setModalInitialDate(new Date());
                setIsScheduleModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 flex-shrink-0 pl-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter:
        </span>
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
            selectedCategoryId === null
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${
                isSelected
                  ? 'border-indigo-500 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
              style={isSelected ? { backgroundColor: `${cat.color}30`, borderColor: cat.color } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Calendar Grid View */}
      {activeTab === 'month' && (
        <MonthGrid
          currentDate={currentDate}
          schedules={schedules}
          appointments={userAppointments}
          selectedCategoryId={selectedCategoryId}
          onSelectDate={(date) => {
            setCurrentDate(date);
            setActiveTab('day');
          }}
          onAddScheduleForDate={(date) => handleSlotClick(date)}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {activeTab === 'week' && (
        <WeekGrid
          currentDate={currentDate}
          schedules={schedules}
          appointments={userAppointments}
          selectedCategoryId={selectedCategoryId}
          onSelectEvent={handleSelectEvent}
          onSlotClick={handleSlotClick}
        />
      )}

      {activeTab === 'day' && (
        <DayGrid
          currentDate={currentDate}
          schedules={schedules}
          appointments={userAppointments}
          selectedCategoryId={selectedCategoryId}
          onSelectEvent={handleSelectEvent}
          onSlotClick={handleSlotClick}
        />
      )}

      {activeTab === 'agenda' && (
        <AgendaView
          currentDate={currentDate}
          schedules={schedules}
          appointments={userAppointments}
          selectedCategoryId={selectedCategoryId}
          onSelectEvent={handleSelectEvent}
          onForwardAppointment={handleForward}
        />
      )}

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        initialSchedule={editingSchedule}
        defaultStartTime={modalInitialDate}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setEditingAppointment(null);
        }}
        initialAppointment={editingAppointment}
        defaultStartTime={modalInitialDate}
      />

      <ForwardModal
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false);
          setSelectedAppointmentForForward(null);
        }}
        appointment={selectedAppointmentForForward}
      />
    </div>
  );
}

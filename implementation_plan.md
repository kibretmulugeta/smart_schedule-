# Implementation Plan: Antigravity AI Scheduling & Appointment System

Build a production-level, fully typed, high-performance web application named **"Antigravity AI Scheduling & Appointment System"** using Next.js (App Router), Tailwind CSS, TypeScript, and Supabase (PostgreSQL, Auth, and Row Level Security).

## User Review Required

> [!IMPORTANT]
> - **Database Schema & RLS**: We will include the exact PostgreSQL schema provided, with full support for all 14 `frequency_type` enums, `user_role` enums, `appointment_participants` with secondary forwarding (`can_reshare`), and strict RLS policies in `supabase/schema.sql`.
> - **Dual Supabase / Demo Mode**: The application will connect directly to any real Supabase instance via `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and will also include a zero-config, highly realistic Mock/Demo state with instant Role switching (Admin, Standard User, Colleague) so that all features (appointments, multi-party RSVPs, secondary reshare, AI scheduling) can be tested immediately in the browser.

---

## Key Features & Architecture

### 1. Database & Type Safety Layer
- **`supabase/schema.sql`**: Full schema with tables (`profiles`, `categories`, `schedules`, `appointments`, `appointment_participants`), enums (`user_role`, `frequency_type`), triggers for `auth.users` profile synchronization, and complete Row Level Security policies.
- **`types/database.types.ts`**: 100% typed TypeScript interfaces for Supabase tables, enums, insert/update payloads, and recurrence parameters.

### 2. Algorithmic Recurrence Engine (`lib/recurrence-engine.ts`)
Calculates event occurrences across any time window (Day, Week, Month, Year) supporting all 14 frequency types:
1. `custom_minutes` (e.g. every 15, 30, 45 mins)
2. `hourly` (every X hours)
3. `half_day` (twice a day / 12h intervals)
4. `daily` (every day at set time)
5. `couple_of_days` (every 2, 3, or N days)
6. `weekly` (weekly recurrence on selected day(s))
7. `couple_of_weeks` (bi-weekly)
8. `monthly` (same day of month)
9. `first_day_of_month` (1st day of every month)
10. `last_day_of_month` (dynamic last day 28/29/30/31 of every month)
11. `beginning_five_days` (days 1–5 of every month)
12. `last_three_days` (last 3 days of every month)
13. `weekends` (Saturdays and Sundays)
14. `custom_multi_times_per_day` (arbitrary time arrays stored in `custom_rule_json`, e.g. `["08:00", "12:30", "17:00", "21:00"]`)

### 3. Antigravity AI Assistant & Natural Language Engine
- **Natural Language Parsing**: Translates human prompts (e.g., *"Schedule team standup every weekday at 10am and coffee with Elena on weekends at 3pm"*) into typed schedules/appointments with exact frequency assignments.
- **Conflict Detection & Smart Resolution**: Analyzes participant availability and highlights overlapping appointments.
- **AI Focus Time Optimizer**: Identifies fragmented gaps and suggests continuous deep-work focus blocks.
- **Agenda & Meeting Brief Generator**: Creates structured agenda bullet points based on appointment title and description.

### 4. Multi-Party Appointment & Forwarding System
- Create appointments with start & end times, location/video link, and invite participants.
- Manage RSVP statuses (`pending`, `accepted`, `declined`).
- Secondary forwarding permissions: If `can_reshare` is enabled, attendees can forward invites to additional users.
- Live participant status badges and attendee management.

### 5. Interactive Master Calendar & Views
- **Month Grid**: Interactive multi-event view with recurring schedule markers and category colors.
- **Week & Day Timetable**: Hourly time-block view with conflict detection overlays and drag-to-slot interaction.
- **Agenda View**: Chronological upcoming timeline with completion checkoffs and search/filter.
- **Category Filter**: Filter views by custom color-coded categories (Work, Personal, Health, Deep Focus, etc.).

### 6. Admin Center & Role Management
- Admin dashboard displaying all registered profiles.
- Role management (Elevate User to Admin, Demote Admin to User) strictly aligned with the schema RLS policies.
- System metrics (Total Users, Active Schedules, Scheduled Appointments, Recurrence Distribution).

---

## Proposed Changes

```
smart schedule/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    (Dashboard & Master Interactive Calendar)
│   ├── schedules/page.tsx          (Personal Schedules & Habit Manager)
│   ├── appointments/page.tsx       (Appointments & Collaborative Invitations)
│   ├── ai/page.tsx                 (Antigravity AI Assistant & Optimization Hub)
│   ├── admin/page.tsx              (Admin Role Management & Telemetry)
│   ├── settings/page.tsx           (Profile & Category Management)
│   ├── auth/login/page.tsx         (Supabase Auth & Demo User Switcher)
│   ├── api/ai/parse/route.ts       (Natural Language Schedule Parser Endpoint)
│   └── api/ai/optimize/route.ts    (Schedule Optimization API Endpoint)
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── app-shell.tsx
│   ├── calendar/
│   │   ├── calendar-view.tsx
│   │   ├── month-grid.tsx
│   │   ├── week-grid.tsx
│   │   ├── day-grid.tsx
│   │   └── agenda-view.tsx
│   ├── schedules/
│   │   ├── schedule-modal.tsx
│   │   ├── schedule-card.tsx
│   │   ├── schedule-list.tsx
│   │   └── frequency-badge.tsx
│   ├── appointments/
│   │   ├── appointment-modal.tsx
│   │   ├── appointment-card.tsx
│   │   ├── forward-modal.tsx
│   │   └── participant-avatar-group.tsx
│   ├── ai/
│   │   ├── ai-assistant-modal.tsx
│   │   ├── ai-chat-dock.tsx
│   │   └── ai-conflict-banner.tsx
│   ├── admin/
│   │   ├── admin-user-table.tsx
│   │   └── telemetry-cards.tsx
│   └── ui/
│       ├── button.tsx, badge.tsx, modal.tsx, tabs.tsx, toast.tsx, dropdown.tsx, input.tsx
├── context/
│   ├── auth-context.tsx            (Supabase Auth + Instant Demo Switcher)
│   ├── schedule-context.tsx        (Unified state for Schedules, Appointments, Categories)
│   └── toast-context.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── recurrence-engine.ts        (Mathematical engine for all 14 frequency types)
│   ├── ai-scheduler.ts             (AI NLP parser, conflict resolver, agenda generator)
│   ├── mock-data.ts                (Initial mock users, categories, recurring schedules & invites)
│   └── utils.ts
├── types/
│   └── database.types.ts           (Full PostgreSQL Types, Tables, Enums)
├── supabase/
│   └── schema.sql                  (Complete Supabase SQL migration script)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.mjs
```

---

## Verification Plan

### Automated Build & Typecheck
- Run `npm run build` or `npx tsc --noEmit` to verify 100% strict TypeScript compliance with zero type errors.
- Test recurrence calculations for all 14 frequency enums against edge cases (leap years, month end 28/29/30/31, multi-times per day).

### Manual Verification
1. **Interactive Calendar**:
   - Verify Month, Week, Day, and Agenda views display correct recurring instances.
   - Verify Category color badges and filters.
2. **Frequency Testing**:
   - Create schedules with `first_day_of_month`, `last_day_of_month`, `beginning_five_days`, `last_three_days`, `weekends`, `custom_multi_times_per_day` (e.g., `["09:00", "14:00", "19:00"]`), and `custom_minutes`.
3. **Multi-Party Appointments & Reshare**:
   - Create an appointment as User A, invite User B with `can_reshare = true`.
   - Switch user to User B, verify appointment appears in their view, RSVP to "Accepted", and forward invite to User C.
4. **AI Assistant**:
   - Test natural language prompt input (e.g. *"Schedule a 30-min strategy review every Monday at 10 AM"*).
   - Test AI Conflict Resolver and Deep Work Focus optimizer.
5. **Admin Access & Role Elevation**:
   - Switch to Admin role, access Admin Dashboard, change user role from `user` to `admin` and vice-versa.

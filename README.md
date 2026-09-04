# Smart Scheduling & Appointment System

An enterprise-grade, fully typed full-stack scheduling and collaborative appointment management application built with **Next.js (App Router)**, **Tailwind CSS**, **TypeScript**, and **Supabase (PostgreSQL 16, Auth, and Row Level Security)**.

---

## Key Features

### 1. Dynamic Recurrence Engine (14 Frequency Types)
Supports complex scheduling frequencies:
- `custom_minutes`: Every X minutes (e.g. 15m, 30m, 45m)
- `hourly`: Hourly intervals
- `half_day`: Twice daily (12h intervals)
- `daily`: Daily recurrence at fixed time
- `couple_of_days`: Every 2, 3, or N days
- `weekly`: Specific weekday(s)
- `couple_of_weeks`: Bi-weekly cadence
- `monthly`: Same day each month
- `first_day_of_month`: 1st day of every month
- `last_day_of_month`: Dynamic last day (28/29/30/31) of each month
- `beginning_five_days`: Days 1–5 of every month
- `last_three_days`: Final 3 days of each month
- `weekends`: Saturdays and Sundays
- `custom_multi_times_per_day`: Arbitrary time slot arrays (e.g. `["09:00", "14:00", "19:30"]`) stored in `custom_rule_json`.

### 2. Multi-Party Appointments & Forwarding (RLS Enforced)
- Multi-user invitations with RSVP management (`pending`, `accepted`, `declined`).
- Secondary invitation forwarding governed by the schema's `can_reshare` attribute and Row Level Security policies.
- Attendee roster with live status badges.

### 3. Smart Scheduling AI Assistant & Natural Language Engine
- **Natural Language Parsing**: Translates human prompts (e.g. *"Schedule 30m team sync every weekend at 10am"*) into typed recurrence parameters.
- **Conflict Detection**: Flags overlapping appointments and offers smart resolution time offsets.
- **Deep Work Focus Optimizer**: Analyzes open calendar slots and suggests 90–150 minute circadian focus blocks.
- **AI Meeting Agenda Generator**: Automatically structures meeting agendas.

### 4. Interactive Master Calendar & Views
- **Month Grid**: Interactive multi-event view with color-coded categories and recurrence markers.
- **Week & Day Timetable**: Hourly time-block view with conflict detection overlays and drag-to-slot interaction.
- **Agenda View**: Chronological upcoming timeline with completion checkoffs and search/filter.

### 5. Comprehensive Registration & Auth System
- **Multi-Tab Auth Center**: Dedicated Sign In, Register, and 1-Click Instant Persona Switcher tabs.
- **Live Password Security Meter**: Real-time visual evaluation of password strength criteria (8+ chars, uppercase, numbers, special symbols).
- **Reusable Auth Modal**: Popup authentication modal available anywhere in the app.
- **Single Sign-On (SSO)**: Google Workspace and GitHub OAuth option buttons.
- **Session Control & Log Out**: Prominent top header **Log Out** button and sidebar session controls with instant state cleanup.
- **Forgot Password Modal**: Recovery email dispatch system.

### 6. Role-Based Access Control & Admin Center
- Elevation and demotion of roles (`admin` vs `user`) strictly enforced by PostgreSQL RLS.
- Interactive persona switcher to test permissions in real time.

---

## Database Schema (PostgreSQL / Supabase)

The complete SQL setup is available at [`supabase/schema.sql`](supabase/schema.sql).

### Tables & Enums:
- `user_role` enum: `'admin'`, `'user'`
- `frequency_type` enum: 14 frequency variations
- `public.profiles`: Extends `auth.users` with `role`, `full_name`, `avatar_url`.
- `public.categories`: User-defined color-coded categories.
- `public.schedules`: Recurring schedules with `frequency`, `interval_value`, `custom_rule_json`, and completion state.
- `public.appointments`: Multi-party meetings with `creator_id`, `start_time`, `end_time`.
- `public.appointment_participants`: Multi-party RSVP states and `can_reshare` forwarding permissions.

---

## Deployment (Vercel & Render)

### Automated GitHub Deployment
The project is configured for continuous deployment on both **Vercel** (`vercel.json`) and **Render** (`render.yaml`). Pushing to the `main` branch automatically builds and deploys the latest version.

```bash
git push origin main
```

### Manual Production Build
```bash
npm run build
npm start
```

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/kibretmulugeta/smart_schedule-.git
cd smart_schedule-
npm install
```

### 2. Environment Setup (Optional)
Copy `.env.example` to `.env.local` to connect a live Supabase instance:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(The application also includes an instant zero-config interactive Demo persona system ready to run immediately).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License
MIT

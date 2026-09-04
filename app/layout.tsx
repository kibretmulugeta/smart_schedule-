import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/toast-context';
import { NotificationProvider } from '@/context/notification-context';
import { AuthProvider } from '@/context/auth-context';
import { ScheduleProvider } from '@/context/schedule-context';
import { AppShell } from '@/components/layout/app-shell';
import { ReminderNotifier } from '@/components/reminders/reminder-notifier';

export const metadata: Metadata = {
  title: 'Smart Scheduling & Appointment System',
  description:
    'Production-grade dynamic recurrence engine, multi-party appointment scheduling, and AI focus optimization powered by Next.js & Supabase PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>
              <ScheduleProvider>
                <AppShell>{children}</AppShell>
                <ReminderNotifier />
              </ScheduleProvider>
            </AuthProvider>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}


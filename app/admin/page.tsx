'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  Lock,
  ArrowUpRight,
  UserCheck,
  UserX,
  Layers,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

export default function AdminPage() {
  const { currentUser, allProfiles, isAdmin, updateUserRole, switchUser } = useAuth();
  const { schedules, appointments, participants } = useSchedule();

  const totalUsers = allProfiles.length;
  const adminCount = allProfiles.filter((p) => p.role === 'admin').length;
  const standardUserCount = allProfiles.filter((p) => p.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> System Governance & Access Control
          </div>
          <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Enforce PostgreSQL Row Level Security (RLS) policies, manage elevated roles, and audit cross-tenant scheduling metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge
            variant={isAdmin ? 'warning' : 'danger'}
            className="px-3 py-1 text-xs"
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Privilege Active
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" /> Standard User (RLS Restricted)
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Access Denied / Persona Switcher notice if user is not admin */}
      {!isAdmin && (
        <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-3 text-amber-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            Row Level Security (RLS) Policy Notice
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your active persona (<span className="font-bold text-white">{currentUser.full_name}</span>) has role{' '}
            <span className="font-mono text-amber-300 font-bold uppercase">{currentUser.role}</span>. As defined in the Supabase schema policy:{' '}
            <code className="px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded font-mono text-[11px]">
              &quot;Admins can update user roles.&quot; on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = &apos;admin&apos;))
            </code>
            , you cannot modify roles unless you switch to an Admin persona.
          </p>
          <div className="pt-1">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const adminProfile = allProfiles.find((p) => p.role === 'admin');
                if (adminProfile) switchUser(adminProfile.id);
              }}
            >
              <ShieldCheck className="w-4 h-4" /> Switch to Admin Persona (Alex Vance)
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Profiles</div>
          <div className="text-2xl font-black text-white mt-1">{totalUsers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Admin Accounts</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{adminCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Standard Users</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{standardUserCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Appointments</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{appointments.length}</div>
        </div>
      </div>

      {/* User Profiles & Roles Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              User Profiles & Role Administration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Elevate user permissions or downgrade roles with instant RLS enforcement.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allProfiles.map((profile) => {
                const isSelf = profile.id === currentUser.id;
                return (
                  <tr key={profile.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                          {profile.avatar_url && (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.full_name || 'User'}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            {profile.full_name}
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            UUID: {profile.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {profile.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          profile.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {profile.role === 'admin' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        {profile.role}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {profile.role === 'admin' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateUserRole(profile.id, 'user')}
                          disabled={!isAdmin}
                          title="Demote to standard user"
                        >
                          Demote to User
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateUserRole(profile.id, 'admin')}
                          disabled={!isAdmin}
                          title="Elevate to admin"
                        >
                          Promote to Admin
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PostgreSQL Telemetry Schema Specs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Active PostgreSQL 16 Schema & Row Level Security Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 space-y-1">
            <div className="text-emerald-400 font-bold">// Profiles RLS Policy</div>
            <div>&quot;Public profiles are viewable by everyone.&quot; (select: true)</div>
            <div>&quot;Users can update own profile.&quot; (update: auth.uid() = id)</div>
            <div>&quot;Admins can update user roles.&quot; (update: role = &apos;admin&apos;)</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 space-y-1">
            <div className="text-cyan-400 font-bold">// Appointments & Participants RLS</div>
            <div>&quot;View appointments if participant or creator.&quot;</div>
            <div>&quot;Create appointments.&quot; (insert: auth.uid() = creator_id)</div>
            <div>&quot;Manage participants.&quot; (participant or creator with can_reshare)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

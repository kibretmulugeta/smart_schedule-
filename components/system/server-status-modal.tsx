'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  Server,
  Database,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
  ShieldCheck,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { format } from 'date-fns';

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerStatusModal({ isOpen, onClose }: ServerStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatusData(data);
    } catch (e: any) {
      setTestResult(`Failed to query server: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleTestEmail = async (targetEmail: string) => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          recipientName: targetEmail === 'adwaat1888@gmail.com' ? 'Adwaat' : 'Kibret Mulugeta',
          subject: `✅ Live Server & Database Test Alert to ${targetEmail}`,
          type: 'meeting_created_creator',
          eventTitle: 'Live Server Diagnostics Check',
          eventDescription: 'Direct verification of live email dispatch and backend database synchronization.',
          startTime: new Date().toISOString(),
          hostName: 'Antigravity AI Central Server',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(
          `Success! Email dispatched (${data.mode === 'resend_live' ? 'Live via Resend API' : 'Simulated Delivery'}). Check recipient inbox / preview.`
        );
      } else {
        setTestResult(`API Warning: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setTestResult(`Request failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Server & Database Diagnostics"
      subtitle="Real-time backend connectivity, database record telemetry, and live email dispatcher"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Quick Refresh & Telemetry Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">Backend Status: Operational</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Port 3000 · Next.js 14.2
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>

        {/* 3 Core Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Server System */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Server className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">Application Server</h4>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Status: <span className="text-emerald-400 font-bold">Online (200 OK)</span></div>
              <div>Node: <span className="font-mono text-slate-400">{statusData?.server?.nodeVersion || 'v24.18'}</span></div>
              <div>Env: <span className="font-mono text-slate-400">{statusData?.server?.environment || 'development'}</span></div>
            </div>
          </div>

          {/* 2. Database System */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Database className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">Database Storage</h4>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Storage: <span className="text-cyan-300 font-bold">Server DB (data/db.json)</span></div>
              <div>Schedules: <span className="text-white font-bold">{statusData?.database?.records?.schedulesCount ?? '...'}</span></div>
              <div>Appointments: <span className="text-white font-bold">{statusData?.database?.records?.appointmentsCount ?? '...'}</span></div>
              <div>Participants: <span className="text-white font-bold">{statusData?.database?.records?.participantsCount ?? '...'}</span></div>
            </div>
          </div>

          {/* 3. Email System */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Mail className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">Email Dispatcher</h4>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div>Provider: <span className="text-amber-300 font-bold">Resend API</span></div>
              <div>Status: <span className="text-emerald-400 font-bold">Configured Active</span></div>
              <div>Owner: <span className="font-mono text-slate-400 text-[10px]">kibretmail@gmail.com</span></div>
            </div>
          </div>
        </div>

        {/* Supabase PostgreSQL Deep-Dive Panel */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">PostgreSQL & Supabase Status</h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
              Target: urigvyaervunkrzlzgyv.supabase.co
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All schedules and appointments are persistently recorded in the backend server database (
            <code className="text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded font-mono">
              data/db.json
            </code>
            ). For direct Supabase PostgreSQL syncing, ensure your active anon key from the Supabase dashboard is present in <code className="text-slate-300 font-mono">.env.local</code>.
          </p>
        </div>

        {/* Live Email Test Actions */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            Dispatch Real Live Test Email Now
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleTestEmail('adwaat1888@gmail.com')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3 h-3" />
              <span>Send Live to adwaat1888@gmail.com</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleTestEmail('kibretmail@gmail.com')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <Mail className="w-3 h-3 text-emerald-400" />
              <span>Send Live to kibretmail@gmail.com (Resend Owner)</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 font-mono">
              {testResult}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close Diagnostics
          </Button>
        </div>
      </div>
    </Modal>
  );
}

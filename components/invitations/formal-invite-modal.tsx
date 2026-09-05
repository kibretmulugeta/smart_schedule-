'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { Mail, Sparkles, Send, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface FormalInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormalInviteModal({ isOpen, onClose }: FormalInviteModalProps) {
  const { sendFormalInvitation } = useSchedule();
  const { currentUser, allProfiles } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const isAlreadyRegistered = allProfiles.some((p) => p.email.toLowerCase() === cleanEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanEmail) return;

    setLoading(true);
    const success = await sendFormalInvitation(cleanEmail);
    setLoading(false);

    if (success) {
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setEmail('');
        onClose();
      }, 1800);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member via Email"
      subtitle="Send a formal platform registration invitation link to an unregistered email."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-400" /> Invitee Email Address *
          </label>
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Dynamic Status Notices */}
        {cleanEmail && isAlreadyRegistered && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Already Registered User: </span>
              <span>
                {cleanEmail} already has an active account on Smart Schedule. They can log in directly.
              </span>
            </div>
          </div>
        )}

        {cleanEmail && !isAlreadyRegistered && (
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Invitation Preview
            </div>
            <p className="text-slate-300 leading-relaxed">
              An email will be dispatched to <strong>{cleanEmail}</strong> containing a secure registration link:
            </p>
            <div className="mt-1.5 p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-cyan-300 truncate">
              /auth/login?mode=register&email={encodeURIComponent(cleanEmail)}&type=formal
            </div>
          </div>
        )}

        {sentSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Invitation successfully sent! Closing dialog...</span>
          </div>
        )}

        {/* Host attribution notice */}
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            Inviter: <strong>{currentUser?.full_name || currentUser?.email}</strong> ({currentUser?.role})
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !cleanEmail || isAlreadyRegistered}
            className="flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Dispatching Invitation...' : 'Send Email Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

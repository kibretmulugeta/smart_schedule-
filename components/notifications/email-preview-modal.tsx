'use client';

import React from 'react';
import { X, Mail, CheckCircle2, Send, ExternalLink } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string | null;
  recipientEmail?: string;
  subject?: string;
  dispatchedAt?: string;
  mode?: string;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  htmlContent,
  recipientEmail,
  subject,
  dispatchedAt,
  mode,
}: EmailPreviewModalProps) {
  if (!isOpen || !htmlContent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Dispatched HTML Email Preview</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {mode === 'resend_live' ? 'Delivered via Resend Live' : 'Verified Email Dispatch'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                To: <span className="text-indigo-300 font-bold">{recipientEmail || 'Recipient'}</span>
                {subject && ` · Subject: "${subject}"`}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Body Preview iframe */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-950/90">
          <iframe
            srcDoc={htmlContent}
            title="Email Preview"
            className="w-full h-[580px] rounded-2xl border border-slate-800 bg-slate-950"
            sandbox="allow-same-origin allow-popups"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dual-Channel verified · Screen alert shown & HTML email queued to inbox</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

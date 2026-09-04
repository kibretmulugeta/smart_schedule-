'use client';

import React, { useState } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { useToast } from '@/context/toast-context';
import {
  parseNaturalLanguageInput,
  calculateFocusBlocks,
  ParsedAIScheduleResult,
  FocusBlockRecommendation,
} from '@/lib/ai-scheduler';
import { Button } from '@/components/ui/button';
import { FrequencyBadge } from '@/components/schedules/frequency-badge';
import {
  Sparkles,
  Zap,
  Clock,
  Flame,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react';
import { format } from 'date-fns';

const PRESET_PROMPTS = [
  'Schedule deep work coding every Mon, Wed, Fri at 10am',
  'Audit infrastructure costs on 1st day of month at 8:30am',
  'Month-end retro & sprint freeze on last day of month at 4pm',
  'Sprint kickoff pulse for the beginning 5 days at 11am',
  'Hydration and stretch micro-break every 45 minutes',
  'Executive architecture sync with Elena and Marcus tomorrow at 2pm',
  'Weekend trail run and biometric recovery at 8am',
];

export default function AIPage() {
  const { schedules, appointments, createSchedule, createAppointment } = useSchedule();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedAIScheduleResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Compute recommended focus blocks based on current busy intervals
  const busyIntervals = [
    ...appointments.map((a) => ({
      start: new Date(a.start_time),
      end: new Date(a.end_time),
    })),
  ];
  const focusRecommendations = calculateFocusBlocks(busyIntervals);

  const handleParse = (textToParse?: string) => {
    const query = textToParse || prompt;
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const res = parseNaturalLanguageInput(query.trim());
      setParsedResult(res);
      setIsAnalyzing(false);
    }, 250);
  };

  const handleApplyParsedResult = async () => {
    if (!parsedResult) return;

    if (parsedResult.type === 'schedule') {
      await createSchedule({
        title: parsedResult.title,
        description: parsedResult.description,
        category_id: null,
        frequency: parsedResult.frequency || 'daily',
        interval_value: parsedResult.interval_value || null,
        custom_rule_json: parsedResult.custom_rule_json || null,
        start_time: parsedResult.suggestedStartTime,
        end_time: parsedResult.suggestedEndTime,
        is_completed: false,
      });
    } else {
      await createAppointment(
        {
          title: parsedResult.title,
          description: parsedResult.description,
          start_time: parsedResult.suggestedStartTime,
          end_time: parsedResult.suggestedEndTime,
        },
        []
      );
    }

    setParsedResult(null);
    setPrompt('');
  };

  const handleApplyFocusBlock = async (block: FocusBlockRecommendation) => {
    await createSchedule({
      title: `Smart Scheduling Deep Focus (${block.durationMinutes}m)`,
      description: `Optimized deep work session: ${block.reason}`,
      category_id: null,
      frequency: 'weekly',
      interval_value: 1,
      custom_rule_json: { days_of_week: [block.startTime.getDay()] },
      start_time: block.startTime.toISOString(),
      end_time: block.endTime.toISOString(),
      is_completed: false,
    });
    showToast('Focus Block Reserved', 'Added optimized deep-work block to your calendar.', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-slate-900/80 p-6 sm:p-8 rounded-3xl border border-purple-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <BrainCircuit className="w-3.5 h-3.5" /> Smart Scheduling AI Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Autonomous Scheduling & Focus Optimizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Convert freeform natural language prompts into PostgreSQL-typed recurrence rules, detect overlapping calendar bottlenecks, and auto-arrange circadian deep-work sessions.
          </p>
        </div>
      </div>

      {/* NLP Prompt Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Natural Language Schedule Parser
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Type any scheduling prompt or click one of the suggested neural templates below.
          </p>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(preset);
                handleParse(preset);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-[11px] text-slate-300 hover:text-purple-200 transition-all text-left"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleParse();
              }}
              placeholder="e.g., Set up 45-min sprint kickoff for first 5 days of each month at 10 AM..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <Button
            variant="glow"
            onClick={() => handleParse()}
            disabled={!prompt.trim() || isAnalyzing}
            className="sm:w-36 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'Parsing...' : 'Decompose'}
          </Button>
        </div>

        {/* Live Parsed JSON Decomposition Card */}
        {parsedResult && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 shadow-glow-primary/10 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Parsed Recurrence Model</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {Math.round(parsedResult.confidenceScore * 100)}% Confidence
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono uppercase font-bold">
                Type: {parsedResult.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400">Decomposed Title:</div>
                <div className="font-bold text-white text-sm">{parsedResult.title}</div>
                <div className="text-slate-400 pt-1">Reasoning:</div>
                <div className="text-slate-300">{parsedResult.reasoning}</div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400">Target Frequency:</div>
                <div>
                  {parsedResult.frequency && (
                    <FrequencyBadge
                      frequency={parsedResult.frequency}
                      intervalValue={parsedResult.interval_value}
                      customRule={parsedResult.custom_rule_json}
                    />
                  )}
                </div>
                <div className="text-slate-400 pt-1">Estimated Start:</div>
                <div className="text-slate-200 font-mono">
                  {format(new Date(parsedResult.suggestedStartTime), 'PPpp')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setParsedResult(null)}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyParsedResult}
              >
                <CheckCircle2 className="w-4 h-4" /> Apply & Save to Database
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Circadian Deep Work Focus Recommendations */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            AI Recommended Deep Focus Blocks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic detection of uninterrupted focus opportunities aligned with cognitive peak hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {focusRecommendations.map((block) => (
            <div
              key={block.id}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-400">{block.dayLabel}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                    Score: {block.score}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  {format(block.startTime, 'h:mm a')} – {format(block.endTime, 'h:mm a')}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {block.reason}
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleApplyFocusBlock(block)}
                className="w-full text-xs"
              >
                Reserve Focus Slot
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

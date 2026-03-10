'use client';

import React, { useCallback } from 'react';
import { Stethoscope, Clock, Brain, Pill, Copy } from 'lucide-react';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppBadge,
  AppButton,
} from '@/components/ui-system';
import { useAppToast } from '@/hooks/useAppToast';
import type { ClinicalTimeline } from '@/lib/aiScribeApi';

interface ClinicalTimelineCardProps {
  timeline: ClinicalTimeline;
}

function formatTimelineForClipboard(timeline: ClinicalTimeline): string {
  const lines: string[] = [];

  if (timeline.symptoms && timeline.symptoms.length > 0) {
    lines.push('Symptoms:');
    timeline.symptoms.forEach((s) => lines.push(`* ${s}`));
    lines.push('');
  }

  if (timeline.duration) {
    lines.push('Duration:');
    lines.push(`* ${timeline.duration}`);
    lines.push('');
  }

  if (timeline.assessment) {
    lines.push('Assessment:');
    lines.push(`* ${timeline.assessment}`);
    lines.push('');
  }

  if (timeline.plan && timeline.plan.length > 0) {
    lines.push('Plan:');
    timeline.plan.forEach((p) => lines.push(`* ${p}`));
  }

  return lines.join('\n').trim();
}

export function ClinicalTimelineCard({ timeline }: ClinicalTimelineCardProps) {
  const toast = useAppToast();
  const hasContent =
    (timeline.symptoms?.length ?? 0) > 0 ||
    timeline.duration ||
    timeline.assessment ||
    (timeline.plan?.length ?? 0) > 0;

  const handleCopy = useCallback(async () => {
    const text = formatTimelineForClipboard(timeline);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Timeline copied to clipboard');
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Timeline copied to clipboard');
    }
  }, [timeline, toast]);

  if (!hasContent) return null;

  return (
    <AppCard>
      <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <AppCardTitle className="text-base">Clinical Timeline</AppCardTitle>
        <AppButton variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5 text-xs">
          <Copy className="h-3.5 w-3.5" />
          Copy Timeline
        </AppButton>
      </AppCardHeader>
      <AppCardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {timeline.symptoms && timeline.symptoms.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Stethoscope className="h-3.5 w-3.5" />
                Symptoms
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {timeline.symptoms.map((s, i) => (
                  <AppBadge key={i} variant="secondary">
                    {s}
                  </AppBadge>
                ))}
              </div>
            </div>
          )}
          {timeline.duration && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                Duration
              </h4>
              <p className="text-sm text-gray-700">{timeline.duration}</p>
            </div>
          )}
          {timeline.assessment && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Brain className="h-3.5 w-3.5" />
                Assessment
              </h4>
              <p className="text-sm text-gray-700">{timeline.assessment}</p>
            </div>
          )}
          {timeline.plan && timeline.plan.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Pill className="h-3.5 w-3.5" />
                Plan
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {timeline.plan.map((p, i) => (
                  <AppBadge key={i} variant="secondary">
                    {p}
                  </AppBadge>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppCardContent>
    </AppCard>
  );
}

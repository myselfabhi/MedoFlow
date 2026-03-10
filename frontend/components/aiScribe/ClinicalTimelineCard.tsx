'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ClinicalTimeline } from '@/lib/aiScribeApi';

interface ClinicalTimelineCardProps {
  timeline: ClinicalTimeline;
}

export function ClinicalTimelineCard({ timeline }: ClinicalTimelineCardProps) {
  const hasContent =
    (timeline.symptoms?.length ?? 0) > 0 ||
    timeline.duration ||
    timeline.assessment ||
    (timeline.plan?.length ?? 0) > 0;

  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clinical Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.symptoms && timeline.symptoms.length > 0 && (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Symptoms
            </h4>
            <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
              {timeline.symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {timeline.duration && (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Duration
            </h4>
            <p className="mt-1 text-sm text-gray-700">{timeline.duration}</p>
          </div>
        )}
        {timeline.assessment && (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Assessment
            </h4>
            <p className="mt-1 text-sm text-gray-700">{timeline.assessment}</p>
          </div>
        )}
        {timeline.plan && timeline.plan.length > 0 && (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Plan
            </h4>
            <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
              {timeline.plan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

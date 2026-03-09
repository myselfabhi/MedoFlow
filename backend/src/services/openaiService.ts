/**
 * Shared OpenAI service for AI Scribe.
 * Used by worker and approval flow.
 */

import OpenAI from 'openai';
import type { SoapDraft, PatientSummary } from './aiScribeService';

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

export async function generatePatientSummary(
  soapDraft: SoapDraft
): Promise<PatientSummary> {
  const openai = getClient();
  if (!openai) {
    return {
      diagnosis: soapDraft.assessment,
      treatmentPlan: soapDraft.plan,
      nextSteps: '',
    };
  }
  const note = `Subjective: ${soapDraft.subjective}\nObjective: ${soapDraft.objective}\nAssessment: ${soapDraft.assessment}\nPlan: ${soapDraft.plan}`;
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Rewrite this clinical note as a patient-friendly summary.
Return valid JSON only:
{
  "diagnosis": "brief diagnosis in plain language",
  "treatmentPlan": "what was recommended",
  "nextSteps": "what the patient should do next"
}`,
      },
      { role: 'user', content: note },
    ],
    response_format: { type: 'json_object' },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) {
    return {
      diagnosis: soapDraft.assessment,
      treatmentPlan: soapDraft.plan,
      nextSteps: '',
    };
  }
  return JSON.parse(text) as PatientSummary;
}

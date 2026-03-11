/**
 * AI Clinical Service — generates patient-facing summaries.
 * Uses self-hosted Ollama (local LLM) via aiProviderService.
 * No external API keys or billing required.
 */

import * as aiProviderService from './aiProviderService';
import type { SoapDraft, PatientSummary } from './aiScribeService';

export async function generatePatientSummary(
  soapDraft: SoapDraft
): Promise<PatientSummary> {
  const note = `Subjective: ${soapDraft.subjective}\nObjective: ${soapDraft.objective}\nAssessment: ${soapDraft.assessment}\nPlan: ${soapDraft.plan}`;

  try {
    const text = await aiProviderService.chatCompletion({
      systemPrompt: `Rewrite this clinical note as a patient-friendly summary.
Return valid JSON only:
{
  "diagnosis": "brief diagnosis in plain language",
  "treatmentPlan": "what was recommended",
  "nextSteps": "what the patient should do next"
}`,
      userMessage: note,
      jsonMode: true,
    });

    return JSON.parse(text) as PatientSummary;
  } catch {
    // Fallback: use the SOAP fields directly if LLM is unavailable
    return {
      diagnosis: soapDraft.assessment,
      treatmentPlan: soapDraft.plan,
      nextSteps: '',
    };
  }
}

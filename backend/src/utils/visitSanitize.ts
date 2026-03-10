/**
 * Patients never see internal SOAP/clinical note. Only published patient summary.
 * Use this when returning visit records to PATIENT role.
 */
export const sanitizeVisitRecordForPatient = <T extends Record<string, unknown>>(
  visitRecord: T
): T => {
  return {
    ...visitRecord,
    subjective: null,
    objective: null,
    assessment: null,
    plan: null,
    note: null,
    currentVersion: null,
    versions: [],
  };
};

import assert from 'node:assert/strict'
import { sanitizeVisitRecordForPatient } from '../utils/visitSanitize'

test('patient cannot access draft/internal note content - SOAP fields are masked', () => {
  const visitRecord = {
    id: 'vr-1',
    clinicId: 'c-1',
    appointmentId: 'app-1',
    providerId: 'p-1',
    patientId: 'patient-1',
    subjective: 'Patient reports pain',
    objective: 'Observed swelling',
    assessment: 'Diagnosis: strain',
    plan: 'Rest and ice',
    note: 'Internal note',
    status: 'FINAL',
    currentVersion: { id: 'v1' },
    versions: [{ id: 'v1' }],
  }

  const sanitized = sanitizeVisitRecordForPatient(visitRecord)

  assert.equal(sanitized.subjective, null)
  assert.equal(sanitized.objective, null)
  assert.equal(sanitized.assessment, null)
  assert.equal(sanitized.plan, null)
  assert.equal(sanitized.note, null)
  assert.equal(sanitized.currentVersion, null)
  assert.deepEqual(sanitized.versions, [])
  assert.equal(sanitized.id, 'vr-1')
  assert.equal(sanitized.status, 'FINAL')
})

test('patient cannot access draft/internal note content - non-SOAP fields preserved', () => {
  const visitRecord = {
    id: 'vr-2',
    clinicId: 'c-1',
    appointmentId: 'app-2',
    providerId: 'p-1',
    patientId: 'patient-1',
    subjective: null,
    objective: null,
    assessment: null,
    plan: null,
    note: null,
    status: 'DRAFT',
    isFinalized: false,
  }

  const sanitized = sanitizeVisitRecordForPatient(visitRecord)

  assert.equal(sanitized.id, 'vr-2')
  assert.equal(sanitized.status, 'DRAFT')
  assert.equal(sanitized.isFinalized, false)
})

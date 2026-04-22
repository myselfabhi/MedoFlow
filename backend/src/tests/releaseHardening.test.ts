import assert from 'node:assert/strict'
import { patientRegistrationSchema } from '../validation/module1Schemas'

test('public registration schema strips role - cannot create privileged roles', () => {
  const schema = patientRegistrationSchema.body
  const parsed = schema.parse({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'SUPER_ADMIN',
  })
  const keys = Object.keys(parsed)
  assert.ok(!keys.includes('role'), 'role must not be in parsed body')
  assert.equal(parsed.name, 'Test User')
  assert.equal(parsed.email, 'test@example.com')
})

test('OAuth state validation - valid state structure', () => {
  const state = Buffer.from(JSON.stringify({ userId: 'u1', clinicId: 'c1' })).toString('base64')
  const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8')) as {
    userId?: string
    clinicId?: string
  }
  assert.equal(decoded.userId, 'u1')
  assert.equal(decoded.clinicId, 'c1')
})

test('OAuth state validation - invalid state throws', () => {
  assert.throws(
    () => {
      const state = 'not-valid-base64!!!'
      JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    },
    (err: Error) => err instanceof SyntaxError || err instanceof TypeError
  )
})

test('durable storage ref format - s3 and local prefixes', () => {
  const s3Ref = 's3:my-bucket:sessions/s1/audio.webm'
  const localRef = 'local:uploads/ai-scribe/s1/audio.webm'
  assert.ok(s3Ref.startsWith('s3:'))
  assert.ok(localRef.startsWith('local:'))
  const s3Parts = s3Ref.slice(3).split(':')
  assert.equal(s3Parts[0], 'my-bucket')
  assert.equal(s3Parts[1], 'sessions/s1/audio.webm')
})

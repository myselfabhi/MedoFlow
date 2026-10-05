/**
 * Scripted multi-turn test for the AI Front Desk.
 * Runs a realistic call: greet → identify → check availability → book.
 *
 * Usage:
 *   cd backend && npx ts-node scripts/test-voice-agent-flow.ts
 */

import 'dotenv/config'
import prisma from '../src/config/prisma'
import * as voiceAgentService from '../src/services/voiceAgentService'

const CLINIC_EMAIL = 'owner@greenpine.clinic'

async function main() {
  const owner = await prisma.user.findFirst({
    where: { email: CLINIC_EMAIL },
    select: { clinicId: true },
  })
  if (!owner?.clinicId) {
    console.error('Owner not found')
    process.exit(1)
  }
  const clinicId = owner.clinicId

  // Start a fresh call record.
  const call = await voiceAgentService.startCall(clinicId, 'BROWSER')
  console.log('\n────────────────────────────────────────────────────────────')
  console.log(`📞 Call started: ${call.id}`)
  console.log('────────────────────────────────────────────────────────────')

  const greeting = await voiceAgentService.getGreeting(clinicId)
  console.log(`🤖 AGENT: ${greeting}\n`)

  const userTurns = [
    "Hi, I'd like to book an appointment please.",
    'My name is Alex Rivera.',
    'Tomorrow morning with Dr. Wilson if you have something.',
    'Yes please, book it.',
  ]

  for (let i = 0; i < userTurns.length; i++) {
    const userText = userTurns[i]!
    console.log(`👤 USER: ${userText}`)
    const result = await voiceAgentService.runTurnWithText(call.id, clinicId, userText)
    if (result.toolCalls.length > 0) {
      for (const tc of result.toolCalls) {
        const argsPreview = JSON.stringify(tc.args).slice(0, 120)
        const resultStr = JSON.stringify(tc.result)
        const resultPreview = resultStr.length > 200 ? resultStr.slice(0, 200) + '…' : resultStr
        console.log(`   🔧 ${tc.name}(${argsPreview})`)
        console.log(`      → ${resultPreview}`)
      }
    }
    console.log(`🤖 AGENT: ${result.assistantText}\n`)
    // Stay under Groq's 12K TPM rate limit between turns.
    if (i < userTurns.length - 1) {
      console.log('   ⏳ Waiting 15s for rate-limit headroom…')
      await new Promise((r) => setTimeout(r, 15000))
    }
  }

  // Final state
  await voiceAgentService.endCall(call.id, clinicId, {
    status: 'COMPLETED',
    durationSec: 60,
  })
  const summary = await voiceAgentService.summarizeCall(call.id, clinicId)
  console.log('────────────────────────────────────────────────────────────')
  console.log('📝 AI SUMMARY:')
  console.log(summary.summary)
  console.log('────────────────────────────────────────────────────────────\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})

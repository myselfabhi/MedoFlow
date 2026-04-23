/**
 * Jitsi as a Service (JaaS / 8x8.vc) — JWT-signed room tokens.
 *
 * The public meet.jit.si server now requires a Google/Microsoft-authenticated
 * moderator to start any conference, which makes it unusable for a
 * frictionless telemedicine flow. Moving to 8x8.vc's JaaS gives us the same
 * Jitsi iframe but with JWT-based auth — the first joiner we mint a token
 * for is automatically the moderator, no second log-in prompt.
 *
 * Free tier (at time of writing): 25-minute calls, unlimited rooms. Long
 * enough for every test/demo and most real consults; upgrade when the usage
 * outgrows it.
 *
 * Required env vars:
 *   JAAS_APP_ID       e.g. "vpaas-magic-cookie-abcd1234..."
 *   JAAS_KID          API Key ID from the JaaS dashboard (UUID-shaped)
 *   JAAS_PRIVATE_KEY  PEM-encoded RSA private key. Supports either raw PEM
 *                     (with literal newlines) or a single-line env value with
 *                     escaped `\n` sequences.
 *
 * If any of the three is missing we fall back to meet.jit.si / no-JWT, which
 * is broken for joining but keeps the dev server booting and lets the UI
 * render — it just surfaces a clear "video disabled" error instead of a
 * silent crash.
 */

import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export interface JaasConfig {
  appId: string
  kid: string
  privateKey: string
}

export interface JaasTokenOptions {
  roomName: string
  user: {
    id: string
    name: string
    email?: string
    moderator?: boolean
  }
  /** Token lifetime in minutes. Defaults to 120 (2h). */
  expiresInMinutes?: number
}

export interface VideoRoomResult {
  /** Fully-qualified Jitsi iframe domain, e.g. "8x8.vc" or "meet.jit.si" */
  domain: string
  /** The room path Jitsi expects — for JaaS it's "<appId>/<nanoid>" */
  roomName: string
  /** Direct browser URL to the room (informational, useful for copy-paste) */
  roomUrl: string
  /** JWT for this user + room; empty string when JaaS is not configured */
  jwt: string
}

/** Cached PEM so we don't re-read the key file on every request. */
let cachedPrivateKey: string | null = null
let cachedPrivateKeySource: string | null = null

/** Read config from env and normalise the private key. Returns null if
 *  any required value is missing — callers should fall back gracefully.
 *
 *  Accepts the PEM either inline (`JAAS_PRIVATE_KEY=-----BEGIN...\\n...`)
 *  or via file path (`JAAS_PRIVATE_KEY_PATH=./secrets/jaas-private.pem`).
 *  The file-path form is nicer for dev since you don't have to mangle
 *  newlines into env strings. */
export function getJaasConfig(): JaasConfig | null {
  const appId = process.env.JAAS_APP_ID
  const kid = process.env.JAAS_KID
  const inlineKey = process.env.JAAS_PRIVATE_KEY
  const keyPath = process.env.JAAS_PRIVATE_KEY_PATH

  if (!appId || !kid) return null
  if (!inlineKey && !keyPath) return null

  let privateKey: string
  if (inlineKey) {
    privateKey = inlineKey.includes('\\n') ? inlineKey.replace(/\\n/g, '\n') : inlineKey
  } else {
    // Resolve relative paths against the backend working directory so
    // `./secrets/jaas-private.pem` works no matter how the process was
    // started.
    const absPath = resolve(process.cwd(), keyPath!)
    if (cachedPrivateKey && cachedPrivateKeySource === absPath) {
      privateKey = cachedPrivateKey
    } else {
      try {
        privateKey = readFileSync(absPath, 'utf8')
        cachedPrivateKey = privateKey
        cachedPrivateKeySource = absPath
      } catch (err) {
        console.error(`[jaasService] Failed to read JAAS_PRIVATE_KEY_PATH=${absPath}:`, err)
        return null
      }
    }
  }

  return { appId, kid, privateKey }
}

/** True when the backend has everything needed to mint JaaS tokens. */
export function isJaasEnabled(): boolean {
  return getJaasConfig() !== null
}

/** Generate a new, unique room path scoped under the JaaS app. Room names
 *  under JaaS must be prefixed with the app ID, e.g.
 *  "vpaas-magic-cookie-XYZ/consultation-ab12cd34".
 *
 *  For non-JaaS (fallback), we return a bare "MedoFlow-<nonce>" name that
 *  goes against meet.jit.si directly. */
export function generateRoomName(prefix = 'MedoFlow'): string {
  const nonce = randomBytes(4).toString('hex')
  const base = `${prefix}-${nonce}`

  const config = getJaasConfig()
  if (!config) return base

  return `${config.appId}/${base}`
}

/** Sign a per-user JaaS JWT for a specific room. The first user we sign a
 *  `moderator: true` token for is the conference host — subsequent
 *  participants can join without prejoin / lobby gates. */
export function signJaasToken(options: JaasTokenOptions): string {
  const config = getJaasConfig()
  if (!config) {
    throw new Error('JaaS not configured. Set JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY.')
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + (options.expiresInMinutes ?? 120) * 60

  // Strip the "<appId>/" prefix if the caller passed a fully-qualified
  // room name — JaaS' `room` claim expects just the suffix.
  const roomClaim = options.roomName.startsWith(`${config.appId}/`)
    ? options.roomName.slice(config.appId.length + 1)
    : options.roomName

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: config.appId,
    room: roomClaim,
    nbf: now - 10,
    exp,
    context: {
      user: {
        id: options.user.id,
        name: options.user.name,
        email: options.user.email ?? '',
        moderator: options.user.moderator ? 'true' : 'false',
      },
      features: {
        livestreaming: 'true',
        recording: 'true',
        transcription: 'true',
        'outbound-call': 'false',
      },
    },
  }

  return jwt.sign(payload, config.privateKey, {
    algorithm: 'RS256',
    keyid: config.kid,
    header: { alg: 'RS256', kid: config.kid, typ: 'JWT' },
  })
}

/** Compose a full `{ domain, roomName, roomUrl, jwt }` for a given room and
 *  user. If JaaS is configured, points at 8x8.vc with a signed JWT.
 *  Otherwise returns a meet.jit.si URL with empty JWT (useful for dev but
 *  currently blocked by meet.jit.si's moderator-auth policy). */
export function buildVideoRoom(options: {
  roomName: string
  user: {
    id: string
    name: string
    email?: string
    moderator?: boolean
  }
}): VideoRoomResult {
  const config = getJaasConfig()
  if (!config) {
    return {
      domain: 'meet.jit.si',
      roomName: options.roomName,
      roomUrl: `https://meet.jit.si/${options.roomName}`,
      jwt: '',
    }
  }

  return {
    domain: '8x8.vc',
    roomName: options.roomName,
    roomUrl: `https://8x8.vc/${options.roomName}`,
    jwt: signJaasToken({ roomName: options.roomName, user: options.user }),
  }
}

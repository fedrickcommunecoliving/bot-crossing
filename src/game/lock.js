/**
 * A passcode over the off-the-map list.
 *
 * Be honest about what this is. Everything the colony knows lives in `data/colony.json`, a plain
 * file on the same machine as the browser reading it — so anyone who can open that file can delete
 * two lines and the passcode is gone. It cannot be otherwise: a local page has nowhere to keep a
 * secret from someone holding the laptop.
 *
 * What it genuinely does is stop the list being opened by a glance or a stray click. The names of
 * the repos you took off the map are the private part — a personal project, a client you would
 * rather not have on screen in a meeting — and a curtain over them is worth having even though it
 * is not a lock. It protects against passers-by, not against an attacker, and nothing here should
 * ever be described as though it were the second.
 *
 * The passcode itself is never stored, and never leaves the browser. What goes in the file is
 * PBKDF2 over a random salt, so the file cannot be read back into the passcode even though it can
 * be deleted. That is not security theatre: people reuse passcodes, and a passcode of Fedrick's
 * sitting in cleartext in a file would be a worse thing to have created than no lock at all.
 */

const ITERATIONS = 150000
const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Web Crypto is only there in a secure context; localhost counts, a LAN address would not. */
export const canLock = () => Boolean(globalThis.crypto?.subtle && globalThis.isSecureContext)

async function derive(passcode, saltHex) {
  const enc = new TextEncoder()
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)))
  const key = await crypto.subtle.importKey('raw', enc.encode(passcode), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return hex(bits)
}

/** What gets written to the colony file. Never the passcode. */
export async function makeLock(passcode) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  return { salt, hash: await derive(passcode, salt), iterations: ITERATIONS }
}

export async function checkLock(lock, passcode) {
  if (!lock?.salt || !lock?.hash) return false
  try {
    return (await derive(passcode, lock.salt)) === lock.hash
  } catch {
    return false
  }
}

export const isLocked = (lock) => Boolean(lock?.salt && lock?.hash)

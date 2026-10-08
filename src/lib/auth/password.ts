import 'server-only'

import crypto from 'node:crypto'
import { getPgPool } from '@/lib/db'
import { getPasswordRequirements } from './password-rules'
const SCRYPT_COST = 32768
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELISM = 1
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024
const DUMMY_SALT = Buffer.from('b4a9c72c4f63e20a45f0996483e5b670', 'hex')

async function derive(
  password: string,
  salt: Buffer,
  cost = SCRYPT_COST,
  blockSize = SCRYPT_BLOCK_SIZE,
  parallelism = SCRYPT_PARALLELISM
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: cost,
        r: blockSize,
        p: parallelism,
        maxmem: MAX_MEMORY
      },
      (err, derivedKey) => {
        if (err) reject(err)
        else resolve(derivedKey as Buffer)
      }
    )
  })
}

export function validateNewPassword(password: string): string | null {
  if (Buffer.byteLength(password, 'utf8') > 1024) return 'Password is too long.'
  const requirements = getPasswordRequirements(password)
  if (!requirements.minLength) return 'Use a password with at least 6 characters.'
  if (!requirements.hasEnoughCharacterTypes) {
    return 'Use at least 3 of these: lowercase letters, uppercase letters, numbers, or symbols.'
  }
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const key = await derive(password, salt)
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELISM}$${salt.toString('hex')}$${key.toString('hex')}`
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const bcryptHash = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/.exec(encodedHash)
  if (bcryptHash) {
    const cost = Number(bcryptHash[1])
    if (cost < 4 || cost > 16) {
      await derive(password, DUMMY_SALT)
      return false
    }

    const result = await getPgPool().query(
      'SELECT extensions.crypt($1, $2) = $2 AS matches',
      [password, encodedHash]
    )
    return result.rows[0]?.matches === true
  }

  const parts = encodedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    await derive(password, DUMMY_SALT)
    return false
  }

  const cost = Number(parts[1])
  const blockSize = Number(parts[2])
  const parallelism = Number(parts[3])
  const salt = Buffer.from(parts[4], 'hex')
  const expected = Buffer.from(parts[5], 'hex')
  const supported = cost === SCRYPT_COST && blockSize === SCRYPT_BLOCK_SIZE && parallelism === SCRYPT_PARALLELISM
  if (!supported || salt.length !== 16 || expected.length !== KEY_LENGTH) {
    await derive(password, DUMMY_SALT)
    return false
  }

  const actual = await derive(password, salt, cost, blockSize, parallelism)
  return crypto.timingSafeEqual(actual, expected)
}

export async function consumeDummyPasswordCheck(password: string): Promise<void> {
  await derive(password, DUMMY_SALT)
}

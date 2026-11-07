/**
 * Hachage des mots de passe.
 *
 * Format stocké : `scrypt$<N>$<r>$<p>$<sel base64>$<hash base64>`.
 * Les anciens hash SHA-256 (64 caractères hexadécimaux, sans sel) restent
 * acceptés à la connexion puis sont remplacés automatiquement (`needsRehash`).
 *
 * @module electron/services/password
 */

import crypto from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const LEGACY_SHA256 = /^[a-f0-9]{64}$/i;

function scrypt(password, salt, { N, r, p }) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      String(password),
      salt,
      KEY_LENGTH,
      { N, r, p, maxmem: 128 * N * r * 2 },
      (error, key) => (error ? reject(error) : resolve(key))
    );
  });
}

/**
 * Hache un mot de passe avec scrypt et un sel aléatoire.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Mot de passe invalide.');
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), key.toString('base64')].join(
    '$'
  );
}

/**
 * Vérifie un mot de passe contre un hash stocké (scrypt ou ancien SHA-256).
 * @param {string} password
 * @param {string} storedHash
 * @returns {Promise<{ valid: boolean, needsRehash: boolean }>}
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return { valid: false, needsRehash: false };
  }

  if (storedHash.startsWith('scrypt$')) {
    const [, n, r, p, saltB64, keyB64] = storedHash.split('$');
    const params = { N: Number(n), r: Number(r), p: Number(p) };
    if (!saltB64 || !keyB64 || Object.values(params).some((v) => !Number.isInteger(v) || v <= 0)) {
      return { valid: false, needsRehash: false };
    }
    const expected = Buffer.from(keyB64, 'base64');
    const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), params);
    const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    const outdated = params.N !== SCRYPT_N || params.r !== SCRYPT_R || params.p !== SCRYPT_P;
    return { valid, needsRehash: valid && outdated };
  }

  if (LEGACY_SHA256.test(storedHash)) {
    const expected = Buffer.from(storedHash.toLowerCase(), 'hex');
    const actual = crypto.createHash('sha256').update(password).digest();
    const valid = crypto.timingSafeEqual(expected, actual);
    return { valid, needsRehash: valid };
  }

  return { valid: false, needsRehash: false };
}

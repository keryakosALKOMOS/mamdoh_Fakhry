import crypto from "crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford Base32

function pad3(n) {
  return String(n).padStart(3, "0");
}

export function normalizeCode(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/–|—/g, "-");
}

function base32Crockford(buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of buffer) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function computeCheck(secret, grade, serial) {
  const msg = `${secret}|G${grade}|S${serial}`;
  const hash = crypto.createHash("sha256").update(msg, "utf8").digest();
  return base32Crockford(hash.subarray(0, 8)).slice(0, 5);
}

export function generateCode(secret, grade, serial) {
  const g = Number(grade);
  const s = Number(serial);
  if (![1, 2, 3].includes(g)) throw new Error("Invalid grade");
  if (!(s >= 1 && s <= 300)) throw new Error("Invalid serial");
  const check = computeCheck(secret, g, s);
  return `BP${g}-${pad3(s)}-${check}`;
}

export function parseCode(code) {
  const c = normalizeCode(code);
  const m = c.match(/^BP([123])-(\d{3})-([0-9A-Z]{5})$/);
  if (!m) return null;
  const grade = Number(m[1]);
  const serial = Number(m[2]);
  if (!(serial >= 1 && serial <= 300)) return null;
  return { grade, serial, normalized: c };
}


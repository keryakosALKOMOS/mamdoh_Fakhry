(() => {
  /**
   * Teacher secret (change this to regenerate ALL codes).
   * Keep it private. If you change it, previously printed codes will stop working.
   */
  const TEACHER_SECRET = "BRIGHTPATH-2026-SECRET-CHANGE-ME";

  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford Base32 (no I,L,O,U)

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function normalizeCode(input) {
    return String(input || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/–|—/g, "-");
  }

  function base32Crockford(bytes) {
    // Encode bytes -> base32 without padding
    let bits = 0;
    let value = 0;
    let out = "";
    for (const b of bytes) {
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

  async function sha256Bytes(message) {
    const enc = new TextEncoder();
    const data = enc.encode(message);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }

  async function computeCheck(grade, serial) {
    const msg = `${TEACHER_SECRET}|G${grade}|S${serial}`;
    const bytes = await sha256Bytes(msg);
    // Use first 5 chars of base32 for a compact checksum
    return base32Crockford(bytes.slice(0, 8)).slice(0, 5);
  }

  async function generateCode(grade, serial) {
    const g = Number(grade);
    const s = Number(serial);
    if (![1, 2, 3].includes(g)) throw new Error("Invalid grade");
    if (!(s >= 1 && s <= 300)) throw new Error("Invalid serial");
    const check = await computeCheck(g, s);
    return `BP${g}-${pad3(s)}-${check}`;
  }

  function parseCode(code) {
    const c = normalizeCode(code);
    const m = c.match(/^BP([123])-(\d{3})-([0-9A-Z]{5})$/);
    if (!m) return null;
    const grade = Number(m[1]);
    const serial = Number(m[2]);
    const check = m[3];
    if (!(serial >= 1 && serial <= 300)) return null;
    return { grade, serial, check, normalized: c };
  }

  async function validateCode(code) {
    const parsed = parseCode(code);
    if (!parsed) return { ok: false, reason: "Invalid format" };
    const expected = await computeCheck(parsed.grade, parsed.serial);
    if (expected !== parsed.check) return { ok: false, reason: "Wrong code" };
    return { ok: true, grade: parsed.grade, serial: parsed.serial, code: parsed.normalized };
  }

  window.BRIGHTPATH_CODES = {
    generateCode,
    validateCode,
    parseCode,
  };
})();

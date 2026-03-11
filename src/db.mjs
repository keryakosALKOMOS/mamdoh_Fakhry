import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { generateCode, parseCode, normalizeCode } from "./codegen.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "brightpath.sqlite");

// Must match the frontend codes.js secret if you still use it for printing
const TEACHER_SECRET = process.env.TEACHER_SECRET || "BRIGHTPATH-2026-SECRET-CHANGE-ME";

let db;

function openDb() {
  if (db) return db;
  sqlite3.verbose();
  db = new sqlite3.Database(DB_PATH);
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    openDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    openDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function seedIfNeeded() {
  const row = await get("SELECT COUNT(*) AS c FROM codes");
  if (row && row.c > 0) return;

  // Insert 900 codes (300 per grade)
  await run("BEGIN");
  try {
    for (const grade of [1, 2, 3]) {
      for (let serial = 1; serial <= 300; serial++) {
        const code = generateCode(TEACHER_SECRET, grade, serial);
        await run(
          "INSERT INTO codes(code, grade, serial, redeemed_at) VALUES(?, ?, ?, NULL)",
          [code, grade, serial]
        );
      }
    }
    await run("COMMIT");
  } catch (e) {
    await run("ROLLBACK");
    throw e;
  }
}

export async function initDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  openDb();

  await run(`
    CREATE TABLE IF NOT EXISTS codes (
      code TEXT PRIMARY KEY,
      grade INTEGER NOT NULL CHECK (grade IN (1,2,3)),
      serial INTEGER NOT NULL,
      redeemed_at INTEGER NULL
    )
  `);

  await run("CREATE INDEX IF NOT EXISTS idx_codes_grade ON codes(grade)");
  await run("CREATE INDEX IF NOT EXISTS idx_codes_redeemed ON codes(redeemed_at)");

  await seedIfNeeded();
}

export async function validateAndRedeemCode(inputCode) {
  const normalized = normalizeCode(inputCode);
  const parsed = parseCode(normalized);
  if (!parsed) {
    return { ok: false, status: 400, error: "Invalid code format" };
  }

  // If DB is missing the code (or seed didn't run), validate by algorithm + secret,
  // then insert it so we can redeem it globally.
  let row = await get("SELECT code, grade, serial, redeemed_at FROM codes WHERE code = ?", [parsed.normalized]);
  if (!row) {
    const expected = generateCode(TEACHER_SECRET, parsed.grade, parsed.serial);
    if (expected !== parsed.normalized) {
      return { ok: false, status: 404, error: "Code not found" };
    }
    await run(
      "INSERT OR IGNORE INTO codes(code, grade, serial, redeemed_at) VALUES(?, ?, ?, NULL)",
      [parsed.normalized, parsed.grade, parsed.serial]
    );
    row = await get("SELECT code, grade, serial, redeemed_at FROM codes WHERE code = ?", [parsed.normalized]);
    if (!row) return { ok: false, status: 500, error: "Server error" };
  }

  if (row.redeemed_at) {
    return { ok: false, status: 409, error: "Code already redeemed" };
  }

  // Redeem atomically: only redeem if not already redeemed
  const now = Date.now();
  const result = await run(
    "UPDATE codes SET redeemed_at = ? WHERE code = ? AND redeemed_at IS NULL",
    [now, row.code]
  );

  if (!result || result.changes !== 1) {
    return { ok: false, status: 409, error: "Code already redeemed" };
  }

  return {
    ok: true,
    status: 200,
    grade: row.grade,
    serial: row.serial,
    code: row.code,
  };
}


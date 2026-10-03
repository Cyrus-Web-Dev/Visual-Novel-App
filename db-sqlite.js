/**
 * SQLite (better-sqlite3) — dijalankan HANYA di Electron main process.
 * File DB disimpan di userData agar bisa ditulis saat app sudah di-package.
 */
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

let db = null;

function openDatabase(userDataPath) {
  const dir = userDataPath || path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'novel_romance.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email         TEXT UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      mc_name       TEXT NOT NULL DEFAULT 'Ahmad',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_progress (
      user_id            INTEGER PRIMARY KEY,
      current_chapter    INTEGER NOT NULL DEFAULT 1,
      current_line       INTEGER NOT NULL DEFAULT 0,
      unlocked_chapter_6 INTEGER NOT NULL DEFAULT 0,
      ichika_aff         INTEGER NOT NULL DEFAULT 0,
      nino_aff           INTEGER NOT NULL DEFAULT 0,
      miku_aff           INTEGER NOT NULL DEFAULT 0,
      yotsuba_aff        INTEGER NOT NULL DEFAULT 0,
      itsuki_aff         INTEGER NOT NULL DEFAULT 0,
      progress_json      TEXT,
      last_saved         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return dbPath;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function registerUser({ username, email, password }) {
  if (!username || username.length < 3) {
    return { ok: false, message: 'Username minimal 3 karakter.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, message: 'Password minimal 6 karakter.' };
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(username);
  if (existing) return { ok: false, message: 'Username sudah digunakan.' };

  if (email) {
    const existingEmail = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE')
      .get(email);
    if (existingEmail) return { ok: false, message: 'Email sudah terdaftar.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);

  const info = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, password_salt, mc_name)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(username, email || null, password_hash, salt, 'Ahmad');

  const userId = info.lastInsertRowid;
  db.prepare(
    `INSERT INTO game_progress (user_id, current_chapter, current_line) VALUES (?, 1, 0)`
  ).run(userId);

  return {
    ok: true,
    user: { id: userId, username, mc_name: 'Ahmad' }
  };
}

function loginUser({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, message: 'Username/email dan password wajib diisi.' };
  }

  const row = db
    .prepare(
      `SELECT id, username, email, password_hash, password_salt, mc_name
       FROM users
       WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
       LIMIT 1`
    )
    .get(identifier, identifier);

  if (!row) return { ok: false, message: 'Akun tidak ditemukan.' };

  const attempt = hashPassword(password, row.password_salt);
  if (attempt !== row.password_hash) {
    return { ok: false, message: 'Password salah.' };
  }

  return {
    ok: true,
    user: { id: row.id, username: row.username, mc_name: row.mc_name || 'Ahmad' }
  };
}

function saveProgress(userId, data) {
  if (!userId) return { ok: false, message: 'Belum login.' };

  const current_chapter = Number(data.current_chapter) || 1;
  const current_line = Number(data.current_line) || 0;
  const ichika_aff = Number(data.ichika_aff) || 0;
  const nino_aff = Number(data.nino_aff) || 0;
  const miku_aff = Number(data.miku_aff) || 0;
  const yotsuba_aff = Number(data.yotsuba_aff) || 0;
  const itsuki_aff = Number(data.itsuki_aff) || 0;

  let unlocked_chapter_6 =
    ichika_aff >= 100 &&
    nino_aff >= 100 &&
    miku_aff >= 100 &&
    yotsuba_aff >= 100 &&
    itsuki_aff >= 100
      ? 1
      : 0;

  if (Number(data.max_unlocked) >= 6) unlocked_chapter_6 = 1;

  const progress_json = JSON.stringify(data || {});

  db.prepare(
    `INSERT INTO game_progress (
        user_id, current_chapter, current_line, unlocked_chapter_6,
        ichika_aff, nino_aff, miku_aff, yotsuba_aff, itsuki_aff,
        progress_json, last_saved
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
        current_chapter = excluded.current_chapter,
        current_line = excluded.current_line,
        unlocked_chapter_6 = excluded.unlocked_chapter_6,
        ichika_aff = excluded.ichika_aff,
        nino_aff = excluded.nino_aff,
        miku_aff = excluded.miku_aff,
        yotsuba_aff = excluded.yotsuba_aff,
        itsuki_aff = excluded.itsuki_aff,
        progress_json = excluded.progress_json,
        last_saved = datetime('now')`
  ).run(
    userId,
    current_chapter,
    current_line,
    unlocked_chapter_6,
    ichika_aff,
    nino_aff,
    miku_aff,
    yotsuba_aff,
    itsuki_aff,
    progress_json
  );

  return { ok: true, message: 'Progres tersimpan ke akun (SQLite).' };
}

function loadProgress(userId) {
  if (!userId) return { ok: false, message: 'Belum login.' };

  const row = db
    .prepare(`SELECT * FROM game_progress WHERE user_id = ?`)
    .get(userId);

  if (!row) {
    return { ok: false, message: 'Belum ada progres tersimpan untuk akun ini.' };
  }

  let extra = {};
  try {
    if (row.progress_json) extra = JSON.parse(row.progress_json);
  } catch (_) {}

  const max_unlocked = row.unlocked_chapter_6
    ? Math.max(6, row.current_chapter || 1)
    : Math.max(1, Number(extra.max_unlocked) || row.current_chapter || 1);

  return {
    ok: true,
    data: {
      current_chapter: row.current_chapter,
      current_line: row.current_line,
      unlocked_chapter_6: row.unlocked_chapter_6,
      ichika_aff: row.ichika_aff,
      nino_aff: row.nino_aff,
      miku_aff: row.miku_aff,
      yotsuba_aff: row.yotsuba_aff,
      itsuki_aff: row.itsuki_aff,
      max_unlocked,
      ichika_ending: extra.ichika_ending || null,
      nino_ending: extra.nino_ending || null,
      miku_ending: extra.miku_ending || null,
      yotsuba_ending: extra.yotsuba_ending || null,
      itsuki_ending: extra.itsuki_ending || null,
      album_unlocks: extra.album_unlocks || null
    }
  };
}

function closeDatabase() {
  if (db) {
    try {
      db.close();
    } catch (_) {}
    db = null;
  }
}

module.exports = {
  openDatabase,
  registerUser,
  loginUser,
  saveProgress,
  loadProgress,
  closeDatabase
};

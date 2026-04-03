// src/db/index.ts
import Database from "better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../../data/bot.db");

export interface QuizSession {
  termId: string;
  correctIdx: number;
  options: string[];
}

class DatabaseWrapper {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        language TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, term_id)
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        viewed_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, viewed_at DESC);

      CREATE TABLE IF NOT EXISTS streaks (
        user_id INTEGER PRIMARY KEY,
        last_daily_date TEXT,
        streak_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        user_id INTEGER PRIMARY KEY,
        term_id TEXT NOT NULL,
        correct_idx INTEGER NOT NULL,
        options TEXT NOT NULL
      );
    `);
  }

  // Users
  getLanguage(userId: number): string | undefined {
    const row = this.db.prepare("SELECT language FROM users WHERE user_id = ?").get(userId) as { language: string } | undefined;
    return row?.language;
  }

  setLanguage(userId: number, lang: string): void {
    this.db.prepare(
      "INSERT INTO users (user_id, language) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET language = excluded.language"
    ).run(userId, lang);
  }

  // Favorites
  addFavorite(userId: number, termId: string): void {
    const count = this.db.prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = ?").get(userId) as { count: number };
    if (count.count >= 50) {
      throw new Error("Favorites limit reached (50)");
    }
    this.db.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, term_id) VALUES (?, ?)"
    ).run(userId, termId);
  }

  removeFavorite(userId: number, termId: string): void {
    this.db.prepare("DELETE FROM favorites WHERE user_id = ? AND term_id = ?").run(userId, termId);
  }

  getFavorites(userId: number): string[] {
    const rows = this.db.prepare("SELECT term_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC").all(userId) as { term_id: string }[];
    return rows.map(r => r.term_id);
  }

  isFavorite(userId: number, termId: string): boolean {
    const row = this.db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND term_id = ?").get(userId, termId);
    return !!row;
  }

  // History
  addHistory(userId: number, termId: string): void {
    this.db.prepare("INSERT INTO history (user_id, term_id) VALUES (?, ?)").run(userId, termId);
    // Keep only last 10
    this.db.prepare(`
      DELETE FROM history WHERE id IN (
        SELECT id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT -1 OFFSET 10
      )
    `).run(userId);
  }

  getHistory(userId: number): string[] {
    const rows = this.db.prepare(
      "SELECT term_id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 10"
    ).all(userId) as { term_id: string }[];
    return rows.map(r => r.term_id);
  }

  // Streaks
  viewDailyTerm(userId: number): { streak: number; isNew: boolean } {
    const today = new Date().toISOString().split("T")[0];
    const row = this.db.prepare("SELECT last_daily_date, streak_count FROM streaks WHERE user_id = ?").get(userId) as { last_daily_date: string; streak_count: number } | undefined;

    if (!row) {
      this.db.prepare("INSERT INTO streaks (user_id, last_daily_date, streak_count) VALUES (?, ?, 1)").run(userId, today);
      return { streak: 1, isNew: true };
    }

    if (row.last_daily_date === today) {
      return { streak: row.streak_count, isNew: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak: number;
    if (row.last_daily_date === yesterdayStr) {
      newStreak = row.streak_count + 1;
    } else {
      newStreak = 1;
    }

    this.db.prepare("UPDATE streaks SET last_daily_date = ?, streak_count = ? WHERE user_id = ?").run(today, newStreak, userId);
    return { streak: newStreak, isNew: true };
  }

  // Quiz
  saveQuizSession(userId: number, termId: string, correctIdx: number, options: string[]): void {
    this.db.prepare(
      "INSERT INTO quiz_sessions (user_id, term_id, correct_idx, options) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET term_id = excluded.term_id, correct_idx = excluded.correct_idx, options = excluded.options"
    ).run(userId, termId, correctIdx, JSON.stringify(options));
  }

  getQuizSession(userId: number): QuizSession | undefined {
    const row = this.db.prepare("SELECT term_id, correct_idx, options FROM quiz_sessions WHERE user_id = ?").get(userId) as { term_id: string; correct_idx: number; options: string } | undefined;
    if (!row) return undefined;
    return {
      termId: row.term_id,
      correctIdx: row.correct_idx,
      options: JSON.parse(row.options),
    };
  }

  clearQuizSession(userId: number): void {
    this.db.prepare("DELETE FROM quiz_sessions WHERE user_id = ?").run(userId);
  }

  close(): void {
    this.db.close();
  }
}

export const db = new DatabaseWrapper();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database...');
  db.close();
  process.exit(0);
});

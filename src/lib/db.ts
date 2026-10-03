import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DATABASE_PATH = process.env.DATABASE_PATH ?? "./data/tally.db";

let db: Database.Database | null = null;

function connect(): Database.Database {
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  const next = new Database(DATABASE_PATH);
  next.pragma("journal_mode = WAL");
  next.exec(`
    CREATE TABLE IF NOT EXISTS tallies (
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (date, hour)
    );
  `);
  return next;
}

function getDb(): Database.Database {
  if (!db) db = connect();
  return db;
}

export type Tally = { date: string; hour: number };

export function listTallies(): Tally[] {
  return getDb().prepare("SELECT date, hour FROM tallies").all() as Tally[];
}

export function addTally(date: string, hour: number): void {
  getDb().prepare("INSERT OR IGNORE INTO tallies (date, hour) VALUES (?, ?)").run(date, hour);
}

export function removeTally(date: string, hour: number): void {
  getDb().prepare("DELETE FROM tallies WHERE date = ? AND hour = ?").run(date, hour);
}

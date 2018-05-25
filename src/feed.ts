import { getDb } from "./db";
import { IHandlerResponse } from "./modules";

export async function getLastProcessedTimestamp() {
  const db = await getDb();
  const row = db
    .prepare(`SELECT value FROM settings WHERE key='last_processed_timestamp'`)
    .get();
  return parseInt(row.value, 10);
}

export async function updateLastProcessedTimestamp(timestamp: number) {
  const db = await getDb();
  const stmt = `UPDATE settings SET value=$timestamp WHERE key='last_processed_timestamp'`;
  db.prepare(stmt).run({ timestamp });
}

export async function respond(response: IHandlerResponse) {}

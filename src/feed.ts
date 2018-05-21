import { getDb } from "./db";

export async function getLastProcessedTimestamp() {
  const db = await getDb();
  const row = db
    .prepare(`SELECT value FROM settings WHERE key='last_processed_timestamp'`)
    .get();
  return parseInt(row.value, 10);
}

export async function respond(message: string) {
  
}

import { getDb } from "./db";
import { ResultType } from "./topics";

export async function getLastProcessedTimestamp() {
  const db = await getDb();
  const row = db
    .prepare(`SELECT value FROM settings WHERE key='last_processed_timestamp'`)
    .get();
  return parseInt(row.value, 10);
}

export async function respond(response: ResultType) {}

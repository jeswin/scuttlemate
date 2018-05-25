import { createTable, getDb } from "./db";

export async function setup() {
  await createTable(
    "settings",
    `CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key	TEXT,
      value	TEXT
    )`
  );

  const db = await getDb();

  db
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('last_processed_timestamp', 0)`
    )
    .run();
}

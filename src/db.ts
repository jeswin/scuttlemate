import Database = require("better-sqlite3");

let db: Database;
export async function getDb() {
  if (!db) {
    db = new Database("db/scuttlemate.sqlite");
  }
  return db;
}

export async function databaseExists() {
  const database = await getDb();
  const query = database.prepare(
    `SELECT name FROM sqlite_master WHERE type='table';`
  );
  return query.all().length > 0;
}

export async function createTable(table: string, createStatement: string) {
  db.prepare(createStatement).run();
  console.log(`Created ${table} table.`);
}

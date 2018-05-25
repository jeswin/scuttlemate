import Database = require("better-sqlite3");

let database: Database;
export async function getDb() {
  if (!database) {
    database = new Database("db/scuttlemate.sqlite");
  }
  return database;
}

export async function databaseExists() {
  const db = await getDb();
  const query = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table';`
  );
  return query.all().length > 0;
}

export async function createTable(table: string, createStatement: string) {
  const db = await getDb();
  db.prepare(createStatement).run();
  console.log(`Created ${table} table.`);
}

import Database = require("better-sqlite3");

let db: Database;
export async function getDb() {
  if (!db) {
    db = new Database("db/scuttlemate.sqlite");
  }
  return db;
}

export async function createTable(table: string, createStatement: string) {
  const database = await getDb();
  const query = database.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=@table;`
  );
  const created = query.all({ table }).length > 0;
  if (!created) {
    db.prepare(createStatement).run();
  } else {
    console.log(`${table} already exists.`);
  }
}

export async function init() {
  await createTable(
    "settings",
    `CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key	TEXT,
      value	TEXT
    )`
  );
  
  const database = await getDb();
  database.prepare()
}

import Database = require("better-sqlite3");

export async function init() {
  const db = new Database("db/scuttlemate.sqlite");
  const query = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='publish_users';`
  );
  const created = query.all().length > 0;
  if (!created) {
    const createUsers = `
      CREATE TABLE users (
        id	INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey	TEXT,
        username	TEXT
      )`;
    const stmt = db.prepare(createUsers);
    console.log(stmt.run());
  }
}

import { createTable } from "../../db";

export async function init() {
  await createTable(
    "publish_users",
    `CREATE TABLE publish_users (
      id	INTEGER PRIMARY KEY AUTOINCREMENT,
      pubkey	TEXT,
      nickname	TEXT
    )`
  );

  await createTable(
    "publish_posts",
    `CREATE TABLE publish_posts (
      id	INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_id	TEXT,
      tags	TEXT
    )`
  );
}

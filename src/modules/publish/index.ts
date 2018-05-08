import { createTable } from "../../db";

export async function setup() {
  await createTable(
    "publish_posts",
    `CREATE TABLE publish_posts (
      id	INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_id	TEXT,
      tags	TEXT
    )`
  );
}

import { createIndexes, createTable, getDb } from "../../db";

export async function setup() {
  await createTable(
    "users",
    `CREATE TABLE users (
        id	INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey TEXT  NOT NULL,
        username TEXT NOT NULL,
        primary INTEGER NOT NULL,
        active INTEGER NOT NULL
      )`
  );

  await createIndexes("users", ["pubkey"]);
  await createIndexes("users", ["username"]);

  await createTable(
    "groups",
    `CREATE TABLE groups ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        pubkey TEXT NOT NULL,
        type TEXT NOT NULL
      )`
  );

  await createIndexes("groups", ["pubkey"]);  
  await createIndexes("groups", ["name"]);
}

import { createIndexes, createTable } from "../../db";

export default async function setup() {
  await createTable(
    "identity",
    `CREATE TABLE identity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        domain TEXT,
        CONSTRAINT unique_identity_name UNIQUE (name),
        CONSTRAINT unique_identity_domain UNIQUE (domain)
      )`
  );

  await createIndexes("identity", ["name"]);
  await createIndexes("identity", ["domain"]);

  await createTable(
    "user",
    `CREATE TABLE user ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey TEXT NOT NULL,
        primary_identity_name TEXT,
        CONSTRAINT unique_user_pubkey UNIQUE (pubkey)
      )`
  );

  await createIndexes("user", ["pubkey"]);
  await createIndexes("user", ["primary_identity_name"]);

  await createTable(
    "user_identity",
    `CREATE TABLE user_identity ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identity_name TEXT NOT NULL,
        user_pubkey TEXT NOT NULL,
        membership_type INTEGER NOT NULL,
        FOREIGN KEY(identity_name) REFERENCES identity(name),
        FOREIGN KEY(user_pubkey) REFERENCES user(pubkey)
      )`
  );

  await createIndexes("user_identity", ["identity_name"]);
  await createIndexes("user_identity", ["user_pubkey"]);
  await createIndexes("user_identity", ["identity_name", "user_pubkey"]);
}

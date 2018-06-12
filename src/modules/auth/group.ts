import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";

export async function setup() {
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


/*
  Supported commands.
  
  Groups
  ------
  group scuttlers
  group scuttlers member pubkey2 pubkey3
  group scuttlers remove pubkey2
  group scuttlers admin pubkey1
*/

export async function handle(command: string, message: IMessage) {}

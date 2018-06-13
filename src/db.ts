import Database = require("better-sqlite3");
import * as config from "./config";
import { log } from "./logger";

let dbName = config.dbName;
export async function setDbName(name: string) {
  dbName = name;
}

let database: Database | undefined;
export async function getDb() {
  if (!database) {
    database = new Database(dbName);
  }
  return database;
}

export async function resetDb() {
  database = undefined;
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
  log(`Created ${table} table.`);
}

export async function createIndexes(table: string, fields: string[]) {
  const indexName = `${table}_${fields.join("_")}`;
  const db = await getDb();
  db.prepare(
    `CREATE INDEX ${indexName} ON ${table}(${fields.join(", ")})`
  ).run();
  log(`Created index ${indexName} ON ${table}(${fields.join(", ")}).`);
}

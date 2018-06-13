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

function columnsFromField(fields: string[]) {
  return fields.map(x => (x.includes("=") ? x.split("=")[0] : x));
}

function paramsFromField(fields: string[]) {
  return fields.map(x => (x.includes("=") ? x.split("=")[1] : x));
}

export function sqlInsert(table: string, fields: string[]) {
  return `INSERT INTO ${table} (${columnsFromField(fields).join(
    ", "
  )}) VALUES(${paramsFromField(fields)
    .map(x => `$${x}`)
    .join(", ")})`;
}

// const begin = db.prepare('BEGIN');
// const commit = db.prepare('COMMIT');
// const rollback = db.prepare('ROLLBACK');

// // Higher order function - returns a function that always runs in a transaction
// async function asTransaction(func: any) {
//   return function (...args) {
//     begin.run();
//     try {
//       func(...args);
//       commit.run();
//     } finally {
//       if (db.inTransaction) rollback.run();
//     }
//   };
// }
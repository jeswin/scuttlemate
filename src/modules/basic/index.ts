import * as fs from "fs-extra";
import { IMessage } from "..";
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
}

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

type UserExistenceQueryResult =
  | { type: "EXISTS" }
  | { type: "DOESNT_EXIST" }
  | { type: "ALIAS_EXISTS"; data: string }
  | { type: "ALREADY_CREATED" };

async function checkUserExistence(
  username: string,
  pubkey: string
): Promise<UserExistenceQueryResult> {
  const db = await getDb();

  const query =
    "SELECT * FROM users WHERE username=$username OR pubkey=$pubkey";
  const results = db.prepare(query).all({ username, pubkey });

  return results.length
    ? results.length === 1 &&
      results[0].pubkey === pubkey &&
      results[0].username === username
      ? { type: "ALREADY_CREATED" }
      : results.some(r => r.username === username)
        ? { type: "EXISTS" }
        : {
            data: results.find(r => r.pubkey === pubkey).username,
            type: "ALIAS_EXISTS"
          }
    : { type: "DOESNT_EXIST" };
}

async function createUser(username: string, pubkey: string) {
  const db = await getDb();

  const removePrimaryStmt = "UPDATE users SET primary=0 WHERE pubkey=$pubkey";
  db.prepare(removePrimaryStmt).run({ pubkey });

  const stmt =
    "INSERT INTO users (username, pubkey, primary, active) VALUES ($username, $pubkey, 1, 1)";
  db.prepare(stmt).run({ username, pubkey });

  // Create home dir.
  fs.ensureDirSync(`data/${username}`);
}

async function renameUser(
  oldUsername: string,
  username: string,
  pubkey: string
) {
  const db = await getDb();
  const stmt =
    "UPDATE users SET username=$username, active=1 WHERE pubkey=$pubkey";
  db.prepare(stmt).run({ username, pubkey });

  // Rename home dir.
  fs.renameSync(`data/${oldUsername}`, `data/${username}`);
}

export async function handle(command: string, message: IMessage) {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("user ")) {
    const username = lcaseCommand.substr(9);
    if (isValidUsername(username)) {
      const accountStatus = await checkUserExistence(username, message.author);
      if (accountStatus.type === "ALREADY_CREATED") {
        return {
          message: [
            `Your profile already exists. Go to https://scuttle.space/${username}.`,
            `To learn how to use scuttlespace, see https://scuttle.space/help.`
          ].join(`\r\n`)
        };
      } else if (accountStatus.type === "ALIAS_EXISTS") {
        await renameUser(accountStatus.data, username, message.author);
        return {
          message: `Your username has been changed from ${
            accountStatus.data
          } to ${username}.`
        };
      } else if (accountStatus.type === "DOESNT_EXIST") {
        await createUser(username, message.author);
        return {
          message: [
            `Your profile is now accessible at https://scuttle.space/${username}.`,
            `To learn how to use scuttlespace, see https://scuttle.space/help.`
          ].join(`\r\n`)
        };
      } else if (accountStatus.type === "EXISTS") {
        return {
          message: `The username ${username} already exists. Choose something else.`
        };
      }
    }
  }
}

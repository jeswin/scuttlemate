import * as fs from "fs-extra";
import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";

export async function setup() {
  await createTable(
    "users",
    `CREATE TABLE users (
        id	INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey	TEXT,
        username	TEXT
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
  const result = db.prepare(query).get({ username, pubkey });

  return result
    ? result.pubkey === pubkey && result.username === username
      ? { type: "ALREADY_CREATED" }
      : result.username === username
        ? { type: "EXISTS" }
        : { type: "ALIAS_EXISTS", data: result.username }
    : { type: "DOESNT_EXIST" };
}

async function createUser(username: string, pubkey: string) {
  const db = await getDb();
  const stmt =
    "INSERT INTO users (pubkey, username) VALUES ($pubkey, $username)";
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
  const stmt = "UPDATE users SET username=$username WHERE pubkey=$pubkey";
  db.prepare(stmt).run({ username, pubkey });

  // Rename home dir.
  fs.renameSync(`data/${oldUsername}`, `data/${username}`);
}

export async function handle(command: string, message: IMessage) {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("username ")) {
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
          message: `Your existing username ${
            accountStatus.data
          } was renamed to ${username}.`
        };
      } else if (accountStatus.type === "DOESNT_EXIST") {
        await createUser(username, message.author);
        return {
          message: [
            `Your profile is now accessible at https://scuttle.space/${username}.`,
            `To learn how to use scuttlespace, see https://scuttle.space/help`
          ].join(`\r\n`)
        };
      } else if (accountStatus.type === "EXISTS") {
        return {
          message: `The username ${username} already exists. Choose another username.`
        };
      }
    }
  }
}

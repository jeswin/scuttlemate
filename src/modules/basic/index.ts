import * as fs from "fs-extra";
import { IMessage } from "..";
import { createTable, getDb } from "../../db";

export async function setup() {
  await createTable(
    "users",
    `CREATE TABLE users (
        id	INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey	TEXT,
        username	TEXT
      )`
  );
}

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

async function checkUserExistence(
  username: string,
  pubkey: string
): Promise<"DOESNT_EXIST" | "EXISTS" | "SAME_USER"> {
  const db = await getDb();
  const stmt = "SELECT * FROM users WHERE username=$username";
  const result = db.prepare(stmt).get({ username });
  return result
    ? result.pubkey === pubkey
      ? "SAME_USER"
      : "EXISTS"
    : "DOESNT_EXIST";
}

async function createUser(username: string, pubkey: string) {
  const db = await getDb();
  const stmt =
    "INSERT INTO users (pubkey, username) VALUES ($pubkey, $username)";
  db.prepare(stmt).run({ username, pubkey });

  // Create home dir.
  fs.ensureDirSync(`data/${username}`);
}

export async function handle(command: string, message: IMessage) {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("username ")) {
    const username = lcaseCommand.substr(9);
    if (isValidUsername(username)) {
      const existence = await checkUserExistence(username, message.author);
      if (existence === "SAME_USER") {
        return {
          message: [
            `Your profile already exists. Go to https://scuttle.space/${username}.`,
            `To learn how to use scuttlespace, see https://scuttle.space/help`
          ].join(`\r\n`)
        };
      } else if (existence === "EXISTS") {
        return {
          message: `The user ${username} already exists. Choose a different username.`
        };
      } else if (existence === "DOESNT_EXIST") {
        await createUser(username, message.author);
        return {
          message: [
            `Your profile is now accessible at https://scuttle.space/${username}.`,
            `To learn how to use scuttlespace, see https://scuttle.space/help`
          ].join(`\r\n`)
        };
      }
    }
  }
}

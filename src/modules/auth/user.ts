import * as fs from "fs-extra";
import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";

export async function setup() {
  await createTable(
    "users",
    `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey TEXT  NOT NULL,
        username TEXT NOT NULL,
        is_primary INTEGER NOT NULL,
        active INTEGER NOT NULL
      )`
  );

  await createIndexes("users", ["pubkey"]);
  await createIndexes("users", ["username"]);
}

/*
  Supported commands
  
  A given pubkey can have multiple usernames associated with it, one of which will be in active state.

  Account Management
  ------------------
  user jeswin # Adds a username to the current pubkey, or makes it active if it already exists.
  user jeswin disable # Disables a username
  user jeswin remove # Deletes a previously disabled username   
*/

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

type UserExistenceQueryResult =
  | { type: "TAKEN" }
  | { type: "AVAILABLE" }
  | { type: "ALIAS"; active: boolean; isPrimary: boolean };

async function checkAccountStatus(
  username: string,
  pubkey: string
): Promise<UserExistenceQueryResult> {
  const db = await getDb();

  const query =
    "SELECT * FROM users WHERE username=$username OR pubkey=$pubkey";
  const results = db.prepare(query).all({ username, pubkey });

  if (results.length) {
    const alias = results.find(
      r => r.pubkey === pubkey && r.username === username
    );
    if (alias) {
      return {
        active: alias.active,
        isPrimary: alias.isPrimary,
        type: "ALIAS"
      };
    } else if (results.every(r => r.username !== username)) {
      return { type: "AVAILABLE" };
    } else {
      return { type: "TAKEN" };
    }
  } else {
    return { type: "AVAILABLE" };
  }
}

/*
  Create a user who does not exist.
*/
async function createUser(username: string, pubkey: string) {
  const db = await getDb();

  db.prepare("UPDATE users SET is_primary=0 WHERE pubkey=$pubkey").run({
    pubkey
  });

  db.prepare(
    "INSERT INTO users (username, pubkey, is_primary, active) VALUES ($username, $pubkey, 1, 1)"
  ).run({ username, pubkey });

  // Create home dir.
  fs.ensureDirSync(`data/${username}`);
}

/*
  Switch the active account of the user
*/
async function switchActiveAccount(username: string, pubkey: string) {
  const db = await getDb();

  // deactivate the rest
  db.prepare("UPDATE users active=0 WHERE pubkey!=$pubkey").run({ pubkey });

  // activate the account
  db.prepare(
    "UPDATE users SET username=$username, is_primary=1, active=1 WHERE pubkey=$pubkey"
  ).run({ username, pubkey });
}

/*
  Delete a user
*/
async function removeUser(username: string, pubkey: string) {
  const db = await getDb();
}

export async function handle(command: string, message: IMessage) {
  const lcaseCommand = command.toLowerCase();
  const username = lcaseCommand.substr(9);
  if (isValidUsername(username)) {
    const accountStatus = await checkAccountStatus(username, message.author);
    if (accountStatus.type === "ALIAS") {
      await switchActiveAccount(username, message.author);
      return {
        message: `Switched to ${username}.`
      };
    } else if (accountStatus.type === "AVAILABLE") {
      await createUser(username, message.author);
      return {
        message: [
          `Your profile is now accessible at https://scuttle.space/${username}.`,
          `To learn how to use scuttlespace, see https://scuttle.space/help.`
        ].join(`\r\n`)
      };
    } else if (accountStatus.type === "TAKEN") {
      return {
        message: `The username ${username} already exists. Choose something else.`
      };
    }
  }
}

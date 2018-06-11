import * as fs from "fs-extra";
import { IMessage } from "..";
import { getDb } from "../../db";

/*
  Supported commands.
  
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
  | { type: "ALIAS"; active: boolean; primary: boolean };

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
      return { type: "ALIAS", active: alias.active, primary: alias.primary };
    } else if (results.every(r => r.username !== username)) {
      return { type: "AVAILABLE" };
    } else {
      return { type: "TAKEN" };
    }
  } else {
    return { type: "AVAILABLE" };
  }
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

async function switchActiveAccount(username: string, pubkey: string) {
  const db = await getDb();
  const stmt =
    "UPDATE users SET username=$username, active=1 WHERE pubkey=$pubkey";
  db.prepare(stmt).run({ username, pubkey });

  // Rename home dir.
  fs.renameSync(`data/${oldUsername}`, `data/${username}`);
}

async function removeUser(username: string, pubkey: string) {}

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

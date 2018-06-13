import * as fs from "fs-extra";
import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";
import { IReply, IScuttleBot } from "../../types";

export async function setup() {
  await createTable(
    "users",
    `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pubkey TEXT  NOT NULL,
        username TEXT NOT NULL,
        is_primary INTEGER NOT NULL,
        enabled INTEGER NOT NULL,
        custom_domain TEXT
      )`
  );

  await createIndexes("users", ["pubkey"]);
  await createIndexes("users", ["username"]);
}

/*
  Supported commands
  
  A given pubkey can have multiple usernames associated with it, one of which will be in is_primary state.

  Account Management
  ------------------
  user jeswin # Adds a username to the current pubkey, or makes it primary if it already exists.
  user jeswin domain jeswin.org # Sets custom domain for username
  user jeswin disable # Disables a username
  user jeswin enable # Enables a username
  user jeswin remove # Deletes a previously disabled username
*/

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

type UserExistenceQueryResult =
  | { type: "TAKEN" }
  | { type: "AVAILABLE" }
  | { type: "ALIAS"; enabled: boolean; isPrimary: boolean };

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
        enabled: alias.enabled,
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

async function alreadyTaken(username: string, pubkey: string) {
  return {
    message: `The username ${username} already exists. Choose something else.`
  };
}

async function createUser(username: string, pubkey: string) {
  const db = await getDb();

  db.prepare("UPDATE users SET is_primary=0 WHERE pubkey=$pubkey").run({
    pubkey
  });

  db.prepare(
    "INSERT INTO users (username, pubkey, is_primary, enabled) VALUES ($username, $pubkey, 1, 1)"
  ).run({ username, pubkey });

  // Create home dir.
  fs.ensureDirSync(`data/${username}`);

  return {
    message: [
      `Your profile is now accessible at https://scuttle.space/${username}.`,
      `To learn how to use scuttlespace, see https://scuttle.space/help.`
    ].join(`\r\n`)
  };
}

async function switchPrimaryAccount(username: string, pubkey: string) {
  const db = await getDb();

  // deactivate the rest
  db.prepare("UPDATE users SET is_primary=0 WHERE pubkey!=$pubkey").run({
    pubkey
  });

  // activate the account
  db.prepare(
    "UPDATE users SET is_primary=1, enabled=1 WHERE username=$username AND pubkey=$pubkey"
  ).run({ username, pubkey });

  return { message: `Switched to ${username}.` };
}

async function disableUser(username: string, pubkey: string) {
  const db = await getDb();
  db.prepare(
    "UPDATE users SET enabled=0 WHERE username=$username AND pubkey=$pubkey"
  ).run({ username, pubkey });
  return { message: `The user ${username} was disabled.` };
}

async function enableUser(username: string, pubkey: string) {
  const db = await getDb();
  db.prepare(
    "UPDATE users SET enabled=1 WHERE username=$username AND pubkey=$pubkey"
  ).run({ username, pubkey });
  return { message: `The user ${username} was enabled again.` };
}

async function destroyUser(username: string, pubkey: string) {
  const db = await getDb();

  // Allow deletes only on disabled users.
  {
    const row = db
      .prepare(
        "SELECT * FROM users WHERE username=$username AND pubkey=$pubkey"
      )
      .get({ username, pubkey });
    if (row.enabled) {
      return {
        message: `You may only delete a disabled user. Try 'user ${username} disable' first.`
      };
    }
  }

  {
    db.prepare(
      "DELETE FROM users WHERE username=$username AND pubkey=$pubkey"
    ).run({ username, pubkey });

    fs.rmdirSync(`data/${username}`);
    return {
      message: `The user ${username} was destroyed.`
    };
  }
}

async function setCustomDomain(
  username: string,
  domain: string,
  pubkey: string
) {
  const db = await getDb();
  return { message: "" };
}

async function didNotUnderstand() {
  return {
    message: `Sorry I did not follow that instruction. See https://scuttle.space/help.`
  };
}

export async function handle(
  command: string,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IReply | undefined> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("user ")) {
    const parts = command.split(" ");
    if (parts.length >= 2) {
      const username = parts[1].toLowerCase();
      if (parts.length === 2) {
        if (isValidUsername(username)) {
          const accountStatus = await checkAccountStatus(
            username,
            message.author
          );
          const fn =
            accountStatus.type === "ALIAS"
              ? switchPrimaryAccount
              : accountStatus.type === "AVAILABLE"
                ? createUser
                : alreadyTaken;

          return fn(username, message.author);
        }
      } else {
        if (parts[2].toLowerCase() === "remove") {
          return await destroyUser(username, message.author);
        } else if (parts[2].toLowerCase() === "disable") {
          return await disableUser(username, message.author);
        } else if (parts[2].toLowerCase() === "enable") {
          return await enableUser(username, message.author);
        } else if (parts[2].toLowerCase() === "destroy") {
          return await destroyUser(username, message.author);
        } else if (parts[2].toLowerCase() === "domain") {
          return await setCustomDomain(username, parts[2], message.author);
        } else {
          return await didNotUnderstand();
        }
      }
    } else {
      return await didNotUnderstand();
    }
  }
}

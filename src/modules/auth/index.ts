import * as fs from "fs-extra";
import humanist, { IResult as IHumanistResult } from "humanist";

import { IMessage } from "..";
import { getDb, sqlInsert } from "../../db";
import { IReply, IScuttleBot } from "../../types";

export { default as setup } from "./setup";

/*
  Supported commands
  
  A given pubkey can have multiple usernames associated with it, one of which will be in is_primary state.

  Account Management
  ------------------
  # Creates a new identity, owned by the sender's pkey
  # If the identity already exists, sets it as active.
  id jeswin 

  # Gives another user access to the identity
  id anongamers member jeswin

  # Gives another user admin access to the identity
  id anongamers admin jeswin

  # Disassociate a user from the identity
  # There needs to be at least one admit
  id anongamers remove jeswin

  # Sets custom domain for username
  id jeswin domain jeswin.org

  # Disables an identity
  id jeswin disable
  
  # Enables an identity
  id jeswin enable 

  # Deletes a previously disabled identity
  id jeswin destroy 
*/

const parser = humanist([
  ["user", 1],
  ["enable", 0],
  ["disable", 0],
  ["destroy", 0],
  ["domain", 1]
]);

export async function handle(
  command: string,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IReply | undefined> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("id ")) {
    const args: any = parser(command);
    const id = args.id;
    const pubkey = message.author;
    if (isValidIdentity(id)) {
      const identityStatus = await checkIdentityStatus(id, message.author);

      return identityStatus.status === "TAKEN"
        ? await alreadyTaken(id, pubkey)
        : identityStatus.status === "AVAILABLE"
          ? await createIdentity(id, pubkey)
          : await modifyIdentity(id, pubkey);
    }
  }
}

function isValidIdentity(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

type IdentityStatusCheckResult =
  | {
      status: "ADMIN" | "MEMBER";
      enabled: boolean;
      primaryIdentityName: string;
    }
  | { status: "AVAILABLE" }
  | { status: "TAKEN" };

async function checkIdentityStatus(
  id: string,
  pubkey: string
): Promise<IdentityStatusCheckResult> {
  const db = await getDb();

  const identity = db
    .prepare(
      `SELECT
        i.enabled as enabled,
        i.name as identityName,
        ui.membership_type as membershipType,
        u.primary_identity_name as primaryIdentityName,
        u.pubkey as pubkey,
      FROM user_identity ui
      JOIN identity i ON ui.identity_id = i.id
      JOIN user u on ui.user_id = u.id
      WHERE identity_name=$id`
    )
    .get({ id });

  if (!identity) {
    return { status: "AVAILABLE" };
  } else {
    if (identity.pubkey === pubkey) {
      return {
        enabled: identity.enabled,
        primaryIdentityName: identity.primaryIdentityName,
        status: identity.membershipType === "ADMIN" ? "ADMIN" : "MEMBER"
      };
    } else {
      return {
        status: "TAKEN"
      };
    }
  }
}

async function alreadyTaken(id: string, pubkey: string) {
  return {
    message: `The username ${id} already exists. Choose something else.`
  };
}

async function modifyIdentity(id: string, pubkey: string) {
  return {
    message: `Your profile is now accessible at https://scuttle.space/${id}.`
  };
}

async function createIdentity(id: string, pubkey: string) {
  const db = await getDb();

  // See if the user already exists.
  const user = db.prepare(sqlInsert("user", ["pubkey"])).get({ pubkey });

  db.transaction(
    [sqlInsert("identity", ["name=identity_name", "enabled=identity_enabled"])]
      .concat(
        !user ? sqlInsert("user", ["pubkey", "primary_identity_name"]) : []
      )
      .concat(
        sqlInsert("user_identity", [
          "identity_name",
          "user_pubkey=pubkey",
          "membership_type"
        ])
      )
  ).run({
    identity_enabled: 1,
    identity_name: id,
    membership_type: "ADMIN",
    pubkey
  });

  // Create home dir.
  fs.ensureDirSync(`data/${id}`);

  return {
    message: `Your profile is now accessible at https://scuttle.space/${id}.`
  };
}

async function switchPrimaryAccount(id: string, pubkey: string) {
  const db = await getDb();

  // deactivate the rest
  db.prepare("UPDATE users SET is_primary=0 WHERE pubkey!=$pubkey").run({
    pubkey
  });

  // activate the account
  db.prepare(
    "UPDATE users SET is_primary=1, enabled=1 WHERE username=$username AND pubkey=$pubkey"
  ).run({ id, pubkey });

  return { message: `Switched to ${id}.` };
}

async function disableUser(id: string, pubkey: string) {
  const db = await getDb();
  db.prepare(
    "UPDATE users SET enabled=0 WHERE username=$username AND pubkey=$pubkey"
  ).run({ id, pubkey });
  return { message: `The user ${id} was disabled.` };
}

async function enableUser(id: string, pubkey: string) {
  const db = await getDb();
  db.prepare(
    "UPDATE users SET enabled=1 WHERE username=$username AND pubkey=$pubkey"
  ).run({ id, pubkey });
  return { message: `The user ${id} was enabled again.` };
}

async function destroyUser(id: string, pubkey: string) {
  const db = await getDb();

  // Allow deletes only on disabled users.
  {
    const row = db
      .prepare(
        "SELECT * FROM users WHERE username=$username AND pubkey=$pubkey"
      )
      .get({ id, pubkey });
    if (row.enabled) {
      return {
        message: `You may only delete a disabled user. Try 'user ${id} disable' first.`
      };
    }
  }

  {
    db.prepare(
      "DELETE FROM users WHERE username=$username AND pubkey=$pubkey"
    ).run({ id, pubkey });

    fs.rmdirSync(`data/${id}`);
    return {
      message: `The user ${id} was destroyed.`
    };
  }
}

async function setCustomDomain(id: string, domain: string, pubkey: string) {
  const db = await getDb();
  return { message: "" };
}

async function didNotUnderstand(command: string) {
  return {
    message: `Sorry I did not follow the instruction '${command}'. See https://scuttle.space/help.`
  };
}

function isJustUsername(args: IHumanistResult) {
  return Object.keys(args).length === 2;
}

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
  ["id", 1],
  ["enable", 0],
  ["disable", 0],
  ["destroy", 0],
  ["domain", 1],
  ["admin", 1],
  ["member", 1],
  ["remove", 1]
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
      return identityStatus.status === "AVAILABLE"
        ? await createIdentity(id, pubkey)
        : identityStatus.status === "TAKEN"
          ? await alreadyTaken(id, pubkey)
          : await modifyIdentity(identityStatus, args);
    }
  }
}

function isValidIdentity(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

interface IExistingIdentityResult {
  status: "ADMIN" | "MEMBER";
  enabled: boolean;
  id: string;
  membershipType: string;
  primaryIdentityName: string;
  pubkey: string;
}

type IdentityStatusCheckResult =
  | IExistingIdentityResult
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
        u.pubkey as pubkey
      FROM user_identity ui
      JOIN identity i ON ui.identity_name = i.name
      JOIN user u on ui.user_pubkey = u.pubkey
      WHERE identity_name=$id`
    )
    .get({ id });

  if (!identity) {
    return { status: "AVAILABLE" };
  } else {
    if (identity.pubkey === pubkey) {
      return {
        enabled: identity.enabled,
        id,
        membershipType: identity.membershipType,
        primaryIdentityName: identity.primaryIdentityName,
        pubkey,
        status: identity.membershipType === "ADMIN" ? "ADMIN" : "MEMBER"
      };
    } else {
      return {
        status: "TAKEN"
      };
    }
  }
}

async function createIdentity(id: string, pubkey: string) {
  const db = await getDb();

  // See if the user already exists.
  const user = db
    .prepare(`SELECT * FROM user WHERE pubkey=$pubkey`)
    .get({ pubkey });

  db.transaction(
    [
      sqlInsert({
        fields: ["name=identity_name", "enabled=identity_enabled"],
        table: "identity"
      })
    ]
      .concat(
        !user
          ? sqlInsert({
              fields: ["pubkey", "primary_identity_name"],
              table: "user"
            })
          : "UPDATE user SET primary_identity_name=$primary_identity_name WHERE pubkey=$pubkey"
      )
      .concat(
        sqlInsert({
          fields: ["identity_name", "user_pubkey=pubkey", "membership_type"],
          table: "user_identity"
        })
      )
  ).run({
    identity_enabled: 1,
    identity_name: id,
    membership_type: "ADMIN",
    primary_identity_name: id,
    pubkey
  });

  // Create home dir.
  fs.ensureDirSync(`data/${id}`);

  return {
    message: `Your profile is now accessible at https://scuttle.space/${id}.`
  };
}

async function alreadyTaken(id: string, pubkey: string) {
  return {
    message: `The username ${id} already exists. Choose something else.`
  };
}

async function modifyIdentity(idRow: IExistingIdentityResult, args: any) {
  if (isJustUsername(args)) {
    return await switchPrimaryId(idRow.id, idRow.pubkey);
  } else {
    if (args.disable) {
      return await disableId(idRow.id, idRow.membershipType);
    } else if (args.enable) {
      return await enableId(idRow.id, idRow.membershipType);
    } else if (args.destroy) {
      return await destroyId(idRow.id, idRow.membershipType, idRow.enabled);
    }
  }
}

async function switchPrimaryId(id: string, pubkey: string) {
  const db = await getDb();

  // deactivate the rest
  db.prepare(
    "UPDATE user SET primary_identity_name=$id WHERE pubkey=$pubkey"
  ).run({ id, pubkey });

  return { message: `Switched to ${id}.` };
}

async function disableId(id: string, membershipType: string) {
  if (membershipType === "ADMIN") {
    const db = await getDb();
    db.prepare("UPDATE identity SET enabled=0 WHERE name=$id").run({ id });
    return { message: `The id ${id} was disabled.` };
  } else {
    return {
      message: `You don't have permissions to disable the id ${id}.`
    };
  }
}

async function enableId(id: string, membershipType: string) {
  if (membershipType === "ADMIN") {
    const db = await getDb();
    db.prepare("UPDATE identity SET enabled=1 WHERE name=$id").run({ id });
    return { message: `The id ${id} was enabled again.` };
  } else {
    return {
      message: `You don't have permissions to enable the id ${id}.`
    };
  }
}

async function destroyId(id: string, membershipType: string, enabled: boolean) {
  if (membershipType === "ADMIN") {
    if (enabled) {
      return {
        message: `You may only delete a disabled id. Try 'id ${id} disable' first.`
      };
    } else {
      const db = await getDb();
      db.transaction([
        `DELETE FROM user_identity WHERE identity_name=$id`,
        `DELETE FROM identity WHERE name=$id`,
        `UPDATE user SET primary_identity_name=null 
          WHERE primary_identity_name=$id`
      ]).run({ id });

      fs.rmdirSync(`data/${id}`);

      return {
        message: `The id ${id} was deleted. Everything is gone.`
      };
    }
  } else {
    return {
      message: `You don't have permissions to delete the id ${id}.`
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

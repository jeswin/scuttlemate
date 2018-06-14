import * as fs from "fs-extra";
import { IResult as IHumanistResult } from "humanist";
import { didNotUnderstand, IExistingIdentityResult } from ".";
import { getDb } from "../../db";

export default async function modifyIdentity(
  idRow: IExistingIdentityResult,
  args: any,
  command: string
) {
  if (isJustUsername(args)) {
    return await switchPrimaryId(idRow, args);
  } else {
    if (args.disable) {
      return await disableId(idRow, args);
    } else if (args.enable) {
      return await enableId(idRow, args);
    } else if (args.destroy) {
      return await destroyId(idRow, args);
    } else if (args.domain) {
      return await setCustomDomain(idRow, args);
    } else {
      return await didNotUnderstand(command);
    }
  }
}

function isJustUsername(args: IHumanistResult) {
  return Object.keys(args).length === 2;
}

async function switchPrimaryId(idRow: IExistingIdentityResult, args: any) {
  const { identityName, pubkey } = idRow;
  const db = await getDb();

  // deactivate the rest
  db.prepare(
    "UPDATE user SET primary_identity_name=$identityName WHERE pubkey=$pubkey"
  ).run({ identityName, pubkey });

  return { message: `Switched to ${identityName}.` };
}

async function disableId(idRow: IExistingIdentityResult, args: any) {
  const { identityName, membershipType } = idRow;
  if (membershipType === "ADMIN") {
    const db = await getDb();
    db.prepare("UPDATE identity SET enabled=0 WHERE name=$identityName").run({
      identityName
    });
    return { message: `The id ${identityName} was disabled.` };
  } else {
    return needToBeAnAdmin(identityName);
  }
}

async function enableId(idRow: IExistingIdentityResult, args: any) {
  const { identityName, membershipType } = idRow;
  if (membershipType === "ADMIN") {
    const db = await getDb();
    db.prepare("UPDATE identity SET enabled=1 WHERE name=$identityName").run({
      identityName
    });
    return { message: `The id ${identityName} was enabled again.` };
  } else {
    return needToBeAnAdmin(identityName);
  }
}

async function destroyId(idRow: IExistingIdentityResult, args: any) {
  const { identityName, membershipType, enabled } = idRow;
  if (membershipType === "ADMIN") {
    if (enabled) {
      return {
        message: `You may only delete a disabled id. Try 'id ${identityName} disable' first.`
      };
    } else {
      const db = await getDb();
      db.transaction([
        `DELETE FROM user_identity WHERE identity_name=$identityName`,
        `DELETE FROM identity WHERE name=$identityName`,
        `UPDATE user SET primary_identity_name=null 
          WHERE primary_identity_name=$identityName`
      ]).run({ identityName });

      fs.rmdirSync(`data/${identityName}`);

      return {
        message: `The id ${identityName} was deleted. Everything is gone.`
      };
    }
  } else {
    return needToBeAnAdmin(identityName);
  }
}

async function setCustomDomain(idRow: IExistingIdentityResult, args: any) {
  const { identityName, membershipType } = idRow;
  if (membershipType === "ADMIN") {
    const db = await getDb();
    db.prepare("UPDATE identity SET domain=$domain WHERE name=$name").run({
      domain: args.domain,
      name: identityName
    });
    return {
      message: `The id '${identityName}' is now accessible at ${args.domain}.`
    };
  } else {
    return needToBeAnAdmin(identityName);
  }
}

function needToBeAnAdmin(identityName: string) {
  return {
    message: `You don't have permissions to update the id '${identityName}'. Need to be an admin.`
  };
}

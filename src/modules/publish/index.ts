import { IHandlerResponse, IMessage } from "..";
import { createIndexes, createTable } from "../../db";
import { IScuttleBot } from "../../types";
import { publishPost, publishWithoutOptions } from "./post";
import { publishIndex } from "./site-index";
const ssbKeys = require("ssb-keys");

/*
  Publishing
  ----------
  publish [<ssb_post_id>] ...
  
  Index
  -----
  publish index ...

  Deleting
  --------
  publish remove ...

  Hiding
  ------
  publish hide ...
*/

export async function setup() {
  await createTable(
    "publish_posts",
    `CREATE TABLE publish_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_post_id TEXT NOT NULL,
      markdown TEXT NOT NULL,
      html TEXT NOT NULL,
      tags TEXT  NOT NULL,
      allow_comments INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL
    )`
  );

  await createIndexes("publish_posts", ["ssb_id"]);
}

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

const schemas = [];

function argIsPostId(arg: string) {
  return true;
}

function publishRootPost() {
  throw new Error("Not implemented.");
}

export async function handle(
  command: string,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {
  if (command === "publish") {
    return await publishWithoutOptions(message, sbot);
  } else if (command.startsWith("publish ")) {
    const parts = command.split(" ").filter(x => x.trim() !== "");
    if (parts.length > 1) {
      if (isSSBMessageId(parts[1])) {
        const postId = parts[1];
        return await publishPost(postId, parts.slice(2), message, sbot);
      } else if (parts[1] === "index") {
        return await publishIndex();
      }
    }
  }
}

function isSSBMessageId(part: string) {
  return true;
}


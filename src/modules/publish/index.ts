import { IHandlerResponse, IMessage } from "..";
import { createIndexes, createTable } from "../../db";

export async function setup() {
  await createTable(
    "publish_posts",
    `CREATE TABLE publish_posts (
      id	INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_id	TEXT,
      tags	TEXT
    )`
  );

  await createIndexes("publish_posts", ["ssb_id"]);
}

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

export async function handle(
  command: string,
  message: IMessage
): Promise<IHandlerResponse | void> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand === "publish") {
    await publishThread();
  } else if (lcaseCommand.startsWith("publish to ")) {
  }
}

/*
  A user just says "publish" on a thread. 
  The first item in the thread is taken as the post.
  We also verify that the user is the author of that post.
  */
async function publishThread() {}

/*
    A user says "publish to some-url" on a thread.
    The first item in the thread is taken as the post.
    The final url will be /username/pub/some-url
*/
async function publishToUrl() {}

/*
  A user says "publish with title some-title" on a thread.
  The first item in the thread is taken as the post.
  The final url will be /username/pub/some-url
*/
async function publishWithTitle() {}

/*
  Get the title of the post from the first heading.
  If we don't find a heading, use "untitled".
*/
async function getPostTitle() {
}

/*
  Get the 
*/

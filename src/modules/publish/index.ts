import marked = require("marked");
import { Msg, PostContent } from "ssb-typescript";
import { IHandlerResponse, IMessage } from "..";
import * as config from "../../config";
import { createIndexes, createTable } from "../../db";
import { IScuttleBot } from "../../types";

const ssbKeys = require("ssb-keys");

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
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand === "publish") {
    await publishThread(message, sbot);
  } else if (lcaseCommand.startsWith("publish to ")) {
  }
}

/*
  The the root item of a thread.
  When you just say 'publish' it is the root that needs to get published.
*/
function getItemRootText(
  message: IMessage,
  sbot: IScuttleBot
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (message.root) {
      sbot.get(message.root, (err, post: any) => {
        if (!err) {
          if (typeof post.content === "string") {
            const content = ssbKeys.unbox(post.content, config.getKeys());
            resolve(content.text);
          } else {
            resolve(post.content.text);
          }
        } else {
          reject(err);
        }
      });
    }
  });
}

/*
  Gets the html of the thread, by loading the root item.
*/
async function getHtmlForThread(message: IMessage, sbot: IScuttleBot) {
  const text = await getItemRootText(message, sbot);

  // The root could be a private message.
  // In which case strip everything before the public key.
  const markdown = text.trimLeft().startsWith(config.botMention)
    ? text.substring(config.botMention.length).trim()
    : text.trim();

  const postHtml = marked(markdown);
  return { post: { html: postHtml } };
}

/*
  A user just says "publish" on a thread. 
  The first item in the thread is taken as the post.
  We also verify that the user is the author of that post.
*/
async function publishThread(message: IMessage, sbot: IScuttleBot) {
  const { post } = await getHtmlForThread(message, sbot);
  console.log("HTML IS! --> ", post.html);
}

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
async function getPostTitle() {}

/*
  Get the 
*/

function insertIntoTemplate(html: string) {
  return "";
}

import { Seq } from "lazily";
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_id TEXT NOT NULL,
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

export async function handle(
  command: string,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand === "publish") {
    await publish(message, sbot);
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
async function createPost(message: IMessage, sbot: IScuttleBot) {
  const text = await getItemRootText(message, sbot);

  // The root could be a private message.
  // In which case strip everything before the public key.
  const markdown = text.trimLeft().startsWith(config.botMention)
    ? text.substring(config.botMention.length).trim()
    : text.trim();

  const justText = markdown.replace(/[^\w ]+/gi, "");
  const postHtml = marked(markdown);
  const maybeTitle = getTitleFromHtml(postHtml);
  const title = maybeTitle
    ? maybeTitle
    : markdown.replace(/[^\w ]+/gi, "").substring(0, 50) + "...";
  const slug = stringToSlug(title);
  return { html: postHtml, title, slug };
}

/*
  Parse H1 and H2 tags with some simple regex.
  We're trying to find the post's title
*/
function getTitleFromHtml(html: string) {
  const regexen = Seq.of([/<h1.*?>(.+)<\/h1>/, /<h2.*?>(.+)<\/h2>/]).map(r =>
    r.exec(html)
  );

  const match = regexen.first(x => x !== null);
  if (match !== null && match !== undefined) {
    return match[1];
  }
}

/*
  Create a slug from post title
  https://gist.github.com/codeguy/6684588
*/
function stringToSlug(str: string) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  const to = "aaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
}

/*
  A user just says "publish" on a thread. 
  The first item in the thread is taken as the post.
  We also verify that the user is the author of that post.
  Comments will be ON. Slug will be taken from the posts heading, if found.
*/
async function publish(message: IMessage, sbot: IScuttleBot) {
  const post = await createPost(message, sbot);
  return await publishImpl({ ...post, allowComments: true }, message, sbot);
}

/*
  publish with <key> <value>, <key2> <value2>, ...

  Possible keys are:
    url <some_url_slug>
    title <some title>
    comments on | off
  
  eg: "publish with url some-url, comments off" .
  The first item in the thread is taken as the post.
  The final url will be /username/pub/some-url
  Comments will be off.
*/
async function publishWith() {}

interface IPublishable {
  html: string;
  slug: string;
  allowComments: boolean;
  title: string;
}

/*
  The actual publishing happens here.
*/
async function publishImpl(
  post: IPublishable,
  message: IMessage,
  sbot: IScuttleBot
) {
  // Check if the slug exists.
  const insert = `INSERT 
    INTO publish_posts 
    (ssb_id, markdown, html, tags, allowComments, title, slug) 
    VALUES ($ssbId, $markdown, $html, $tags, $allowComments, $title, $slow)`;

  const values = {
    ssbId,
    markdown,
    html,
    tags,
    allowComments,
    title,
    slug
  };

  return;
}

/*
  Insert the html into a template.
*/
function insertIntoTemplate(html: string) {
  return "";
}

/*
  Write the file out to the user's pub directory
*/
async function writeToDisk(slug: string, content: string, username: string) {}

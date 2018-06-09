import humanist, { OptionEntry } from "humanist";
import { Seq } from "lazily";
import marked = require("marked");
import { IHandlerResponse, IMessage } from "..";
import * as config from "../../config";
import { getDb } from "../../db";
import { getPathForDocument } from "../../services/cms";
import { IScuttleBot } from "../../types";
import * as home from "../home";

const ssbKeys = require("ssb-keys");

/*
  Supported commands. [] denotes optional.
  
  If the username is not provided the currently active username is used.
  If the ssb_post_id is not provided, the message root is published.

  Publishing
  ----------
  publish [as <username>] [<ssb_post_id>]
  publish [as <username>] [<ssb_post_id>] title Hello World
  publish [as <username>] [<ssb_post_id>] comments on|off
  publish [as <username>] [<ssb_post_id>] url hello-world
  
  OR combinations thereof
  publish [as <username>] [<ssb_post_id>] title Hello World. comments off  
*/

const publishPostSchema: OptionEntry[] = [
  ["title", Infinity, { join: true }],
  ["comments", 1],
  ["url", 1]
];

const publishPostParser = humanist(publishPostSchema);

export async function publishWithoutOptions(
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {
  if (message.root) {
    const post = await createPost(message.root, sbot);
    const publishResult = await publishImpl(
      { ...post, ssbPostId: message.root, allowComments: true },
      message,
      sbot
    );
    return {
      message: `The article was published at https://www.scuttle.space/${getPathForDocument(
        message.author,
        post.slug
      )}/`
    };
  } else {
    return {
      message: `To publish an article, say '@scuttlespace publish' as a reply to the article you want to publish.`
    };
  }
}

export async function publishPost(
  postId: string,
  parts: string[],
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {
  const options = publishPostParser(parts);
  const post = await createPost(postId, sbot);
  const publishResult = await publishImpl(
    { ...post, ssbPostId: postId, allowComments: true },
    message,
    sbot
  );
  return {
    message: `The article was published at https://www.scuttle.space/${lala}/`
  };
}

/*
  The the root item of a thread.
  When you just say 'publish' it is the root that needs to get published.
*/
function getItemRootText(key: string, sbot: IScuttleBot): Promise<string> {
  return new Promise((resolve, reject) => {
    sbot.get(key, (err, post: any) => {
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
  });
}

/*
  Gets the html of the thread, by loading the root item.
*/
async function createPost(key: string, sbot: IScuttleBot) {
  const text = await getItemRootText(key, sbot);

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
  const tags: string[] = [];
  return { html: postHtml, markdown, title, slug, tags };
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
async function publish(
  message: IMessage,
  sbot: IScuttleBot
): Promise<IHandlerResponse | void> {}

interface IPublishable {
  allowComments: boolean;
  html: string;
  markdown: string;
  slug: string;
  ssbPostId: string;
  tags: string[];
  title: string;
}

interface IPublishResult {
  url: string;
}

/*
  The actual publishing happens here.
*/
async function publishImpl(
  post: IPublishable,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IPublishResult> {
  // Check if the slug exists.
  const insert = `INSERT 
    INTO publish_posts 
    (ssb_post_id, markdown, html, tags, allow_comments, title, slug) 
    VALUES ($ssbId, $markdown, $html, $tags, $allowComments, $title, $slow)`;

  const db = await getDb();
  const stmt = db.prepare(insert);
  stmt.run(post);

  await writeToDisk(post, message, sbot);
  await regenerateHomePageSnippet(post, message, sbot);

  return { url: "https://www.example.com/todo" };
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
async function writeToDisk(
  spost: IPublishable,
  message: IMessage,
  sbot: IScuttleBot
) {}

/*
Write the file out to the user's pub directory
*/
async function regenerateHomePageSnippet(
  spost: IPublishable,
  message: IMessage,
  sbot: IScuttleBot
) {
  await home.regenerate();
}

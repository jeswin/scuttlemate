import { Msg, PostContent } from "ssb-typescript";
import { botPublicKey } from "./config";
import * as db from "./db";
import * as feed from "./feed";
import { log } from "./logger";
import { handle, INormalizedMessage } from "./modules";
import * as publish from "./modules/publish";
import * as settings from "./settings";

const pull = require("pull-stream");
const ssbClient = require("ssb-client");

async function main() {
  console.log("bot started at:", Date.now());

  const exists = await db.databaseExists();
  if (!exists) {
    await settings.setup();
    await publish.setup();
  }

  const lastProcessedTimestamp = await feed.getLastProcessedTimestamp();
  console.log("last_processed_timestamp:", lastProcessedTimestamp);

  ssbClient((err: any, sbot: any) => {
    pull(sbot.createLogStream({ gte: lastProcessedTimestamp }), processMessage);
  });
}

async function processMessage(read: any) {
  read(null, function next(end: boolean, item: any) {
    if (end === true) {
      return;
    }
    if (end) {
      throw end;
    }

    if (postIsCommand(item)) {
      const command = item.value.content.text
        .substring(
          item.value.content.text.indexOf(botPublicKey) +
            botPublicKey.length +
            1
        )
        .trim();

      handle(toMessage(item)).then(response => {
        feed
          .respond(response)
          .catch((err: Error) => log(err.message, "OUTBOUND_RESPONSE_FAIL"));
        read(null, next);
      });
    } else {
      read(null, next);
    }
  });
}

function postIsCommand(item: any): item is Msg<PostContent> {
  return (
    item.value &&
    item.value.content &&
    item.value.content.type === "post" &&
    item.value.content.text &&
    Array.isArray(item.value.content.mentions) &&
    item.value.content.mentions.some((x: any) => x.link === botPublicKey)
  );
}

function toMessage(item: Msg<PostContent>): INormalizedMessage {
  return {
    author: item.value.author,
    branch: item.value.content.branch,
    channel: item.value.content.channel,
    mentions: item.value.content.mentions,
    root: item.value.content.root,
    text: item.value.content.text,
    timestamp: item.timestamp,
    type: item.value.content.type
  };
}

main();

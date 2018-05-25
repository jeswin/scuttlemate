import { Msg, PostContent } from "ssb-typescript";
import { botPublicKey } from "./config";
import * as db from "./db";
import * as feed from "./feed";
import { log } from "./logger";
import { handle, IMessage, setup as setupModules } from "./modules";
import * as settings from "./settings";

const pull = require("pull-stream");
const ssbClient = require("ssb-client");

let lastProcessedTimestamp: number;
let previouslyWrittenTimestamp: number;

async function main() {
  console.log("bot started at:", Date.now());

  const exists = await db.databaseExists();
  if (!exists) {
    await settings.setup();
    await setupModules();
  }

  lastProcessedTimestamp = await feed.getLastProcessedTimestamp();
  previouslyWrittenTimestamp = lastProcessedTimestamp;
  console.log("last_processed_timestamp:", lastProcessedTimestamp);

  // Setup a timer to continuously update the timestamp
  setInterval(updateTimestamp, 1000);

  ssbClient((err: any, sbot: any) => {
    pull(
      sbot.createLogStream({ gte: lastProcessedTimestamp }),
      processMessage(sbot)
    );
  });
}

let counter = 0;
let startTime = Date.now();

function processMessage(sbot: any) {
  return async (read: any) => {
    read(null, function next(end: boolean, item: Msg<any>) {
      if (counter > 0 && counter % 10000 === 0) {
        console.log(
          `Processed the last 10k messages in ${Date.now() - startTime}ms.`
        );
        startTime = Date.now();
      }
      counter++;
      if (end === true) {
        return;
      }
      if (end) {
        throw end;
      }

      // see if this is a private message.
      function onMessage() {
        if (postIsCommand(item)) {
          handle(item).then(response => {
            feed
              .respond(response)
              .catch((err: Error) =>
                log(err.message, "OUTBOUND_RESPONSE_FAIL")
              );
            lastProcessedTimestamp = item.timestamp;
            read(null, next);
          });
        } else {
          read(null, next);
        }
      }

      if (item && item.value && typeof item.value.content === "string") {
        console.log("pvt msg")
        sbot.private.unbox(item.value.content, (err: any, content: any) => {
          console.log(lastProcessedTimestamp)
          if (content) {
            console.log("Processing encrypted message...", content);
            item.value.content = content;
          }
          onMessage();
        });
      } else {
        console.log("pub msg")
        onMessage();
      }
    });
  };
}

async function updateTimestamp() {
  if (lastProcessedTimestamp !== previouslyWrittenTimestamp) {
    await feed.updateLastProcessedTimestamp(lastProcessedTimestamp);
    previouslyWrittenTimestamp = lastProcessedTimestamp;
  }
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

main();

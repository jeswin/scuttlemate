import { Msg, PostContent } from "ssb-typescript";
import * as config from "./config";
import * as db from "./db";
import * as feed from "./feed";
import { log } from "./logger";
import { handle, IMessage, setup as setupModules } from "./modules";
import * as settings from "./settings";
import { IScuttleBot } from "./types";

const pull = require("pull-stream");
const ssbClient = require("ssb-client");

const argv = require("minimist")(process.argv.slice(2));

let lastProcessedTimestamp: number;
let previouslyWrittenTimestamp: number;

let counter = 0;
const startTime = Date.now();
let counterLogTime = startTime;

async function main() {
  await config.init();
  if (Object.keys(argv).length > 1) {
    await admin();
  } else {
    await startServer();
  }
}

async function admin() {
  if (argv.timestamp) {
    console.log(`Reset timestamp to ${argv.timestamp}.`);
    await feed.updateLastProcessedTimestamp(parseInt(argv.timestamp, 10));
  } else {
    console.log(`Invalid command line option.`);
  }
}

async function startServer() {
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

  ssbClient((err: any, sbot: IScuttleBot) => {
    pull(
      sbot.createLogStream({
        gte: lastProcessedTimestamp + 1,
        live: true,
        private: true
      }),
      processMessage(sbot)
    );
  });
}

function processMessage(sbot: IScuttleBot) {
  return async (read: any) => {
    read(null, function next(end: boolean, item: Msg<any>) {
      if (counter > 0 && counter % 10000 === 0) {
        console.log(
          `Processed the last 10k messages (of ${counter /
            1000}k so far) in ${Date.now() - counterLogTime}ms.`
        );
        counterLogTime = Date.now();
      }
      counter++;
      if (end === true) {
        return;
      }
      if (end) {
        throw end;
      }

      if (item && item.value) {
        lastProcessedTimestamp = item.timestamp;

        if (postIsCommand(item)) {
          handle(item, sbot).then(response => {
            feed
              .respond(response)
              .catch((err: Error) =>
                log(err.message, "OUTBOUND_RESPONSE_FAIL")
              );
            read(null, next);
          });
        } else {
          read(null, next);
        }
      } else {
        read(null, next);
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
    item.value.content.mentions.some((x: any) => x.link === config.botPublicKey)
  );
}

main();

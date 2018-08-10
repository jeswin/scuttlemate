import { Msg, PostContent } from "ssb-typescript";
import * as config from "./config";
import * as feed from "./feed";
import init from "./init";
import { log } from "./logger";
import { IMessageSource } from "./types";

const pull = require("pull-stream");
const ssbClient = require("ssb-client");

const argv = require("minimist")(process.argv.slice(2));

let lastProcessedTimestamp: number;
let previouslyWrittenTimestamp: number;

let counter = 0;
const startTime = Date.now();
let counterLogTime = startTime;

/*
  Entry Point
*/
async function main() {
  await init();
  if (Object.keys(argv).length > 1) {
    await admin();
  } else {
    await startAgent();
  }
}

/*
  CLI Options
  --timestamp <number>
    Reset the time stamp
*/
async function admin() {
  if (argv.timestamp) {
    log(`Reset timestamp to ${argv.timestamp}.`);
    await feed.updateLastProcessedTimestamp(parseInt(argv.timestamp, 10));
  } else {
    log(`Invalid command line option.`);
  }
}

/*
  Start the agent.
  Now we're constantly listening for messages.
*/
async function startAgent() {
  lastProcessedTimestamp = await feed.getLastProcessedTimestamp();
  previouslyWrittenTimestamp = lastProcessedTimestamp;
  log(`last_processed_timestamp: ${lastProcessedTimestamp}`);

  // Setup a timer to continuously update the timestamp
  setInterval(updateTimestamp, 1000);

  ssbClient((err: any, msgSource: IMessageSource) => {
    pull(
      msgSource.createLogStream({
        gte: lastProcessedTimestamp + 1,
        live: true,
        private: true
      }),
      processMessage(msgSource)
    );
  });
}

/*
  This is where message processing happens.
  We find a handler that handles the command.
  If a handler returns undefined, we try the next one.
  Until we run out of handlers - then we do nothing.
*/
function processMessage(msgSource: IMessageSource) {
  return async (read: any) => {
    read(null, function next(end: boolean, item: Msg<any>) {
      if (counter > 0 && counter % 10000 === 0) {
        log(
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

        if (messageIsCommand(item)) {
          handle(item, msgSource).then(response => {
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

/*
  Write the new timestamp to the disk.
  The timestamps are monotonic; they don't repeat.
*/
async function updateTimestamp() {
  if (lastProcessedTimestamp !== previouslyWrittenTimestamp) {
    await feed.updateLastProcessedTimestamp(lastProcessedTimestamp);
    previouslyWrittenTimestamp = lastProcessedTimestamp;
  }
}

/*
  Message is a command if it is addressed to scuttlespace.
  We check against scuttlespace's public key.
*/
function messageIsCommand(item: any): item is Msg<any> {
  return (
    item.value &&
    item.value.content &&
    Array.isArray(item.value.content.mentions) &&
    item.value.content.mentions.some((x: any) => x.link === config.botPublicKey)
  );
}

main();

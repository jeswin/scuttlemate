import { Msg, PostContent } from "ssb-typescript";
import { init } from "wild-yak";
import { botPublicKey } from "./config";
import * as db from "./db";
import * as feed from "./feed";
import * as publish from "./modules/publish";
import * as settings from "./settings";
import topics from "./topics";

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

  const handler = init(topics);

  ssbClient((err: any, sbot: any) => {
    pull(
      sbot.createLogStream({ gte: lastProcessedTimestamp }),
      processMessage
      // pull.drain((item: any) => {
      //   if (postIsCommand(item)) {
      //     const command = item.value.content.text
      //       .substring(
      //         item.value.content.text.indexOf(botPublicKey) +
      //           botPublicKey.length +
      //           1
      //       )
      //       .trim();
      //   }
      // })
    );
  });
}

let counter = 0;
const now = Date.now();
let last = now;
function processMessage(read: any) {
  read(null, function next(end: boolean, item: any) {
    counter++;

    if (counter % 1000 === 0) {
      console.log(`${counter / 1000}K messages processed.`);
      console.log(1000000 / (Date.now() - last), "per second");
      last = Date.now();
    }

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

      console.log(command);
    }

    read(null, next);
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

main();

import * as db from "./db";
import * as feed from "./feed";
import * as publish from "./modules/publish";
import * as settings from "./settings";
import { botPublicKey } from "./config";

const pull = require("pull-stream");
const ssbClient = require("ssb-client");

async function main() {
  const exists = await db.databaseExists();
  if (!exists) {
    await settings.setup();
    await publish.setup();
  }

  const lastProcessedTimestamp = await feed.getLastProcessedTimestamp();
  console.log("last_processed_timestamp:", lastProcessedTimestamp);

  let counter = 0;
  const now = Date.now();
  let lastTime = now;
  ssbClient((err: any, sbot: any) => {
    pull(
      sbot.createLogStream({ limit: 1000, gte: lastProcessedTimestamp }),
      pull.drain((item: any) => {
        counter++;
        if (counter % 1000 === 0) {
          const rate = (1000000 / (Date.now() - lastTime)).toFixed(2);
          lastTime = Date.now();
          console.log(`Processed ${counter} messages. ${rate} per second.`);
        }
        if (
          item.value &&
          item.value.content &&
          item.value.content.type === "post" &&
          Array.isArray(item.value.content.mentions) &&
          item.value.content.mentions.some((x: any) => x.link === botPublicKey)
        ) {
          const interval = Date.now() - now;
          console.log(interval, "ms");
          console.log(
            Math.round(counter * 1000 / interval),
            "messages per millisec"
          );
          console.log(Date.now() - now, "ms");
          console.log(item);
        }
      })
    );
  });
}

main();

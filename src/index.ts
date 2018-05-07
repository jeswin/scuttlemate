import * as db from "./db";
import * as publish from "./modules/publish";

const ssbClient = require("ssb-client");

async function main() {
  await db.init();  
  await publish.init();

  ssbClient((err: any, sbot: any) => {
    
  });
}

main();

import * as publish from "./publish";

const ssbClient = require("ssb-client");

async function init() {
  await publish.init();
  
  ssbClient(function(err: any, sbot: any) {
    // ...  
  });  
}

init();


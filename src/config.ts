import home = require("os-homedir");
import path = require("path");
const ssbKeys = require("ssb-keys");

export const botName = "scuttlespace";

// "@4BsPPzRK202TRUIoFcQL/x6m1pfuNcQDC0e33r2hQhM=.ed25519";
if (!process.env.SCUTTLESPACE_BOT_PKEY) {
  throw new Error(
    "$SCUTTLESPACE_BOT_PKEY environment variable needs to be set."
  );
}
export const botPublicKey = process.env.SCUTTLESPACE_BOT_PKEY;

// scuttle.space
if (!process.env.SCUTTLESPACE_DOMAIN) {
  throw new Error(
    "$SCUTTLESPACE_BOT_PKEY environment variable needs to be set."
  );
}
export const domain = process.env.SCUTTLESPACE_DOMAIN;

export const botMention = `[@${botName}](${botPublicKey})`;

let keys: any;
export async function init(appName = "ssb") {
  const configDir = path.join(home(), `.${appName}`);
  keys = ssbKeys.loadOrCreateSync(path.join(configDir, "secret"));
}

export function getKeys() {
  return keys;
}

export const dbName = "db/scuttlespace.sqlite";

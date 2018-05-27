import home = require("os-homedir");
import path = require("path");
const ssbKeys = require("ssb-keys");

export const botPublicKey =
  "@4BsPPzRK202TRUIoFcQL/x6m1pfuNcQDC0e33r2hQhM=.ed25519";

export const botMention =
  "[@scuttlespace](@4BsPPzRK202TRUIoFcQL/x6m1pfuNcQDC0e33r2hQhM=.ed25519)";

let keys: any;
export async function init(appName = "ssb") {
  const configDir = path.join(home(), `.${appName}`);
  keys = ssbKeys.loadOrCreateSync(path.join(configDir, "secret"));
}

export function getKeys() {
  return keys;
}

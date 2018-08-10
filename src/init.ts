import { existsSync } from "fs";
import winston = require("winston");
import { dbName, setup as initConfig } from "./config";
import * as db from "./db";
import { init as initLogger } from "./logger";
import { setup as setupSettings } from "./settings";

export default async function init() {
  await initLogger();
  await initConfig();
  await setupDatabase();
}

async function setupDatabase() {
  if (!existsSync(dbName)) {
    await setupSettings();
  }
}

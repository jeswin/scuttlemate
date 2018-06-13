import fs = require("fs");
import "mocha";
import "should";
import { Msg } from "ssb-typescript";
import * as db from "../db";
import { init as moduleSetup } from "../modules";
import { setup as settingsSetup } from "../settings";
import { IScuttleBot } from "../types";
import auth from "./auth";
import init from "../init";
import { setConsoleLogging } from "../logger";

const shouldLib = require("should");

const dbName = "db/test-db.sqlite";
db.setDbName(dbName);

class MockSBot implements IScuttleBot {
  createLogStream(params: any): any {}

  get(hash: string, cb: (err: any, item: Msg<any>) => void): void;
  get(hash: string, args1: any, cb: (err: any, item: Msg<any>) => void): void;
  get(x: any): any {}
}

function mockSBot(): IScuttleBot {
  return new MockSBot();
}

const sbot = mockSBot();

describe("scuttlespace", async () => {
  await auth(sbot);
});

export async function resetDb() {
  setConsoleLogging(false);
  if (fs.existsSync(dbName)) {
    fs.unlinkSync(dbName);
  }
  db.resetDb();
  await init();
}

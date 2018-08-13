import "mocha";
import "should";

import fs = require("fs");
import { Msg } from "ssb-typescript";

import * as db from "../db";
import init from "../init";
import { setConsoleLogging } from "../logger";
import { IMessageSource } from "../types";

const shouldLib = require("should");

const dbName = "db/test-db.sqlite";
db.setDbName(dbName);

class MockSBot implements IMessageSource {
  createLogStream(params: any): any {}

  get(hash: string, cb: (err: any, item: Msg<any>) => void): void;
  get(hash: string, args1: any, cb: (err: any, item: Msg<any>) => void): void;
  get(x: any): any {}
}

function mockSBot(): IMessageSource {
  return new MockSBot();
}

const msgSource = mockSBot();

describe("scuttlespace", async () => {});

export async function resetDb() {
  setConsoleLogging(false);
  if (fs.existsSync(dbName)) {
    fs.unlinkSync(dbName);
  }
  db.resetDb();
  await init();
}

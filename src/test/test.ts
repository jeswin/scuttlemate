import "mocha";
import "should";
import { Msg } from "ssb-typescript";
import * as db from "../db";
import { setup as moduleSetup } from "../modules";
import { setup as settingsSetup } from "../settings";
import { IScuttleBot } from "../types";
import auth from "./auth";

const shouldLib = require("should");

db.setDbName("db/test-db.sqlite");

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
  before(async () => {
    await settingsSetup();
    await moduleSetup();
  });
  await auth(sbot);
});

import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";
import { IScuttleBot, IReply } from "../../types";
import * as group from "./group";
import * as user from "./user";

export async function setup() {
  await group.setup();
  await user.setup();
}

const modules = [user, group];

export async function handle(
  command: string,
  message: IMessage,
  sbot: IScuttleBot
): Promise<IReply | undefined> {
  const lcaseCommand = command.toLowerCase();

  for (const mod of modules) {
    const result = await mod.handle(command, message, sbot);
    if (result) {
      return result;
    }
  }
}

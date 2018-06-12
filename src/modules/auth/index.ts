import { IMessage } from "..";
import { createIndexes, createTable, getDb } from "../../db";
import * as group from "./group";
import * as user from "./user";

export async function setup() {
  await group.setup();
  await user.setup();
}

export async function handle(command: string, message: IMessage) {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand.startsWith("user ")) {
    return await user.handle(command, message);
  } else if (lcaseCommand.startsWith("group ")) {
    return await group.handle(command, message);
  }
}

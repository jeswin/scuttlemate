import { Msg, PostContent } from "ssb-typescript";
import { botPublicKey } from "../config";
import { IScuttleBot } from "../types";
import * as basic from "./basic";
import * as publish from "./publish";

export interface IMessage {
  author: string;
  branch?: string | string[];
  channel?: string;
  mentions?: string[];
  root?: string;
  text: string;
  timestamp: number;
  type: string;
}

export interface IConversationState {
  contexts: string[];
}

export function toMessage(item: Msg<PostContent>): IMessage {
  return {
    author: item.value.author,
    branch: item.value.content.branch,
    channel: item.value.content.channel,
    mentions: item.value.content.mentions,
    root: item.value.content.root,
    text: item.value.content.text,
    timestamp: item.timestamp,
    type: item.value.content.type
  };
}

interface IScuttleSpaceModule {
  handle(command: string, message: IMessage, sbot: IScuttleBot): Promise<IHandlerResponse | void>;
  setup(): Promise<void>;
}

const modules: IScuttleSpaceModule[] = [basic, publish];

export async function setup() {
  for (const mod of modules) {
    await mod.setup();
  }
}

async function loadState(pubkey: string) {}

async function saveState(state: any, pubkey: string) {}

export interface IHandlerResponse {
  message?: string;
}

export async function handle(msg: Msg<PostContent>, sbot: IScuttleBot): Promise<IHandlerResponse> {
  const state = await loadState(msg.value.author);
  const message = toMessage(msg);
  const command = message.text
    .substring(message.text.indexOf(botPublicKey) + botPublicKey.length + 1)
    .trim();

  for (const mod of modules) {
    const result = await mod.handle(command, message, sbot);
    if (result) {
      saveState(state, msg.value.author);
      return result;
    }
  }

  // We did not get a response.
  saveState(state, msg.value.author);
  return { message: "I did not follow. TODO: Help link." };
}

import { Msg, PostContent } from "ssb-typescript";
import { botPublicKey } from "./config";
import { IMessageSource } from "./types";

export interface IMessage {
  author: string;
  branch?: string | string[];
  channel?: string;
  key: string;
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
    key: item.key,
    mentions: item.value.content.mentions,
    root: item.value.content.root,
    text: item.value.content.text,
    timestamp: item.timestamp,
    type: item.value.content.type
  };
}

interface IScuttleSpaceModule {
  handle(command: string, message: IMessage, msgSource: IMessageSource): Promise<IHandlerResponse | void>;
  setup(): Promise<void>;
}

const modules: IScuttleSpaceModule[] = [auth, publish];

export async function init() {
  for (const mod of modules) {
    await mod.setup();
  }
}

async function loadState(pubkey: string) {

}

async function saveState(state: any, pubkey: string) {

}

export interface IHandlerResponse {
  message?: string;
}

export async function handle(msg: Msg<PostContent>, msgSource: IMessageSource): Promise<IHandlerResponse> {
  const state = await loadState(msg.value.author);
  const message = toMessage(msg);
  const command = message.text
    .substring(message.text.indexOf(botPublicKey) + botPublicKey.length + 1)
    .trim();

  for (const mod of modules) {
    const result = await mod.handle(command, message, msgSource);
    if (result) {
      saveState(state, msg.value.author);
      return result;
    }
  }

  // We did not get a response.
  saveState(state, msg.value.author);
  return { message: "I did not follow. TODO: Help link." };
}
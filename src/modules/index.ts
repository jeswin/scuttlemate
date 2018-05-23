import { Msg, PostContent } from "ssb-typescript";
import { botPublicKey } from "../config";
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

interface ScuttleSpaceModule {
  handle(command: string, message: IMessage): Promise<string>;
  setup() : Promise<void>
}

const modules: ScuttleSpaceModule[] = [publish];

export async function setup() {
  for (const mod of modules) {
    await mod.setup();
  }
}

export async function handle(message: IMessage): Promise<string> {
  const command = message.text
    .substring(message.text.indexOf(botPublicKey) + botPublicKey.length + 1)
    .trim();

  for (const mod of modules) {
    const result = await mod.handle(command, message);
    if (result) {
      return result;
    }
  }

  return "I did not follow. TODO: Help link.";
}

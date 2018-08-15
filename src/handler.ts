import {
  IConfig,
  IHandlerResponse,
  IMessage,
  IMessageSource,
  IScuttlespaceCommandsModule
} from "scuttlespace-commands-common";
import { Msg, PostContent } from "ssb-typescript";
import { ICallContext } from "standard-api";
import { botPublicKey } from "./config";

export interface IConversationState {
  contexts: string[];
}

const modules: IScuttlespaceCommandsModule[] = []; // [auth, publish];

export async function init(config: IConfig) {
  for (const mod of modules) {
    await mod.init(config);
  }
}

async function loadState(pubkey: string) {}

async function saveState(state: any, pubkey: string) {}

export function toMessage(item: Msg<any>): IMessage<any> {
  return {
    author: item.value.author,
    branch: item.value.content.branch,
    channel: item.value.content.channel,
    content: item.value.content,
    key: item.key,
    mentions: item.value.content.mentions,
    root: item.value.content.root,
    timestamp: item.timestamp,
    type: item.value.content.type
  };
}

export async function handle(
  msg: Msg<any>,
  msgSource: IMessageSource,
  context: ICallContext
): Promise<IHandlerResponse> {
  const state = await loadState(msg.value.author);

  for (const mod of modules) {
    const result = await mod.handle(toMessage(msg), msgSource, undefined as any, context);
    if (result) {
      saveState(state, msg.value.author);
      return result;
    }
  }

  // We did not get a response.
  saveState(state, msg.value.author);
  return { message: "I did not follow. TODO: Help link." };
}

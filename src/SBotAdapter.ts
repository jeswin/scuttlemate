import { IMessage } from "scuttlespace-commands-common";
import { IMessageBot, IScuttleBot } from "./types";

export default class SBotAdapter implements IMessageBot {
  sbot: IScuttleBot;

  constructor(sbot: IScuttleBot) {
    this.sbot = sbot;
  }

  read(from: string): Iterable<IMessage<any>> {
    throw new Error();
  }

  get(id: string): Promise<IMessage<any>> {
    throw new Error();
  }
}

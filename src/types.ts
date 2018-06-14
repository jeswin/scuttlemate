import { Msg } from "ssb-typescript";
import { IMessage } from "./modules";

export interface IMessageSource {
  createLogStream(params: any): any;
  get(hash: string, args1: any, cb: (err: any, item: Msg<any>) => void): void;
  get(hash: string, cb: (err: any, item: Msg<any>) => void): void;
}

export interface IReply {
  message: string;
}

export interface IMessageBot {
  read(from: string): Iterable<IMessage>;
  get(id: string): Promise<IMessage>;
}

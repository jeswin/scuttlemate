import { Msg } from "ssb-typescript";

export interface IScuttleBot {
  createLogStream(params: any): any;
  get(hash: string, args1: any, cb: (err: any, item: Msg<any>) => void): void;
  get(hash: string, cb: (err: any, item: Msg<any>) => void): void;
}

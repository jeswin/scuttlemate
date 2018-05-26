import { Msg } from "ssb-typescript";

export interface IScuttleBot {
  createLogStream(params: any): any;
  get(hash: string, cb: (err: any, item: Msg<any>) => void): void;
}

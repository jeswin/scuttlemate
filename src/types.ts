import { IContexts } from "wild-yak";

export interface ISession {
  contexts: IContexts<any, any>;
}

export interface IMessage {
  author: string;
  branch: string;
  channel: string;
  mentions: string;
  root: string;
  text: string;
  timestamp: string;
  type: string;
}

export interface IExternalContext {
  
}
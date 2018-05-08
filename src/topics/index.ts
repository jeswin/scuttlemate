import { IApplicationState, IRegexParseResult, regexParse } from "wild-yak";

import * as publish from "./publish";

export interface IMessage {
  timestamp?: number;
  text: string;
}

export interface IUserData {
  x: number;
}

export function regex<TContextData, TUserData>(patterns: Array<RegExp>) {
  return regexParse<TContextData, IMessage, TUserData>(patterns, x => x.text);
}

const topics: any = [];
export default topics;

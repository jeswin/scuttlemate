import { IReply } from "./types";

export function merge(messages: IReply[]): IReply {
  return {
    message: messages.map(x => x.message).join(" ")
  };
}

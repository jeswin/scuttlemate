import {
  Handler,
  IEvalState,
  IHandlerResult,
  init,
  ITopic,
  TopicBase
} from "wild-yak";

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

export interface IUserData {
  botPublicKey: string;
}

export interface IHost {}

export type ResultType = string | number | undefined;

export class RootTopic extends TopicBase<IMessage, ResultType, IUserData, IHost>
  implements ITopic<IMessage, ResultType, IUserData, IHost> {
  async handle(
    state: IEvalState<IMessage, ResultType, IUserData, IHost>,
    message: IMessage,
    userData: IUserData,
    host: IHost
  ): Promise<IHandlerResult<ResultType>> {
    return {
      handled: false
    }
  }
}

export class DefaultTopic
  extends TopicBase<IMessage, ResultType, IUserData, IHost>
  implements ITopic<IMessage, ResultType, IUserData, IHost> {
  async handle(
    state: IEvalState<IMessage, ResultType, IUserData, IHost>,
    message: IMessage,
    userData: IUserData,
    host: IHost
  ): Promise<IHandlerResult<ResultType>> {
    return message.text === "hello world"
      ? { handled: true, result: "greetings comrade!" }
      : { handled: false };
  }

  isTopLevel() {
    return true;
  }
}

export function getHandler(): Handler<IMessage, ResultType, IUserData, IHost> {
  return init(RootTopic, DefaultTopic, []);
}

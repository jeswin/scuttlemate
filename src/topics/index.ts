import { IEvalState, IHandlerResult, ITopic, TopicBase } from "wild-yak";

export interface IMessage {
  timestamp?: number;
  text: string;
}

export interface IUserData {
  username: string;
  session: string;
}

export interface IHost {
  getUserDirectory(username: string): string;
}

export type ResultType = string | number | undefined;

export class RootTopic extends TopicBase<IMessage, ResultType, IUserData, IHost>
  implements ITopic<IMessage, ResultType, IUserData, IHost> {
  async handle(
    state: IEvalState<IMessage, ResultType, IUserData, IHost>,
    message: IMessage,
    userData: IUserData,
    host: IHost
  ): Promise<IHandlerResult<ResultType>> {
    if (message.text === "do basic math") {
      this.enterTopic(state, new MathTopic());
      return { handled: true, result: "You can type a math expression" };
    } else if (message.text === "help") {
      this.enterTopic(state, new HelpTopic());
      return {
        handled: true,
        result: "You're entering help mode. Type anything."
      };
    } else if (message.text === "reset password") {
      this.enterTopic(state, new PasswordResetTopic());
      return {
        handled: true,
        result: "Set your password."
      };
    } else {
      return {
        handled: true,
        result:
          "Life is like riding a bicycle. To keep your balance you must keep moving."
      };
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

export function getHandler() {
  return 1;
}

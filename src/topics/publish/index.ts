import { IEvalState, IHandlerResult, ITopic, TopicBase } from "wild-yak";
import { IHost, IMessage, IUserData, ResultType } from "../";

export default class PublishTopic
  extends TopicBase<IMessage, ResultType, IUserData, IHost>
  implements ITopic<IMessage, ResultType, IUserData, IHost> {
  async handle(
    state: IEvalState<IMessage, ResultType, IUserData, IHost>,
    message: IMessage,
    userData: IUserData,
    host: IHost
  ): Promise<IHandlerResult<ResultType>> {
    return {
      handled: false
    };
  }

  isTopLevel() {
    return true;
  }
}

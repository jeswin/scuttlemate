
export class MathTopic extends TopicBase<IMessage, ResultType, IUserData, IHost>
  implements ITopic<IMessage, ResultType, IUserData, IHost> {
  async handle(
    state: IEvalState<IMessage, ResultType, IUserData, IHost>,
    message: IMessage,
    userData: IUserData,
    host: IHost
  ): Promise<IHandlerResult<ResultType>> {
    if (message.text === "do advanced math") {
      this.enterTopic(state, new AdvancedMathTopic());
      return {
        handled: true,
        result: "You can do advanced math now."
      };
    } else {
      const result = basicMathOperators(message.text);
      return {
        handled: true,
        result:
          typeof result !== "undefined"
            ? result
            : "I don't know how to handle this."
      };
    }
  }

  isTopLevel() {
    return true;
  }
}
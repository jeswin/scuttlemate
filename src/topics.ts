import {
  clearAllTopics,
  createCondition,
  createTopic,
  disableConditions,
  disableConditionsExcept,
  enterTopic,
  exitTopic,
  IApplicationState,
  ITopic,
  regexParse
} from "wild-yak";

export interface IMessage {
  timestamp?: number;
  text: string;
}

export interface IUserData {
  x: number;
}

function regex<TContextData, TUserData>(patterns: Array<RegExp>) {
  return regexParse<TContextData, IMessage, TUserData>(patterns, x => x.text);
}

const reminderTopic = createTopic<IMessage, IUserData>()(
  "reminder",
  async (args, userData) => {}
)({
  conditions: [
    createCondition(
      "respond-to-hello",
      regex([]),
      async (state, { matches }) => {
        return "hey, what's up!";
      }
    )
  ]
});

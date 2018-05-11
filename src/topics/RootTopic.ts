import { IMessage } from ".";

export default class RootTopic {
  async handle(message: IMessage) {
    //                                  ∨ mind the gap
    if (message.text.startsWith("publish ")) {
      
    } else if (message.text === "help") {

    } else {
      
    }
  }
}
import { IMessage } from "../../modules";
import { handle } from "../../modules/auth/user";
import { IScuttleBot } from "../../types";

function createMessage(msg: any) {
  const base = {
    author: "jeswin",
    branch: "some-branch",
    channel: "some-channel",
    key: "some-key",
    mentions: ["alice", "bob"],
    root: "some-root",
    text: "hello world",
    timestamp: Date.now(),
    type: "post"
  };

  return { ...base, ...msg };
}

export default function run(sbot: IScuttleBot) {
  describe("user", async () => {
    it("creates a user", async () => {
      const command = "user jeswin";
      const message = createMessage({ text: `@scuttlespace ${command}` });
      const result = await handle(command, message);
      console.log(result);
    });
  });
}

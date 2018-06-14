import { IMessageSource } from "../../types";
import { resetDb } from "../test";
import changesPrimaryIdOnCreate from "./changes-primary-id-on-create";
import createUser from "./creates-user";
import deletesId from "./deletes-id";
import disablesId from "./disables-id";
import doesNotDeleteIfEnabled from "./does-not-delete-if-enabled";
import enablesId from "./enables-id";
import setsCustomDomain from "./sets-custom-domain";
import switchPrimaryId from "./switches-primary-id";

export function createMessage(msg: any) {
  const base = {
    author: "jeswins-pubkey",
    branch: "some-branch",
    channel: "some-channel",
    key: "some-message-key",
    mentions: ["alice", "bob"],
    root: "some-root",
    text: "hello world",
    timestamp: Date.now(),
    type: "post"
  };

  return { ...base, ...msg };
}

export default function run(msgSource: IMessageSource) {
  describe("auth", async () => {
    beforeEach(async () => await resetDb());

    it("creates a user", createUser(msgSource));

    it(
      "changes primary id when a new user is created",
      changesPrimaryIdOnCreate(msgSource)
    );

    it("switches the primary id", switchPrimaryId(msgSource));

    it("disables an id", disablesId(msgSource));

    it("disables an id", enablesId(msgSource));

    it("deletes an id", deletesId(msgSource));

    it("does not deletes if id is enabled", doesNotDeleteIfEnabled(msgSource));

    it("sets a custom domain", setsCustomDomain(msgSource));
  });
}

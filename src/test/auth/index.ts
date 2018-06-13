import { IScuttleBot } from "../../types";
import { resetDb } from "../test";
import changesPrimaryIdOnCreate from "./changes-primary-id-on-create";
import createUser from "./creates-user";
import disablesId from "./disables-id";
import enablesId from "./enables-id";
import switchPrimaryId from "./switches-primary-id";
import destroysId from "./destroys-id";

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

export default function run(sbot: IScuttleBot) {
  describe("auth", async () => {
    beforeEach(async () => await resetDb());

    it("creates a user", createUser(sbot));

    it(
      "changes primary id when a new user is created",
      changesPrimaryIdOnCreate(sbot)
    );

    it("switches the primary id", switchPrimaryId(sbot));

    it("disables an id", disablesId(sbot));

    it("disables an id", enablesId(sbot));

    it("deletes an id", destroysId(sbot));

    // it("does not remove a user if enabled", async () => {
    //   const command1 = "user jeswin";
    //   const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    //   const reply1 = await handle(command1, message1, sbot);

    //   const command2 = "user jeswin destroy";
    //   const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    //   const reply2 = await handle(command2, message2, sbot);

    //   shouldLib.exist(reply2);
    //   const _ =
    //     reply2 &&
    //     reply2.message.should.equal(
    //       "You may only delete a disabled user. Try 'user jeswin disable' first."
    //     );

    //   {
    //     const db = await getDb();
    //     const rows = db
    //       .prepare(`SELECT * FROM users WHERE username="jeswin"`)
    //       .all();
    //     rows.length.should.equal(1);

    //     fs.existsSync(`data/jeswin`).should.be.true();
    //   }
    // });

    // it("sets the domain", async () => {
    //   const command1 = "user jeswin";
    //   const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    //   const reply1 = await handle(command1, message1, sbot);

    //   const command2 = "user jeswin domain jeswin.org";
    //   const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    //   const reply2 = await handle(command2, message2, sbot);

    //   // shouldLib.exist(reply2);
    //   // const _ =
    //   //   reply2 &&
    //   //   reply2.message.should.equal(
    //   //     "You may only delete a disabled user. Try 'user jeswin disable' first."
    //   //   );

    //   // {
    //   //   const db = await getDb();
    //   //   const rows = db
    //   //     .prepare(`SELECT * FROM users WHERE username="jeswin"`)
    //   //     .all();
    //   //   rows.length.should.equal(1);

    //   //   fs.existsSync(`data/jeswin`).should.be.true();
    //   // }
    // });
  });
}

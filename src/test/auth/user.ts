import fs = require("fs");
import { getDb } from "../../db";
import { IMessage } from "../../modules";
import { handle } from "../../modules/auth/user";
import { IScuttleBot } from "../../types";
import { resetDb } from "../test";

const shouldLib = require("should");

function createMessage(msg: any) {
  const base = {
    author: "jeswin",
    branch: "some-branch",
    channel: "some-channel",
    key: "test-sender-pubkey",
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
    beforeEach(async () => await resetDb());

    it("creates a user", async () => {
      const command = "user jeswin";
      const message = createMessage({ text: `@scuttlespace ${command}` });
      const reply = await handle(command, message, sbot);

      shouldLib.exist(reply);
      const _ =
        reply &&
        reply.message.should.equal(
          "Your profile is now accessible at https://scuttle.space/jeswin.\r\nTo learn how to use scuttlespace, see https://scuttle.space/help."
        );

      // db entries
      const db = await getDb();
      const rows = db
        .prepare(`SELECT * FROM users WHERE username="jeswin"`)
        .all();
      shouldLib.exist(rows[0]);
      rows[0].username.should.equal("jeswin");
      rows[0].is_primary.should.equal(1);
      rows[0].active.should.equal(1);
      shouldLib.not.exist(rows[0].custom_domain);

      // file system
      fs.existsSync(`data/jeswin`).should.be.true();
    });

    // it("creating another user deactivates", async () => {
    //   const command1 = "user jeswin1";
    //   const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    //   const reply1 = await handle(command1, message1, sbot);

    //   const command2 = "user jeswin2";
    //   const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    //   const reply2 = await handle(command2, message2, sbot);

    //   // the first user should not be primary
    //   {
    //     const db = await getDb();
    //     const rows = db
    //       .prepare(`SELECT * FROM users WHERE username="jeswin1"`)
    //       .all();
    //     shouldLib.exist(rows[0]);
    //     rows[0].is_primary.should.equal(0);
    //   }

    //   // second user should be primary
    //   {
    //     const db = await getDb();
    //     const rows = db
    //       .prepare(`SELECT * FROM users WHERE username="jeswin2"`)
    //       .all();
    //     shouldLib.exist(rows[0]);
    //     rows[0].is_primary.should.equal(1);
    //   }

    //   const command3 = "user jeswin1";
    //   const message3 = createMessage({ text: `@scuttlespace ${command3}` });
    //   const reply3 = await handle(command3, message3, sbot);

    //   shouldLib.exist(reply3);
    //   const _ = reply3 && reply3.message.should.equal("Switched to jeswin1.");

    //   // first user is primary again
    //   {
    //     const db = await getDb();
    //     const rows = db
    //       .prepare(`SELECT * FROM users WHERE username="jeswin1"`)
    //       .all();
    //     shouldLib.exist(rows[0]);
    //     rows[0].is_primary.should.equal(1);
    //   }
    // });

    it("activates a user", async () => {
      const command1 = "user jeswin1";
      const message1 = createMessage({ text: `@scuttlespace ${command1}` });
      const reply1 = await handle(command1, message1, sbot);

      const command2 = "user jeswin2";
      const message2 = createMessage({ text: `@scuttlespace ${command2}` });
      const reply2 = await handle(command2, message2, sbot);

      // the first user should not be primary
      {
        const db = await getDb();
        const rows = db
          .prepare(`SELECT * FROM users WHERE username="jeswin1"`)
          .all();
        shouldLib.exist(rows[0]);
        rows[0].is_primary.should.equal(0);
      }

      // second user should be primary
      {
        const db = await getDb();
        const rows = db
          .prepare(`SELECT * FROM users WHERE username="jeswin2"`)
          .all();
        shouldLib.exist(rows[0]);
        rows[0].is_primary.should.equal(1);
      }

      const command3 = "user jeswin1";
      const message3 = createMessage({ text: `@scuttlespace ${command3}` });
      const reply3 = await handle(command3, message3, sbot);

      shouldLib.exist(reply3);
      const _ = reply3 && reply3.message.should.equal("Switched to jeswin1.");

      // first user is primary again
      {
        const db = await getDb();
        const rows = db
          .prepare(`SELECT * FROM users WHERE username="jeswin1"`)
          .all();
        shouldLib.exist(rows[0]);
        rows[0].is_primary.should.equal(1);
      }
    });
  });
}

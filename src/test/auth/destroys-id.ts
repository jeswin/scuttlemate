import fs = require("fs-extra");
import { createMessage } from ".";
import { getDb } from "../../db";
import { handle } from "../../modules/auth";
import { IScuttleBot } from "../../types";

const shouldLib = require("should");

export default function(sbot: IScuttleBot) {
  return async () => {
    const command1 = "id jeswin";
    const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    const reply1 = await handle(command1, message1, sbot);

    const command2 = "id jeswin disable";
    const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    const reply2 = await handle(command2, message2, sbot);

    const command3 = "id jeswin destroy";
    const message3 = createMessage({ text: `@scuttlespace ${command3}` });
    const reply3 = await handle(command3, message3, sbot);

    shouldLib.exist(reply3);
    const _ =
      reply3 &&
      reply3.message.should.equal(
        "The id jeswin was deleted. Everything is gone."
      );

    {
      const db = await getDb();
      const rows = db
        .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
        .all();
      rows.length.should.equal(0);
    }

    {
      const db = await getDb();
      const rows = db
        .prepare(`SELECT * FROM user WHERE pubkey="jeswins-pubkey"`)
        .all();
      rows.length.should.equal(1);
      shouldLib.not.exist(rows[0].primary_identity_name);
    }

    {
      const db = await getDb();
      const rows = db
        .prepare(
          `SELECT * FROM user_identity WHERE user_pubkey="jeswins-pubkey" AND identity_name="jeswin"`
        )
        .all();
      rows.length.should.equal(0);
    }

    fs.existsSync("data/jeswin").should.be.false();
  };
}

import { createMessage } from ".";
import { getDb } from "../../db";
import { handle } from "../../modules/auth";
import { IMessageSource } from "../../types";

const shouldLib = require("should");

export default function(msgSource: IMessageSource) {
  return async () => {
    const command1 = "id jeswin1";
    const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    const reply1 = await handle(command1, message1, msgSource);

    const command2 = "id jeswin2";
    const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    const reply2 = await handle(command2, message2, msgSource);

    const command3 = "id jeswin1";
    const message3 = createMessage({ text: `@scuttlespace ${command3}` });
    const reply3 = await handle(command3, message3, msgSource);

    shouldLib.exist(reply3);
    const _ = reply3 && reply3.message.should.equal("Switched to jeswin1.");

    const db = await getDb();
    // first user is primary again
    {
      const rows = db
        .prepare(`SELECT * FROM user WHERE pubkey="jeswins-pubkey"`)
        .all();
      rows.length.should.equal(1);
      rows[0].primary_identity_name.should.equal("jeswin1");
    }
  };
}

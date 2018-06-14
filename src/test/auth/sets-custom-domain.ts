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

    const command2 = "id jeswin domain jeswin.org";
    const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    const reply2 = await handle(command2, message2, sbot);

    shouldLib.exist(reply2);
    const _ =
      reply2 &&
      reply2.message.should.equal(
        "The id 'jeswin' is now accessible at jeswin.org."
      );

    {
      const db = await getDb();
      const rows = db
        .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
        .all();
      rows.length.should.equal(1);
      rows[0].domain.should.equal("jeswin.org");
    }
  };
}

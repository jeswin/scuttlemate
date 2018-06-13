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

      shouldLib.exist(reply2);
      const _ =
        reply2 && reply2.message.should.equal("The id jeswin was disabled.");

      {
        const db = await getDb();
        const rows = db
          .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
          .all();
        shouldLib.exist(rows[0]);
        rows[0].enabled.should.equal(0);
      }
  };
}

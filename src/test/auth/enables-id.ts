import { createMessage } from ".";
import { getDb } from "../../db";
import { handle } from "../../modules/auth";
import { IMessageSource } from "../../types";

const shouldLib = require("should");

export default function(msgSource: IMessageSource) {
  return async () => {
      const command1 = "id jeswin";
      const message1 = createMessage({ text: `@scuttlespace ${command1}` });
      const reply1 = await handle(command1, message1, msgSource);

      const command2 = "id jeswin disable";
      const message2 = createMessage({ text: `@scuttlespace ${command2}` });
      const reply2 = await handle(command2, message2, msgSource);

      const command3 = "id jeswin enable";
      const message3 = createMessage({ text: `@scuttlespace ${command3}` });
      const reply3 = await handle(command3, message3, msgSource);

      shouldLib.exist(reply3);
      const _ =
        reply3 &&
        reply3.message.should.equal("The id jeswin was enabled again.");

      {
        const db = await getDb();
        const rows = db
          .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
          .all();
        shouldLib.exist(rows[0]);
        rows[0].enabled.should.equal(1);
      }
  };
}

import fs = require("fs-extra");
import { createMessage } from ".";
import { getDb } from "../../db";
import { handle } from "../../modules/auth";
import { IMessageSource } from "../../types";

const shouldLib = require("should");

export default function(msgSource: IMessageSource) {
  return async () => {
    const command1 = "id jeswin";
    const message1 = createMessage({ text: `@scuttlespace ${command1}` });
    await handle(command1, message1, msgSource);

    const command2 = "id jeswin destroy";
    const message2 = createMessage({ text: `@scuttlespace ${command2}` });
    const reply2 = await handle(command2, message2, msgSource);

    shouldLib.exist(reply2);
    const _ =
      reply2 &&
      reply2.message.should.equal(
        "You may only delete a disabled id. Try 'id jeswin disable' first."
      );

    {
      const db = await getDb();
      const rows = db
        .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
        .all();
      rows.length.should.equal(1);

      fs.existsSync(`data/jeswin`).should.be.true();
    }
  };
}

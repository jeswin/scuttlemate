import fs = require("fs");
import { createMessage } from ".";
import { getDb } from "../../db";
import { handle } from "../../modules/auth";
import { IScuttleBot } from "../../types";

const shouldLib = require("should");

export default function(sbot: IScuttleBot) {
  return async () => {
    const command = "id jeswin";
    const message = createMessage({ text: `@scuttlespace ${command}` });
    const reply = await handle(command, message, sbot);

    shouldLib.exist(reply);
    const _ =
      reply &&
      reply.message.should.equal(
        "Your profile is now accessible at https://scuttle.space/jeswin."
      );

    // db
    const db = await getDb();    
    {
      const rows = db
        .prepare(`SELECT * FROM identity WHERE name="jeswin"`)
        .all();
      rows.length.should.equal(1);
      rows[0].name.should.equal("jeswin");
      rows[0].enabled.should.equal(1);
      shouldLib.not.exist(rows[0].domain);
    }

    {
      const rows = db
        .prepare(`SELECT * FROM user WHERE pubkey="jeswins-pubkey"`)
        .all();
      rows.length.should.equal(1);
      rows[0].pubkey.should.equal("jeswins-pubkey");
      rows[0].primary_identity_name.should.equal("jeswin");
    }

    {
      const rows = db
        .prepare(`SELECT * FROM user_identity WHERE identity_name="jeswin"`)
        .all();
      rows.length.should.equal(1);
      rows[0].identity_name.should.equal("jeswin");
      rows[0].user_pubkey.should.equal("jeswins-pubkey");
      rows[0].membership_type.should.equal("ADMIN");
    }

    // file system
    fs.existsSync(`data/jeswin`).should.be.true();
  };
}

import { IHandlerResponse, IMessage,  } from "..";
import { createTable } from "../../db";

export async function setup() {
  await createTable(
    "publish_posts",
    `CREATE TABLE publish_posts (
      id	INTEGER PRIMARY KEY AUTOINCREMENT,
      ssb_id	TEXT,
      tags	TEXT
    )`
  );
}

function isValidUsername(username: string) {
  const regex = /^[a-z][a-z0-9_]+$/;
  return regex.test(username);
}

export async function handle(
  command: string,
  message: IMessage
): Promise<IHandlerResponse | void> {
  const lcaseCommand = command.toLowerCase();
  if (lcaseCommand === "publish") {
    
  }
}

import { IScuttleBot } from "../../types";
import user from "./user";

export default function run(sbot: IScuttleBot) {
  describe("auth", async () => {
    user(sbot);
  });
}

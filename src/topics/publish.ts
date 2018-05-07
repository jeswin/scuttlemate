import { createCondition, createTopic, ITopic } from "wild-yak";

import { IMessage, IUserData, regex } from "./";

export const topic = createTopic<IMessage, IUserData>()(
  "publish",
  async (args, userData) => {}
)({
  conditions: [
    createCondition("publish", regex([]), async (state, { matches }) => {
      return "hey, what's up!";
    })
  ]
});

/*
  Get an id for yourself
  publish as jeswin

  Publish as a post with url (with url scuttle.space/jeswin/about-scuttlekit)
  publish %/0AC79/Exv9w7CZBNhT1ikOIiTqvulaIRBXIedpwo/g=.sha256 to about-scuttlekit

  Publish a multi-part post
  publish %/0AC79/Exv9w7CZBNhT1ikOIiTqvulaIRBXIedpwo/g=.sha256 %/39AvPNoE3IqkDD6hhbwwUxCsSBWmAqaJU61HEAN+00=.sha256 to about-scuttlekit

  Publish a post along with replies 
  publish thread %/0AC79/Exv9w7CZBNhT1ikOIiTqvulaIRBXIedpwo/g=.sha256 to about-scuttlekit

  Unpublish
  unpublish %/0AC79/Exv9w7CZBNhT1ikOIiTqvulaIRBXIedpwo/g=.sha256

  Unpublish with url
  unpublish about-scuttlekit
*/

export const conditions = [] as any;

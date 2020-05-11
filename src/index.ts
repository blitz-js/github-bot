import { Application } from "probot"; // eslint-disable-line no-unused-vars
import { issuesLabeled } from "./issues.labeled";
import { project_cardMoved } from "./project_card.moved";
import { issuesOpened } from "./issues.opened";
import { pull_requestOpened } from "./pull_request.opened";
import { pull_requestLabeled } from "./pull_reqest.labeled";
import { issue_commentCreated } from "./issue_comment.created";

export = (app: Application) => {
  app.on("issues.opened", issuesOpened);
  app.on("issues.labeled", issuesLabeled);
  app.on(["project_card.moved", "project_card.created"], project_cardMoved);
  app.on(
    ["pull_request.opened", "pull_request.ready_for_review"],
    pull_requestOpened
  );
  app.on("pull_request.labeled", pull_requestLabeled);

  app.on("issue_comment.created", issue_commentCreated);
};

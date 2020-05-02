import { Context } from "probot";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import { IN_PROGRESS_LABEL, IN_REVIEW_LABEL } from "./settings";

// Move pull request around based on draft status
export async function pull_requestOpened({
  payload,
  github,
}: Context<WebhookPayloadPullRequest>) {
  const isDraft = payload.pull_request.draft;
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    labels: [isDraft ? IN_PROGRESS_LABEL : IN_REVIEW_LABEL],
  });
}

import { Context } from "probot";
import { syncLabelToBoard } from "./syncLabelToBoard";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";

// graphql
// Sync labels => project board
export async function pull_requestLabeled({
  payload,
  github,
}: Context<WebhookPayloadPullRequest>) {
  if (payload.label === undefined) {
    return;
  }
  await syncLabelToBoard({
    prOrIssue: payload.pull_request,
    repo: payload.repository,
    isPR: true,
    newLabel: payload.label.name,
    github,
  });
}

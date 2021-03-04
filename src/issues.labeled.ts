import { Context } from "probot";
import { WebhookPayloadIssues } from "@octokit/webhooks";
import { syncLabelToBoard } from "./syncLabelToBoard";

// Sync labels => project board
export async function issuesLabeled({
  payload,
  github,
}: Context<WebhookPayloadIssues>) {
  if (payload.label === undefined) {
    return;
  }
  await syncLabelToBoard({
    prOrIssue: payload.issue,
    repo: payload.repository,
    isPR: false,
    newLabel: payload.label.name,
    github,
  });
}

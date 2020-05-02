import { Context } from "probot";
import { TRIAGE_LABEL } from "./settings";
import { WebhookPayloadIssues } from "@octokit/webhooks";

// Add Triage label when an issue is opened
export async function issuesOpened({
  payload,
  github,
}: Context<WebhookPayloadIssues>) {
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    labels: [TRIAGE_LABEL],
  });
}

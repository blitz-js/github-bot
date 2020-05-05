import { Context } from "probot";
import { TRIAGE_LABEL, LABEL_TO_COLUMN } from "./settings";
import { WebhookPayloadIssues } from "@octokit/webhooks";
import { syncLabelToBoard } from "./syncLabelToBoard";

// Add Triage label when an issue is opened
export async function issuesOpened({
  payload,
  github,
}: Context<WebhookPayloadIssues>) {
  const statusLabels = payload.issue.labels
    .map((l) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN);
  const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL;
  await syncLabelToBoard({
    repo: payload.repository,
    prOrIssue: payload.issue,
    isPR: false,
    newLabel: canonicalLabel,
    github,
  });
}

import { syncLabelToBoard } from "../utils/syncLabelToBoard";
import type { EmitterWebhookEvent } from "@octokit/webhooks";

// Sync labels => project board
export const issuesLabeled = async ({
  payload,
}: EmitterWebhookEvent<"issues.labeled">) => {
  if (payload.label === undefined) return;

  await syncLabelToBoard({
    prOrIssue: payload.issue,
    repo: payload.repository,
    isPR: false,
    newLabel: payload.label.name,
  });
};

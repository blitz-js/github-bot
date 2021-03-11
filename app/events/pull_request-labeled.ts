import type { EmitterWebhookEvent } from "@octokit/webhooks";
import { syncLabelToBoard } from "@/utils/syncLabelToBoard";

// graphql
// Sync labels => project board
export const pull_requestLabeled = async ({
  payload,
}: EmitterWebhookEvent<"pull_request.labeled">) => {
  if (payload.label === undefined) return;

  await syncLabelToBoard({
    prOrIssue: payload.pull_request,
    repo: payload.repository,
    isPR: true,
    newLabel: payload.label.name,
  });
};

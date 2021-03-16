import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {payloadIsIssue} from "../utils/helpers"
import {syncLabelToBoard} from "../utils/syncLabelToBoard"

// Sync labels => project board
export const issuesLabeled = async ({
  payload,
}: EmitterWebhookEvent<"issues.labeled" | "pull_request.labeled">) => {
  if (payload.label === undefined) return

  await syncLabelToBoard({
    prOrIssue: payloadIsIssue(payload) ? payload.issue : payload.pull_request,
    repo: payload.repository,
    isPR: !payloadIsIssue(payload),
    newLabel: payload.label.name,
  })
}

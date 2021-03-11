import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {syncLabelToBoard} from "../utils/syncLabelToBoard"

// Sync labels => project board
export const issuesLabeled = async ({payload}: EmitterWebhookEvent<"issues.labeled">) => {
  if (payload.label === undefined) return

  await syncLabelToBoard({
    prOrIssue: payload.issue,
    repo: payload.repository,
    isPR: false,
    newLabel: payload.label.name,
  })
}

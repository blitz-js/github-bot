import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {LABEL_TO_COLUMN, TRIAGE_LABEL} from "../settings"
import {syncLabelToBoard} from "../utils/syncLabelToBoard"

// Add Triage label when an issue is opened
export const issuesOpened = async ({payload}: EmitterWebhookEvent<"issues.opened">) => {
  const statusLabels = (payload.issue.labels || [])
    .map((l) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN)

  const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL

  await syncLabelToBoard({
    repo: payload.repository,
    prOrIssue: payload.issue,
    isPR: false,
    newLabel: canonicalLabel,
  })
}

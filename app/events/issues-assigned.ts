import octokit from "@/utils/octokit"
import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {ASSIGNED_LABEL} from "../settings"

export const issuesAssigned = async ({payload}: EmitterWebhookEvent<"issues.assigned">) => {
  const totalAssignees = payload.issue.assignees.length

  if (totalAssignees === 1) {
    await octokit.issues.addLabels({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      labels: [ASSIGNED_LABEL],
    })
  }
}

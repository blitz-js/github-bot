import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {DONE_LABEL} from "../settings"
import {payloadIsIssue} from "../utils/helpers"
import octokit from "../utils/octokit"

// Add Done label when an issue is opened
export const issuesClosed = async ({
  payload,
}: EmitterWebhookEvent<"issues.closed" | "pull_request.closed">) => {
  let number: number

  if (payloadIsIssue(payload)) {
    number = payload.issue.number
  } else {
    number = payload.pull_request.number
  }

  await octokit.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: number,
    labels: [DONE_LABEL],
  })
}

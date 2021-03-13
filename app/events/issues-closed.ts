import type {EmitterWebhookEvent} from "@octokit/webhooks"
import type {IssuesClosedEvent} from "@octokit/webhooks-definitions/schema"
import {DONE_LABEL} from "../settings"
import octokit from "../utils/octokit"

const isIssue = (payload: any): payload is IssuesClosedEvent & {action: "closed"} =>
  typeof payload.issue === "object"

// Add Done label when an issue is opened
export const issuesClosed = async ({
  payload,
}: EmitterWebhookEvent<"issues.closed" | "pull_request.closed">) => {
  let number: number

  if (isIssue(payload)) {
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

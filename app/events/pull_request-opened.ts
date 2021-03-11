import {IN_PROGRESS_LABEL, IN_REVIEW_LABEL} from "@/settings"
import octokit from "@/utils/octokit"
import type {EmitterWebhookEvent} from "@octokit/webhooks"

// Move pull request around based on draft status
export const pull_requestOpened = async ({
  payload,
}: EmitterWebhookEvent<"pull_request.opened" | "pull_request.ready_for_review">) => {
  const isDraft = payload.pull_request.draft

  await octokit.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    labels: [isDraft ? IN_PROGRESS_LABEL : IN_REVIEW_LABEL],
  })
}

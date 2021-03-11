import {LABEL_TO_COLUMN} from "@/settings"
import octokit from "@/utils/octokit"
import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {findKey} from "lodash"

// Sync project board => labels
export const project_cardMoved = async ({
  payload,
}: EmitterWebhookEvent<"project_card.moved" | "project_card.created">) => {
  // ignore note cards
  if (payload.project_card.content_url === undefined) {
    return
  }

  const {data: column} = await octokit.projects.getColumn({
    column_id: payload.project_card.column_id,
  })

  const labelName = findKey(LABEL_TO_COLUMN, (c) => c === column.name)

  if (labelName === undefined) {
    console.warn(`Project card moved to column (${column.name}) with no corresponding label`)
    return
  }
  const issueNum: number = issueNumFromURL(payload.project_card.content_url)

  await octokit.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: issueNum,
    labels: [labelName],
  })
}

function issueNumFromURL(url: string): number {
  const parts = url.split("/")
  if (parts.length < 2) {
    throw new Error("NaN issue num from content_url")
  }
  const num = Number(parts[parts.length - 1])
  if (isNaN(num) || parts[parts.length - 2] !== "issues") {
    throw new Error("NaN issue num from content_url")
  }
  return num
}

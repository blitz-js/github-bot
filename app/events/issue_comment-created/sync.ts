import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {LABEL_TO_COLUMN, TRIAGE_LABEL} from "../../settings"
import {AnyRepo, ParsedRepo, sendMessage, trimMultiLine} from "../../utils/helpers"
import octokit from "../../utils/octokit"
import {syncLabelToBoard} from "../../utils/syncLabelToBoard"

type Payload = EmitterWebhookEvent<"issue_comment.created">["payload"]

const getIssuesToFix = async (repository: AnyRepo) => {
  const repo = ParsedRepo.fromAnyRepo(repository)
  const res = await octokit.search.issuesAndPullRequests({
    q: ["is:open", "no:project", `repo:${repo}`].join("+"),
  })
  return res.data.items
}

export const sync = async (payload: Payload) => {
  const issuesToFix = await getIssuesToFix(payload.repository)

  let message: string

  if (issuesToFix.length > 0) {
    message = trimMultiLine(`
        Going to add the following issues to the project board:
        ${issuesToFix.map((i) => "#" + i.number).join(", ")}
        
        Comment \`blitz bot sync confirm\` to execute
      `)
  } else {
    message = "All open issues are already on the project board."
  }

  await sendMessage({
    repo: payload.repository,
    number: payload.issue.number,
    message: message,
  })
}

export const syncConfirm = async (payload: Payload) => {
  const issuesToFix = await getIssuesToFix(payload.repository)

  await Promise.all(
    issuesToFix.map((issueToSync) => {
      const statusLabels = issueToSync.labels.map((l) => l.name).filter((n) => n in LABEL_TO_COLUMN)

      const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL

      return syncLabelToBoard({
        repo: payload.repository,
        prOrIssue: issueToSync,
        isPR: false,
        newLabel: canonicalLabel,
      })
    }),
  )
}

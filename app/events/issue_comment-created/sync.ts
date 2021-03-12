import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {LABEL_TO_COLUMN, TRIAGE_LABEL} from "../../settings"
import {ParsedRepo, parseRepo, trimMultiLine} from "../../utils/helpers"
import octokit from "../../utils/octokit"
import {syncLabelToBoard} from "../../utils/syncLabelToBoard"

type Payload = EmitterWebhookEvent<"issue_comment.created">["payload"]

const getIssuesToFix = async (repo: ParsedRepo) => {
  const res = await octokit.search.issuesAndPullRequests({
    q: ["is:open", "no:project", `repo:${repo}`].join("+"),
  })
  return res.data.items
}

export const sync = async (payload: Payload) => {
  const repo = parseRepo(payload.repository)

  const issuesToFix = await getIssuesToFix(repo)

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

  await octokit.issues.createComment({
    ...repo,
    issue_number: payload.issue.number,
    body: message,
  })
}

export const syncConfirm = async (payload: Payload) => {
  const repo = parseRepo(payload.repository)
  const issuesToFix = await getIssuesToFix(repo)

  await Promise.all(
    issuesToFix.map((issueToSync) => {
      const statusLabels = issueToSync.labels.map((l) => l.name).filter((n) => n in LABEL_TO_COLUMN)

      const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL

      return syncLabelToBoard({
        repo,
        prOrIssue: issueToSync,
        isPR: false,
        newLabel: canonicalLabel,
      })
    }),
  )
}

import {LABEL_TO_COLUMN, TRIAGE_LABEL} from "@/settings"
import {ParsedRepo, parseRepo, trimMultiLine} from "@/utils/helpers"
import octokit from "@/utils/octokit"
import {syncLabelToBoard} from "@/utils/syncLabelToBoard"
import type {EmitterWebhookEvent} from "@octokit/webhooks"

const getIssuesToFix = async (repo: ParsedRepo) => {
  const res = await octokit.search.issuesAndPullRequests({
    q: ["is:open", "no:project", `repo:${repo}`].join("+"),
  })
  return res.data.items
}

// Listen for people asking the bot to do stuff
export const issue_commentCreated = async ({
  payload,
}: EmitterWebhookEvent<"issue_comment.created">) => {
  const repo = parseRepo(payload.repository)

  if (payload.comment.body.trim() === "blitz bot sync") {
    const issuesToFix = await getIssuesToFix(repo)

    // Plan
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
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: message,
    })
  } else if (payload.comment.body.trim() === "blitz bot sync confirm") {
    const issuesToFix = await getIssuesToFix(repo)

    // Execute
    await Promise.all(
      issuesToFix.map((issueToSync) => {
        const statusLabels = issueToSync.labels
          .map((l) => l.name)
          .filter((n) => n in LABEL_TO_COLUMN)

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
}

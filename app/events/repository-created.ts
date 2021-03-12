import {ENDPOINT, LABEL_TO_COLOR, LABEL_TO_COLUMN} from "@/settings"
import {parseRepo} from "@/utils/helpers"
import octokit from "@/utils/octokit"
import type {EmitterWebhookEvent} from "@octokit/webhooks"

// Add webhooks to repo
export const repositoryCreated = async ({payload}: EmitterWebhookEvent<"repository.created">) => {
  const repo = parseRepo(payload.repository)

  const {data: project} = await octokit.projects.createForRepo({
    ...repo,
    name: "Dashboard",
  })

  for (const label in LABEL_TO_COLUMN) {
    await Promise.all([
      octokit.issues.createLabel({
        ...repo,
        name: label,
        color: LABEL_TO_COLOR[label],
      }),
      octokit.projects.createColumn({
        project_id: project.id,
        name: LABEL_TO_COLUMN[label],
      }),
    ])
  }

  await octokit.repos.createWebhook({
    ...repo,
    name: "Blitz GitHub Bot",
    config: {
      url: ENDPOINT,
      secret: process.env.WEBHOOK_SECRET,
      content_type: "application/json",
    },
    active: true,
    events: ["issues", "project_card", "pull_request", "issue_comment"],
  })
}

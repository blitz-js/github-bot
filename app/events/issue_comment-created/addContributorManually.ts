import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {addContributor} from "../../utils/addContributor"
import {ParsedRepo} from "../../utils/helpers"
import log from "../../utils/log"
import octokit from "../../utils/octokit"

type Payload = EmitterWebhookEvent<"issue_comment.created">["payload"]

export const addContributorRegex = /^add contributor @?[a-zA-Z-_0-9]+ \w+(,? \w+)*$/i

export const addContributorManually = async (payload: Payload, command: string) => {
  command = command.substr(16) // legth of "add contributor"

  if (command[0] === "@") {
    command = command.substr(1)
  }

  let [contributor, ...contributions] = command.split(" ")

  contributions = contributions.map((c) => (c.endsWith(",") ? c.substr(0, c.length - 1) : c))
  log.info(`@${contributor} contributions: ${contributions.join(", ") || "none"}`)

  if (contributions.length === 0) return

  const contributionMsg = await addContributor({contributor, contributions})

  if (contributionMsg) {
    log.info(contributionMsg)
    const repo = ParsedRepo.fromFullRepo(payload.repository)

    await octokit.issues.createComment({
      ...repo,
      issue_number: payload.issue.number,
      body: contributionMsg,
    })
  }
}

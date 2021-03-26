import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {addContributor} from "../../utils/addContributor"
import {sendMessage} from "../../utils/helpers"
import log from "../../utils/log"

type Payload = EmitterWebhookEvent<"issue_comment.created">["payload"]

export const addContributorRegex = /^add contributor @?[a-zA-Z-_0-9]+ \w+(,? \w+)*$/i

export const addContributorManually = async (payload: Payload, command: string) => {
  command = command.substr(16) // length of "add contributor"

  let mentionContributor = false
  if (command[0] === "@") {
    command = command.substr(1)
    mentionContributor = true
  }

  let [contributor, ...contributions] = command.split(" ")

  contributions = contributions.map((c) => (c.endsWith(",") ? c.substr(0, c.length - 1) : c))
  log.info(`@${contributor} contributions: ${contributions.join(", ") || "none"}`)

  if (contributions.length === 0) return

  let contributionMsg = await addContributor({contributor, contributions})

  if (contributionMsg) {
    if (!mentionContributor) contributionMsg = contributionMsg.replace("@", "")

    log.info(contributionMsg)

    await sendMessage({
      repo: payload.repository,
      number: payload.issue.number,
      message: contributionMsg,
    })
  }
}

import {COMMAND_PREFIXES, CONTRIBUTIONS_SETTINGS} from "@/settings"
import octokit from "@/utils/octokit"
import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {addContributorManually, addContributorRegex} from "./addContributorManually"
import {sync, syncConfirm} from "./sync"

const userInOrg = async (username: string) => {
  try {
    await octokit.orgs.checkMembershipForUser({
      org: CONTRIBUTIONS_SETTINGS.repo.owner,
      username,
    })
    return true
  } catch (error) {
    return false
  }
}

// Listen for people asking the bot to do stuff
export const issue_commentCreated = async ({
  payload,
}: EmitterWebhookEvent<"issue_comment.created">) => {
  if (!(await userInOrg(payload.sender.login))) {
    return
  }

  const body = payload.comment.body.trim().toLowerCase()

  let command: string | null = null

  for (const prefix of COMMAND_PREFIXES) {
    if (body.startsWith(prefix)) {
      command = body.substr(prefix.length + 1) // This +1 is removing an empty space
      break
    }
  }

  if (command === null) return

  switch (command) {
    case "sync":
      await sync(payload)
      break
    case "sync confirm":
      await syncConfirm(payload)
      break
    default:
      break
  }

  if (addContributorRegex.test(command)) {
    await addContributorManually(payload, command)
  }
}

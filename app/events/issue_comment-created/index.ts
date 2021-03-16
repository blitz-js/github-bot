import type {EmitterWebhookEvent} from "@octokit/webhooks"
import {COMMAND_PREFIXES, CONTRIBUTIONS_SETTINGS, WHOAMI} from "../../settings"
import {sendMessage, trimMultiLine} from "../../utils/helpers"
import octokit from "../../utils/octokit"
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

const help = (payload: EmitterWebhookEvent<"issue_comment.created">["payload"]) =>
  sendMessage({
    repo: payload.repository,
    number: payload.issue.number,
    message: trimMultiLine(
      `
      ### [Blitz.js GitHub Bot](https://github.com/blitz-js/github-bot)

      Usage: \`[PREFIX] [COMMAND]\`
      
      **Prefixes**
      You can call this bot in multiple ways, which are:
      
      - _@${WHOAMI}_
      - _${WHOAMI}_
      - _blitz-bot_
      - _blitz bot_

      E.g. \`@${WHOAMI} help\`
      
      ---
      
      **\`add contributor [USERNAME] [CONTRIBUTIONS]\`**
      Adds a user to the [contributors list](https://github.com/blitz-js/blitz#contributors-).
      
      - \`USERNAME\`: the GitHub username of the contributor. If it's written with a \`@\` in the front, the user will be mentioned.
        E.g. \`JuanM04\` or \`@JuanM04\`.
      - \`CONTRIBUTIONS\`: one or many of [these](https://allcontributors.org/docs/en/emoji-key).
        E.g. \`doc\`, \`code tests\`, or \`code, tests, bug\`.
      
      **\`help\`**
      Shows this message.
      
      **\`sync\`**
      Lists all the out of sync issues and pull requests. Those are the ones which card in the project isn't aligned with its label.
      
      **\`sync confirm\`**
      Syncs the out of sync issues.
      `,
      6,
    ),
  })

// Listen for people asking the bot to do stuff
export const issue_commentCreated = async ({
  payload,
}: EmitterWebhookEvent<"issue_comment.created">) => {
  const body = payload.comment.body.trim().toLowerCase()

  let command: string | null = null

  for (const prefix of COMMAND_PREFIXES) {
    if (body.startsWith(prefix)) {
      command = body.substr(prefix.length + 1) // This +1 is removing an empty space
      break
    }
  }

  if (!(await userInOrg(payload.sender.login))) return

  if (command === null) {
    await help(payload)
    return
  }

  if (addContributorRegex.test(command)) {
    await addContributorManually(payload, command)
    return
  }

  switch (command) {
    case "help":
      return await help(payload)
    case "sync":
      return await sync(payload)
    case "sync confirm":
      return await syncConfirm(payload)
    default:
      await sendMessage({
        repo: payload.repository,
        number: payload.issue.number,
        message: trimMultiLine(`
          The command \`${command}\` isn't a valid command.
          
          Send \`@${WHOAMI} help\` for more info.
        `),
      })
      return
  }
}

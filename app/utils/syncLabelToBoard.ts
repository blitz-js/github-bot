import type {RestEndpointMethodTypes} from "@octokit/rest"
import type {Issue, PullRequest} from "@octokit/webhooks-definitions/schema"
import {LABEL_TO_COLUMN} from "../settings"
import {AnyRepo, ParsedRepo} from "./helpers"
import log from "./log"
import octokit from "./octokit"

type PRorIssue =
  | PullRequest
  | Issue
  | RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][0]

const findCard = /* GraphQL */ `
  query FindCard($owner: String!, $repo: String!, $issue: Int!) {
    repository(owner: $owner, name: $repo) {
      issueOrPullRequest(number: $issue) {
        ... on PullRequest {
          projectCards(first: 10) {
            nodes {
              databaseId
              column {
                databaseId
              }
            }
          }
        }
        ... on Issue {
          projectCards(first: 10) {
            nodes {
              databaseId
              column {
                databaseId
              }
            }
          }
        }
      }
    }
  }
`

interface SyncLabelToBoardArgs {
  prOrIssue: PRorIssue
  repo: AnyRepo
  isPR: boolean
  newLabel: string
}

export async function syncLabelToBoard({
  prOrIssue,
  repo: repository,
  isPR,
  newLabel,
}: SyncLabelToBoardArgs) {
  const repo = ParsedRepo.fromAnyRepo(repository)

  const {data: projects} = await octokit.projects.listForRepo({
    ...repo,
  })

  if (projects.length === 0) {
    log.warn(`Could not find a project board on the repo ${repo}`)
    return
  }
  const projectId = projects[0].id

  // Get new status label
  if (!(newLabel in LABEL_TO_COLUMN)) {
    return
  }
  const columnName = LABEL_TO_COLUMN[newLabel]

  // Get rid of other label(s) that start with status/
  if (!prOrIssue.labels) {
    log.warn(`Could not find labels on the repo ${repo}`)
    return
  }

  const otherLabels: string[] = prOrIssue.labels
    .map((l: {name: string}) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN && n !== newLabel)

  await Promise.all(
    otherLabels.map((l) =>
      octokit.issues.removeLabel({
        ...repo,
        issue_number: prOrIssue.number,
        name: l,
      }),
    ),
  )

  // Find the corresponding column to move to
  const columns = await octokit.projects.listColumns({
    project_id: projectId,
  })

  const destColumn = columns.data.find((c) => c.name === columnName)
  if (destColumn === undefined) {
    log.warn(
      `Could not find corresponding column "${columnName}" on project board of the repo ${repo}`,
    )
    return
  }

  // Find the card on the project board.
  // GitHub REST API gives us no way to go from issue => card_id, but GraphQL does ;)
  const findCardResult: any = await octokit.graphql(findCard, {
    ...repo,
    issue: prOrIssue.number,
  })

  if (findCardResult === null) {
    log.error(
      "Something went wrong with graphql to get project card from issue",
      `repo: ${repo}`,
      `issue or pr: #${prOrIssue.number}`,
    )
    return
  }
  const card = findCardResult.repository.issueOrPullRequest.projectCards.nodes.pop()
  if (card === undefined) {
    // create card on board
    await octokit.projects.createCard({
      column_id: destColumn.id,
      content_id: prOrIssue.id,
      content_type: isPR ? "PullRequest" : "Issue",
    })
  } else if (card.column === null || card.column.databaseId !== destColumn.id) {
    // move card only if not already in the right column
    await octokit.projects.moveCard({
      card_id: card.databaseId,
      column_id: destColumn.id,
      position: "top",
    })
  }
}

import type { EventPayloads } from "@octokit/webhooks";
import type { OctokitClient } from "@/utils/types";
import { Endpoints } from "@octokit/types";
import { LABEL_TO_COLUMN } from "@/settings";

type PRorIssue =
  | Endpoints["GET /search/issues"]["response"]["data"]["items"][0]
  | EventPayloads.WebhookPayloadPullRequestPullRequest
  | EventPayloads.WebhookPayloadIssuesIssue;

const findCard = `
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
`;
// import nock from 'nock'

interface SyncLabelToBoardArgs {
  prOrIssue: PRorIssue;
  repo: EventPayloads.PayloadRepository;
  isPR: boolean;
  newLabel: string;
  octokit: OctokitClient;
}

export async function syncLabelToBoard({
  prOrIssue,
  repo,
  isPR,
  newLabel,
  octokit,
}: SyncLabelToBoardArgs) {
  // nock.recorder.rec();
  const repoId = {
    owner: repo.owner.login,
    repo: repo.name,
  };
  const projects = (await octokit.projects.listForRepo(repoId)).data;
  if (projects.length === 0) {
    console.error("could not find a project board on this repo");
    return;
  }
  const projectId = projects[0].id;

  // Get new status label
  if (!(newLabel in LABEL_TO_COLUMN)) {
    return;
  }
  const columnName = LABEL_TO_COLUMN[newLabel];

  // Get rid of other label(s) that start with status/
  const otherLabels: string[] = (prOrIssue.labels as Array<{ name: string }>)
    .map((l: { name: string }) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN && n !== newLabel);
  await Promise.all(
    otherLabels.map((l) =>
      octokit.issues.removeLabel({
        ...repoId,
        issue_number: prOrIssue.number,
        name: l,
      })
    )
  );

  // Find the corresponding column to move to
  const columns = await octokit.projects.listColumns({
    project_id: projectId,
  });
  const destColumn = columns.data.find((c) => c.name === columnName);
  if (destColumn === undefined) {
    console.error("could not find corresponding column on project board");
    return;
  }

  // Find the card on the project board.
  // GitHub REST API gives us no way to go from issue => card_id, but GraphQL does ;)
  const findCardResult: any = await octokit.graphql(findCard, {
    ...repoId,
    issue: prOrIssue.number,
  });
  if (findCardResult === null) {
    console.error(
      "something went wrong with graphql to get project card from issue"
    );
    return;
  }
  const card = findCardResult.repository.issueOrPullRequest.projectCards.nodes.pop();
  if (card === undefined) {
    // create card on board
    await octokit.projects.createCard({
      column_id: destColumn.id,
      content_id: prOrIssue.id,
      content_type: isPR ? "PullRequest" : "Issue",
    });
  } else if (card.column === null || card.column.databaseId !== destColumn.id) {
    // move card only if not already in the right column
    await octokit.projects.moveCard({
      card_id: card.databaseId,
      column_id: destColumn.id,
      position: "top",
    });
  }
}

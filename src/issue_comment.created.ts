import { Context, GitHubAPI } from "probot";
import { WebhookPayloadIssueComment } from "@octokit/webhooks";
import { syncLabelToBoard } from "./syncLabelToBoard";
import { LABEL_TO_COLUMN, TRIAGE_LABEL } from "./settings";

async function getIssuesToFix(github: GitHubAPI, repoName: string) {
  return (
    await github.search.issuesAndPullRequests({
      q: `is:open+no:project+repo:${repoName}`,
    })
  ).data.items;
}
// Listen for people asking the bot to do stuff
export async function issue_commentCreated({
  payload,
  github,
}: Context<WebhookPayloadIssueComment>) {
  if (payload.comment.body.trim() === "blitz bot sync") {
    const issuesToFix = await getIssuesToFix(
      github,
      payload.repository.full_name
    );
    // Plan
    const message: string =
      issuesToFix.length > 0
        ? `Going to add the following issues to the project board:
${issuesToFix.map((i) => "#" + i.number).join(", ")}
\`blitz bot sync confirm\` to execute`
        : `All open issues are already on the project board.`;
    await github.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: message,
    });
  } else if (payload.comment.body.trim() === "blitz bot sync confirm") {
    const issuesToFix = await getIssuesToFix(
      github,
      payload.repository.full_name
    );
    // Execute
    await Promise.all(
      issuesToFix.map((issueToSync) => {
        const statusLabels = issueToSync.labels
          .map((l) => l.name)
          .filter((n) => n in LABEL_TO_COLUMN);
        const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL;
        return syncLabelToBoard({
          repo: payload.repository,
          prOrIssue: issueToSync,
          isPR: false,
          newLabel: canonicalLabel,
          github,
        });
      })
    );
  }
}

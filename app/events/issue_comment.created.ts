import type { Handler, OctokitClient } from "../utils/types";
import { syncLabelToBoard } from "../utils/syncLabelToBoard";
import { LABEL_TO_COLUMN, TRIAGE_LABEL } from "../settings";

async function getIssuesToFix(octokit: OctokitClient, repoName: string) {
  return (
    await octokit.search.issuesAndPullRequests({
      q: `is:open+no:project+repo:${repoName}`,
    })
  ).data.items;
}
// Listen for people asking the bot to do stuff
export const issue_commentCreated: Handler<"issue_comment.created"> = async ({
  payload,
  octokit,
}) => {
  if (payload.comment.body.trim() === "blitz bot sync") {
    const issuesToFix = await getIssuesToFix(
      octokit,
      payload.repository.full_name
    );
    // Plan
    const message: string =
      issuesToFix.length > 0
        ? `Going to add the following issues to the project board:
${issuesToFix.map((i) => "#" + i.number).join(", ")}
\`blitz bot sync confirm\` to execute`
        : `All open issues are already on the project board.`;
    await octokit.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: message,
    });
  } else if (payload.comment.body.trim() === "blitz bot sync confirm") {
    const issuesToFix = await getIssuesToFix(
      octokit,
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
          octokit,
        });
      })
    );
  }
};

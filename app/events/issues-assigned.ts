import type { Handler } from "../utils/types";
import { ASSIGNED_LABEL } from "../settings";

export const issuesAssigned: Handler<"issues.assigned"> = async ({
  payload,
  octokit,
}) => {
  const totalAssignees = payload.issue.assignees.length;
  if (totalAssignees === 1) {
    await octokit.issues.addLabels({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      labels: [ASSIGNED_LABEL],
    });
  }
};

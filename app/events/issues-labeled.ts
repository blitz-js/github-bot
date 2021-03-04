import type { Handler } from "../utils/types";
import { syncLabelToBoard } from "../utils/syncLabelToBoard";

// Sync labels => project board
export const issuesLabeled: Handler<"issues.labeled"> = async ({
  payload,
  octokit,
}) => {
  if (payload.label === undefined) {
    return;
  }
  await syncLabelToBoard({
    prOrIssue: payload.issue,
    repo: payload.repository,
    isPR: false,
    newLabel: payload.label.name,
    octokit,
  });
};

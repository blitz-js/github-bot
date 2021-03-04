import type { Handler } from "../utils/types";
import { syncLabelToBoard } from "../utils/syncLabelToBoard";

// graphql
// Sync labels => project board
export const pull_requestLabeled: Handler<"pull_request.labeled"> = async ({
  payload,
  octokit,
}) => {
  if (payload.label === undefined) {
    return;
  }
  await syncLabelToBoard({
    prOrIssue: payload.pull_request,
    repo: payload.repository,
    isPR: true,
    newLabel: payload.label.name,
    octokit,
  });
};

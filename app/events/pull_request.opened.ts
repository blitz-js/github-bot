import type { Handler } from "../utils/types";
import { IN_PROGRESS_LABEL, IN_REVIEW_LABEL } from "../settings";

// Move pull request around based on draft status
export const pull_requestOpened: Handler<"pull_request.opened"> = async ({
  payload,
  octokit,
}) => {
  const isDraft = payload.pull_request.draft;
  await octokit.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    labels: [isDraft ? IN_PROGRESS_LABEL : IN_REVIEW_LABEL],
  });
};

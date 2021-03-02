import type { Handler } from "@utils/types";
import { TRIAGE_LABEL, LABEL_TO_COLUMN } from "@settings";
import { syncLabelToBoard } from "@utils/syncLabelToBoard";

// Add Triage label when an issue is opened
export const issuesOpened: Handler<"issues.opened"> = async ({
  payload,
  octokit,
}) => {
  const statusLabels = (payload.issue.labels || [])
    .map((l) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN);
  const canonicalLabel = statusLabels.pop() || TRIAGE_LABEL;
  await syncLabelToBoard({
    repo: payload.repository,
    prOrIssue: payload.issue,
    isPR: false,
    newLabel: canonicalLabel,
    octokit,
  });
};

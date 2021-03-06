import type { Handler } from "../utils/types";
import { LABEL_TO_COLUMN } from "../settings";
import { findKey } from "lodash";

// Sync project board => labels
export const project_cardMoved: Handler<
  "project_card.moved" | "project_card.created"
> = async ({ payload, octokit }) => {
  // ignore note cards
  if ((payload.project_card as any).content_url === undefined) {
    return;
  }

  const newColumn = payload.project_card.column_id;
  const columnName = (
    await octokit.projects.getColumn({ column_id: newColumn })
  ).data.name;
  const labelName = findKey(LABEL_TO_COLUMN, (c) => c === columnName);
  if (labelName === undefined) {
    console.log("project card moved to column with no corresponding label");
    return;
  }
  const issueNum: number = issueNumFromURL(
    (payload.project_card as any).content_url
  );
  await octokit.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: issueNum,
    labels: [labelName],
  });
};

function issueNumFromURL(url: string): number {
  const parts = url.split("/");
  if (parts.length < 2) {
    throw new Error("NaN issue num from content_url");
  }
  const num = Number(parts[parts.length - 1]);
  if (isNaN(num) || parts[parts.length - 2] !== "issues") {
    throw new Error("NaN issue num from content_url");
  }
  return num;
}

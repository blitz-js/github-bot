import { Context } from "probot";
import { IN_PROGRESS_LABEL, IN_REVIEW_LABEL } from "./settings";
import { addContributions } from "./add_contribution";
// Move pull request around based on draft status
export async function pull_requestOpened(context: Context) {
  const { payload, github } = context;
  const isDraft = payload.pull_request.draft;
  context.log("functionpull_requestOpened -> isDraft", isDraft);
  console.log("functionpull_requestOpened -> isDraft", isDraft);
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    labels: [isDraft ? IN_PROGRESS_LABEL : IN_REVIEW_LABEL],
  });
  await addContributions(context);
}

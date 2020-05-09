import { Context } from "probot";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import { IN_PROGRESS_LABEL, IN_REVIEW_LABEL } from "./settings";
import { FILETYPE_TO_CONTRIB_TYPE } from "./settings";

// Move pull request around based on draft status
export async function pull_requestOpened({
  payload,
  github,
}: Context<WebhookPayloadPullRequest>) {
  const isDraft = payload.pull_request.draft;
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    labels: [isDraft ? IN_PROGRESS_LABEL : IN_REVIEW_LABEL],
  });
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const number = payload.number;
  const isBot = payload.pull_request.user.type === "Bot";
  const who = payload.pull_request.user.login;
  const isTargetDefaultBranch =
    payload.pull_request.head.repo.default_branch ===
    payload.pull_request.base.ref;
  const fileChanged = payload.pull_request.changed_files;
  if (isBot || !isTargetDefaultBranch || fileChanged == 0) {
    return;
  }
  const files = await github.pulls.listFiles({
    owner,
    repo,
    number,
    headers: { accept: "application/vnd.github.v3.diff" },
    page: 0,
    per_page: 100,
  });
  const contributions: Array<string> = [];
  for (const file of files.data) {
    FILETYPE_TO_CONTRIB_TYPE.map((fileTypeMapping) => {
      const contribType = Object.keys(fileTypeMapping)[0];
      const filTeredArr = fileTypeMapping[contribType].filter((fileExt) =>
        file.filename.endsWith(fileExt)
      );
      if (filTeredArr.length === 1) {
        contributions.push(contribType);
      }
    });
  }
  const action = "add";
  if (contributions.length > 0) {
    await probotProcessIssueComment({ context, who, action, contributions });
  }
}

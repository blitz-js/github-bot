import { Handler } from "../../utils/types";

import { addContributor } from "./addContributor";
import { getContributions } from "./getContributions";

export const pull_requestClosed: Handler<"pull_request.closed"> = async (
  context
) => {
  const { payload, octokit } = context;
  const repo = {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
  };

  const isBot = payload.pull_request.user.type.toLowerCase() === "bot";
  const isTargetDefaultBranch =
    payload.pull_request.head.repo.default_branch ===
    payload.pull_request.base.ref;
  const fileChanged = payload.pull_request.changed_files;
  const wasMerged = payload.pull_request.merged;

  if (isBot || !isTargetDefaultBranch || fileChanged === 0 || !wasMerged) {
    return;
  }

  const contributions = await getContributions({
    octokit,
    repo,
    pr: payload.number,
  });

  if (contributions.length === 0) return;

  const contributionMsg = await addContributor({
    octokit,
    contributor: payload.pull_request.user.login,
    contributions,
  });

  if (contributionMsg) {
    await octokit.issues.createComment({
      ...repo,
      issue_number: payload.number,
      body: contributionMsg,
    });
  }
};

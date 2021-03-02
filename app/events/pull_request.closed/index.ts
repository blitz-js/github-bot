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

  const isBot = payload.pull_request.user.type === "Bot";
  const isTargetDefaultBranch =
    payload.pull_request.head.repo.default_branch ===
    payload.pull_request.base.ref;
  const fileChanged = payload.pull_request.changed_files;

  if (isBot || !isTargetDefaultBranch || fileChanged === 0) {
    return;
  }

  const contributions = await getContributions({
    octokit,
    repo,
    pr: payload.number,
  });

  if (contributions.length === 0) return;

  await addContributor({
    octokit,
    contributor: payload.pull_request.user.login,
    contributions,
  });
};

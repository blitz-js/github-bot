import { CONTRIBUTIONS_SETTINGS } from "@/settings";
import commit from "@/utils/commit";
import { OctokitClient } from "@/utils/types";
import { ResourceNotFoundError } from "@/utils/errors";
import _ from "lodash";

// @ts-expect-error
import { addContributorWithDetails, generate } from "all-contributors-cli";

async function getFile({
  octokit,
  repo,
  branch,
  path,
}: {
  octokit: OctokitClient;
  repo: { owner: string; repo: string };
  branch?: string;
  path: string;
}) {
  const { data: file } = await octokit.repos.getContent({
    ...repo,
    ref: branch,
    path,
  });

  if (Array.isArray(file) || !("content" in file)) {
    throw new ResourceNotFoundError(path, `${repo.owner}/${repo.repo}`);
  }

  return Buffer.from(file.content, "base64").toString("utf-8");
}

export async function addContributor({
  octokit,
  contributor,
  contributions,
}: {
  octokit: OctokitClient;
  contributor: string;
  contributions: string[];
}) {
  const { repo, defaultBranch } = CONTRIBUTIONS_SETTINGS;

  // Get contributor data
  const { data: rawContributorData } = await octokit.users.getByUsername({
    username: contributor,
  });

  const contributorData = {
    login: rawContributorData.login,
    name: rawContributorData.name || rawContributorData.login,
    avatar_url: rawContributorData.avatar_url,
    profile: rawContributorData.blog || rawContributorData.html_url,
  };

  // Get .all-contributorsrc and modify it
  let allContributorsSrc = JSON.parse(
    await getFile({
      octokit,
      repo,
      path: ".all-contributorsrc",
      branch: defaultBranch,
    })
  );

  const oldContributions =
    allContributorsSrc.contributors.find((c: any) => c.login === contributor)
      ?.contributions || [];
  const allContributions = _.uniq([...oldContributions, ...contributions]);

  if (allContributions.length <= oldContributions.length) return;

  allContributorsSrc.contributors = await addContributorWithDetails({
    ...contributorData,
    options: allContributorsSrc,
    contributions: allContributions,
  });

  // Get README.md and modify it
  let readme = await getFile({
    octokit,
    repo,
    path: "README.md",
    branch: defaultBranch,
  });

  readme = await generate(
    allContributorsSrc,
    allContributorsSrc.contributors,
    readme
  );

  // Update files
  await commit({
    octokit,
    ...repo,
    branch: defaultBranch,
    changes: [
      {
        message: [
          "(meta)",
          oldContributions.length > 0 ? "updated" : "added",
          `@${contributor}`,
          "as contributor",
        ].join(" "),
        files: {
          ".all-contributorsrc": JSON.stringify(allContributorsSrc, null, 2),
          "README.md": readme,
        },
      },
    ],
  });
}

import { CONTRIBUTIONS_SETTINGS } from "../../settings";
import { OctokitClient } from "../../utils/types";
import { ResourceNotFoundError } from "../../utils/errors";
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

async function updateFile({
  octokit,
  repo,
  branch,
  path,
  content,
}: {
  octokit: OctokitClient;
  repo: { owner: string; repo: string };
  branch?: string;
  path: string;
  content: string;
}) {
  const { data: oldFile } = await octokit.repos.getContent({
    ...repo,
    ref: branch,
    path,
  });

  if (Array.isArray(oldFile) || !("content" in oldFile)) {
    throw new ResourceNotFoundError(path, `${repo.owner}/${repo.repo}`);
  }

  const encodedContent = Buffer.from(content, "utf-8").toString("base64");

  return await octokit.repos.createOrUpdateFileContents({
    ...repo,
    content: encodedContent,
    message: `updated ${path}`,
    path,
    branch,
    sha: oldFile.sha,
  });
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

  // Check if branch exists
  const branchName = `add-contributor/${contributor}`;
  let branchExists: boolean;

  try {
    await octokit.git.getRef({
      ...repo,
      ref: `heads/${branchName}`,
    });

    // If it didn't throw an error, it means it exists
    branchExists = true;
  } catch (error) {
    branchExists = false;
  }

  // Get contributor data
  const { data: rawContributorData } = await octokit.users.getByUsername({
    username: contributor,
  });

  const contributorData = {
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
      branch: branchExists ? branchName : defaultBranch,
    })
  );

  const oldContributions =
    allContributorsSrc.contributors.find((c: any) => c.login === contributor)
      ?.contributions || [];

  if (_.isEqual(contributions, oldContributions)) return;

  allContributorsSrc.contributors = await addContributorWithDetails({
    ...contributorData,
    options: allContributorsSrc,
    contributions: _.uniq([...contributions, ...(oldContributions || [])]),
  });

  // Get README.md and modify it
  let readme = await getFile({
    octokit,
    repo,
    path: "README.md",
    branch: branchExists ? branchName : defaultBranch,
  });

  readme = await generate(
    allContributorsSrc,
    allContributorsSrc.contributors,
    readme
  );

  // Create branch if doesn't exist
  if (!branchExists) {
    const { data: defaultBranchRef } = await octokit.git.getRef({
      ...repo,
      ref: `heads/${defaultBranch}`,
    });

    await octokit.git.createRef({
      ...repo,
      ref: `refs/heads/${branchName}`,
      sha: defaultBranchRef.object.sha,
    });
  }

  // Update files
  await updateFile({
    octokit,
    repo,
    content: JSON.stringify(allContributorsSrc, null, 2),
    path: ".all-contributorsrc",
    branch: branchName,
  });

  await updateFile({
    octokit,
    repo,
    content: readme,
    path: "README.md",
    branch: branchName,
  });

  // Create PR
  if (!branchExists) {
    await octokit.pulls.create({
      ...repo,
      head: branchName,
      base: defaultBranch,
      title: `Added @${contributor} as contributor`,
      maintainer_can_modify: true,
    });
  }
}

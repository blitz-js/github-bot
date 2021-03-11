import { CONTRIBUTIONS_SETTINGS } from "@/settings";
import commit from "@/utils/commit";
import octokit from "@/utils/octokit";
import _ from "lodash";
import { parseRepo, AnyRepo } from "@/utils/helpers";

// @ts-expect-error
import { addContributorWithDetails, generate } from "all-contributors-cli";

async function getFile({
  repo: repository,
  branch,
  path,
}: {
  repo: AnyRepo;
  branch?: string;
  path: string;
}) {
  const repo = parseRepo(repository);

  const { data: file } = await octokit.repos.getContent({
    ...repo,
    ref: branch,
    path,
  });

  if (Array.isArray(file) || !("content" in file)) {
    throw new Error(`"${path}" not found in ${repo}:${branch}`);
  }

  return Buffer.from(file.content, "base64").toString("utf-8");
}

function englishArray(array: string[]): string {
  let arr: string[] = Object.assign([], array);

  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];

  const lastItem = arr.pop();
  return arr.join(", ") + " and " + lastItem;
}

export async function addContributor({
  contributor,
  contributions,
}: {
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
      repo,
      path: ".all-contributorsrc",
      branch: defaultBranch,
    })
  );

  const oldContributions: string[] =
    allContributorsSrc.contributors.find((c: any) => c.login === contributor)
      ?.contributions || [];
  const newContributions = _.difference(contributions, oldContributions);

  if (newContributions.length === 0) return;

  allContributorsSrc.contributors = await addContributorWithDetails({
    ...contributorData,
    options: allContributorsSrc,
    contributions: [...oldContributions, ...newContributions],
  });

  // Get README.md and modify it
  let readme = await getFile({
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
    repo,
    branch: defaultBranch,
    changes: [
      {
        message:
          oldContributions.length === 0
            ? `(meta) added @${contributor} as contributor`
            : `(meta) updated @${contributor} contributions`,
        files: {
          ".all-contributorsrc": JSON.stringify(allContributorsSrc, null, 2),
          "README.md": readme,
        },
      },
    ],
  });

  return `Added @${contributor} contributions for ${englishArray(
    newContributions
  )}`;
}

import { Repository } from "./tasks/Repository";
import { OptionsConfig } from "./tasks/OptionsConfig";
import { ContentFiles } from "./tasks/ContentFiles";
import { getUserDetails } from "./utils/getUserDetails";
import { FILETYPE_TO_CONTRIB_TYPE } from "./settings";
import { BranchNotFoundError, ResourceNotFoundError } from "./utils/errors";
import { Context } from "probot";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";

async function processAddContributor({
  context,
  repository,
  optionsConfig,
  who,
  contributions,
  branchName,
}: Record<any, any>) {
  if (contributions.length === 0) {
    context.log.info("No contributions");
  }
  const { name, avatar_url, profile } = await getUserDetails({
    github: context.github,
    username: who,
  });

  const result = await optionsConfig.addContributor({
    login: who,
    contributions,
    name,
    avatar_url,
    profile,
    context,
  });
  if (result === false) {
    context.log.info("same contributions result");
    return;
  }

  const contentFiles = new ContentFiles({
    repository,
  });
  await contentFiles.fetch(optionsConfig);
  if (optionsConfig.getOriginalSha() === undefined) {
    contentFiles.init();
  }
  contentFiles.generate(optionsConfig);
  const filesByPathToUpdate = contentFiles.get();
  filesByPathToUpdate[optionsConfig.getPath()] = {
    content: optionsConfig.getRaw(),
    originalSha: optionsConfig.getOriginalSha(),
  };

  await repository.createOrUpdateFiles({
    filesByPath: filesByPathToUpdate,
    branchName,
  });
  return;
}

async function setupRepository({ context, branchName }: Record<any, any>) {
  const defaultBranch = context.payload.repository.default_branch;
  const repository = new Repository({
    ...context.repo(),
    github: context.github,
    defaultBranch,
    log: context.log,
  });

  try {
    await repository.getRef(branchName);
    context.log.info(
      `Branch: ${branchName} EXISTS, will work from this branch`
    );
    repository.setBaseBranch(branchName);
  } catch (error) {
    if (error instanceof BranchNotFoundError) {
      context.log.info(
        `Branch: ${branchName} DOES NOT EXIST, will work from default branch`
      );
    } else {
      throw error;
    }
  }

  return repository;
}

async function setupOptionsConfig({ repository }: Record<any, any>) {
  const optionsConfig = new OptionsConfig({
    repository,
  });

  try {
    await optionsConfig.fetch();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      optionsConfig.init();
    } else {
      throw error;
    }
  }

  return optionsConfig;
}

export async function probotProcessPR({
  context,
  who,
  action,
  contributions,
}: Record<any, any>) {
  if (action === "add") {
    const branchName = context.payload.repository.default_branch;
    const repository = await setupRepository({
      context,
      branchName,
    });
    const optionsConfig = await setupOptionsConfig({ repository });

    repository.skipCiString = optionsConfig.options.skipCi ? "[skip ci]" : "";

    await processAddContributor({
      context,
      repository,
      optionsConfig,
      who,
      contributions,
      branchName,
    });
    return;
  }
  return;
}

export async function addContributions(context: Context) {
  const { payload, github } = context;
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
    await probotProcessPR({ context, who, action, contributions });
  }
}

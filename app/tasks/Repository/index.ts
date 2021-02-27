import { isArray } from "lodash";
import {
  AllContributorBotError,
  BranchNotFoundError,
  ResourceNotFoundError,
} from "../../utils/errors";
import type { LogClient, OctokitClient } from "../../utils/types";

export class Repository {
  octokit: OctokitClient;
  repo: string;
  owner: string;
  defaultBranch: string;
  baseBranch: string;
  log: LogClient;
  skipCiString: string;
  constructor({
    repo,
    owner,
    octokit,
    defaultBranch,
    log,
  }: {
    octokit: OctokitClient;
    repo: string;
    owner: string;
    defaultBranch: string;
    log: LogClient;
  }) {
    console.log(
      "Repository -> constructor -> { repo, owner, octokit, defaultBranch, log }",
      { owner, defaultBranch }
    );
    this.octokit = octokit;
    this.repo = repo;
    this.owner = owner;
    this.defaultBranch = defaultBranch;
    this.baseBranch = defaultBranch;
    this.log = log;
    this.skipCiString = "[skip ci]";
  }

  getFullname() {
    return `${this.owner}/${this.repo}`;
  }

  setBaseBranch(branchName: string) {
    this.baseBranch = branchName;
  }

  async getFile(filePath: string) {
    try {
      // https://octokit.github.io/rest.js/v18#repos-get-content
      const { data: file } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.baseBranch,
      });

      if (isArray(file) || !("content" in file)) {
        throw new Error(
          `"${filePath}" leads to something that isn't a file. Probably a directory`
        );
      }

      const contentEncoded = file.content;
      const content = Buffer.from(contentEncoded, "base64").toString();
      return {
        content,
        sha: file.sha,
      };
    } catch (error) {
      if (error.status === 404) {
        throw new ResourceNotFoundError(filePath, this.getFullname());
      } else {
        throw error;
      }
    }
  }

  async getMultipleFiles(filePathsArray: Array<string>) {
    // TODO: can probably optimise this instead of sending a request per file
    const repository = this;

    const getFilesMultiple = filePathsArray.map((filePath) => {
      return repository.getFile(filePath).then(({ content, sha }) => ({
        filePath,
        content,
        sha,
      }));
    });

    const getFilesMultipleList = await Promise.all(getFilesMultiple);
    const multipleFilesByPath: Record<
      string,
      { content: string; sha: string }
    > = {};
    getFilesMultipleList.forEach(({ filePath, content, sha }) => {
      multipleFilesByPath[filePath] = {
        content,
        sha,
      };
    });

    return multipleFilesByPath;
  }

  async getRef(branchName: string) {
    try {
      const result = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });
      return result.data.object.sha;
    } catch (error) {
      if (error.status === 404) {
        throw new BranchNotFoundError(branchName);
      }
    }
  }

  async createBranch(branchName: string) {
    const fromSha = await this.getRef(this.defaultBranch);

    if (!fromSha) throw new Error("Mising SHA");

    // https://octokit.github.io/rest.js/v18#git-create-ref
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    });
  }

  async createOrUpdateFile({
    filePath,
    content,
    branchName,
    originalSha,
  }: {
    filePath: string;
    content: string;
    branchName: string;
    originalSha?: string;
  }) {
    const contentEncoded = Buffer.from(content).toString("base64");

    // https://octokit.github.io/rest.js/v18#repos-create-or-update-file-contents
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message: `docs: update ${filePath} ${this.skipCiString}`,
      content: contentEncoded,
      sha: originalSha,
      branch: branchName,
    });
  }

  async createOrUpdateFiles({ filesByPath, branchName }: Record<any, any>) {
    const repository = this;
    const createOrUpdateFilesMultiple = Object.entries(filesByPath).map(
      ([filePath, { content, originalSha }]: Array<any>) => {
        return repository.createOrUpdateFile({
          filePath,
          content,
          branchName,
          originalSha,
        });
      }
    );

    await Promise.all(createOrUpdateFilesMultiple);
  }

  async getPullRequestURL({ branchName }: Record<any, any>) {
    try {
      const results = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: "open",
        head: `${this.owner}:${branchName}`,
      });
      return results.data[0].html_url;
    } catch (error) {
      // Hard fail, but recoverable (not ideal for UX)
      this.log.error(error);
      throw new AllContributorBotError(
        `A pull request is already open for the branch \`${branchName}\`.`
      );
    }
  }

  async createPullRequest({ title, body, branchName }: Record<any, any>) {
    try {
      const result = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        head: branchName,
        base: this.defaultBranch,
        maintainer_can_modify: true,
      });
      return {
        pullRequestURL: result.data.html_url,
        pullCreated: true,
      };
    } catch (error) {
      if (error.status === 422) {
        this.log.debug(error);
        this.log.info("Pull request is already open, finding pull request...");
        const pullRequestURL = await this.getPullRequestURL({
          branchName,
        });
        return {
          pullRequestURL,
          pullCreated: false,
        };
      } else {
        throw error;
      }
    }
  }

  async createPullRequestFromFiles({
    title,
    body,
    filesByPath,
    branchName,
  }: Record<any, any>) {
    const branchNameExists = branchName === this.baseBranch;
    if (!branchNameExists) {
      await this.createBranch(branchName);
    }

    await this.createOrUpdateFiles({
      filesByPath,
      branchName,
    });

    return await this.createPullRequest({
      title,
      body,
      branchName,
    });
  }
}

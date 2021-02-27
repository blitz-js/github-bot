const { generate: generateContentFile } = require("all-contributors-cli");
const { initBadge, initContributorsList } = require("all-contributors-cli");

import { AllContributorBotError } from "../../utils/errors";
import type { Repository } from "../Repository";

type ContentFilesByPath = Record<
  string,
  { content: string; sha?: string; originalSha?: string }
>;

function modifyFiles({
  contentFilesByPath,
  fileContentModifierFunction,
}: {
  contentFilesByPath: ContentFilesByPath;
  fileContentModifierFunction: (originalContent: string) => string;
}) {
  const newFilesByPath: any = {};
  Object.entries(contentFilesByPath).forEach(
    ([filePath, { content, sha, originalSha }]) => {
      const newFileContents = fileContentModifierFunction(content);
      newFilesByPath[filePath] = {
        content: newFileContents,
        originalSha: sha || originalSha,
      };
    }
  );
  return newFilesByPath;
}

/*
 *  Fetches, stores, generates, and updates the readme content files for the contributors list
 */
export class ContentFiles {
  repository: Repository;
  contentFilesByPath: ContentFilesByPath | null;
  constructor({ repository }: Record<any, any>) {
    this.repository = repository;
    this.contentFilesByPath = null;
  }

  async fetch(optionsConfig: any) {
    const options = optionsConfig.get();
    if (options.files.length > 15) {
      throw new AllContributorBotError(
        `Your .all-contributorsrc cannot contain more than 5 files.`
      );
    }
    this.contentFilesByPath = await this.repository.getMultipleFiles(
      options.files
    );
  }

  init() {
    if (!this.contentFilesByPath) return;

    const newFilesByPath = modifyFiles({
      contentFilesByPath: this.contentFilesByPath,
      fileContentModifierFunction: function (content: any) {
        const contentWithBadge = initBadge(content);
        const contentWithList = initContributorsList(contentWithBadge);
        return contentWithList;
      },
    });
    this.contentFilesByPath = newFilesByPath;
  }

  generate(optionsConfig: any) {
    if (!this.contentFilesByPath) return;

    const options = optionsConfig.get();
    const newFilesByPath = modifyFiles({
      contentFilesByPath: this.contentFilesByPath,
      fileContentModifierFunction: function (content: any) {
        return generateContentFile(options, options.contributors, content);
      },
    });
    this.contentFilesByPath = newFilesByPath;
  }

  get() {
    return this.contentFilesByPath;
  }
}

export class AllContributorBotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ResourceNotFoundError extends AllContributorBotError {
  constructor(filepath: string, fullRepoName: string) {
    super(
      `File ${filepath} was not found in the repository (${fullRepoName}).`
    );
    this.name = this.constructor.name;
  }
}

export class BranchNotFoundError extends AllContributorBotError {
  constructor(branchName: string) {
    super(`${branchName} does not exist`);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends AllContributorBotError {
  constructor(username: string) {
    super(`Could not find the user \`${username}\` on github.`);
    this.name = this.constructor.name;
  }
}

module.exports = {
  AllContributorBotError,
  BranchNotFoundError,
  ResourceNotFoundError,
  UserNotFoundError,
};

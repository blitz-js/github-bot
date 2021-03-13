import type {Repository} from "@octokit/webhooks-definitions/schema"

export type AnyRepo = Repository | ParsedRepo

export class ParsedRepo {
  owner: string
  repo: string

  constructor(owner: string, repo: string) {
    this.owner = owner
    this.repo = repo
  }

  toString() {
    return `${this.owner}/${this.repo}`
  }

  static fromFullRepo(repo: Repository) {
    return new ParsedRepo(repo.owner.login, repo.name)
  }

  static fromAnyRepo(repo: AnyRepo) {
    if (repo instanceof ParsedRepo) return repo
    else return ParsedRepo.fromFullRepo(repo)
  }
}

export const trimMultiLine = (str: string, fixedIdent?: number) => {
  let lines = str.trim().split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (fixedIdent) {
      lines[i] = line.substr(fixedIdent)
    } else {
      lines[i] = line.trim()
    }
  }

  return lines.join("\n")
}

import type {IssuesEvent, PullRequestEvent, Repository} from "@octokit/webhooks-definitions/schema"
import octokit from "./octokit"

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
  let lines = str.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (fixedIdent) {
      lines[i] = line.substr(fixedIdent)
    } else {
      lines[i] = line.trim()
    }
  }

  return lines.join("\n").trim()
}

export const payloadIsIssue = (payload: IssuesEvent | PullRequestEvent): payload is IssuesEvent =>
  "issue" in payload

export const sendMessage = ({
  repo: repo,
  number,
  message,
}: {
  repo: AnyRepo
  number: number
  message: string
}) =>
  octokit.issues.createComment({
    ...ParsedRepo.fromAnyRepo(repo),
    issue_number: number,
    body: message,
  })

import type {Repository} from "@octokit/webhooks-definitions/schema"

export type ParsedRepo = {owner: string; repo: string; toString(): string}
export type AnyRepo = Repository | ParsedRepo

const repoIsParsed = (repo: AnyRepo): repo is ParsedRepo => typeof repo.owner === "string"

export const parseRepo = (repo: AnyRepo): ParsedRepo => ({
  owner: repoIsParsed(repo) ? repo.owner : repo.owner.login,
  repo: repoIsParsed(repo) ? repo.repo : repo.name,
  toString() {
    return `${this.owner}/${this.repo}`
  },
})

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

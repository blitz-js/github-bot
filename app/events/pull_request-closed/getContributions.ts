import {CONTRIB_TO_FILETYPE} from "../../settings"
import {AnyRepo, ParsedRepo} from "../../utils/helpers"
import octokit from "../../utils/octokit"

const isTranslatedRepo = (repoName: string) => /^[a-z-]+\.blitzjs\.com$/i.test(repoName)
const isToolsRepo = (repoName: string) => /-bot$/i.test(repoName)

const contribMap = Object.entries(CONTRIB_TO_FILETYPE) as [Contribution, string[]][]

export async function getContributions({
  repo: repository,
  pr,
}: {
  repo: AnyRepo
  pr: number
}): Promise<Contribution[]> {
  const repo = ParsedRepo.fromAnyRepo(repository)

  if (repo.repo === "blitzjs.com") return ["doc"]
  if (isTranslatedRepo(repo.repo)) return ["translation"]
  if (isToolsRepo(repo.repo)) return ["tool"]

  const files = await octokit.pulls.listFiles({
    ...repo,
    pull_number: pr,
    headers: {accept: "application/vnd.github.v3.diff"},
    page: 0,
    per_page: 100,
  })

  let contributions: Contribution[] = []

  for (const file of files.data) {
    const contrib = getFileContrib(file.filename)

    if (!contributions.includes(contrib)) {
      contributions.push(contrib)
    }
  }

  return contributions
}

const getFileContrib = (filename: string): Contribution => {
  for (const [contrib, fileTypes] of contribMap) {
    for (const fileType of fileTypes) {
      if (filename.endsWith(fileType)) {
        return contrib
      }
    }
  }
  return "code"
}

type Contribution =
  | "audio"
  | "a11y"
  | "bug"
  | "blog"
  | "business"
  | "code"
  | "content"
  | "data"
  | "doc"
  | "design"
  | "example"
  | "eventOrganizing"
  | "financial"
  | "fundingFinding"
  | "ideas"
  | "infra"
  | "maintenance"
  | "mentoring"
  | "platform"
  | "plugin"
  | "projectManagement"
  | "question"
  | "research"
  | "review"
  | "security"
  | "tool"
  | "translation"
  | "test"
  | "tutorial"
  | "talk"
  | "userTesting"
  | "video"

import {CONTRIB_TO_FILETYPE} from "../../settings"
import {AnyRepo, ParsedRepo} from "../../utils/helpers"
import octokit from "../../utils/octokit"

const isTranslatedRepo = (repoName: string) => /^[a-z-]+\.blitzjs\.com$/.test(repoName)

export async function getContributions({
  repo: repository,
  pr,
}: {
  repo: AnyRepo
  pr: number
}): Promise<string[]> {
  const repo = ParsedRepo.fromAnyRepo(repository)

  if (isTranslatedRepo(repo.repo)) return ["translation"]

  const files = await octokit.pulls.listFiles({
    ...repo,
    pull_number: pr,
    headers: {accept: "application/vnd.github.v3.diff"},
    page: 0,
    per_page: 100,
  })

  const contribMap = Object.entries(CONTRIB_TO_FILETYPE)
  let contributions: string[] = []

  for (const file of files.data) {
    contribMap.forEach(([contrib, fileTypes]) => {
      fileTypes.forEach((fileType) => {
        if (file.filename.endsWith(fileType) && !contributions.includes(contrib)) {
          contributions.push(contrib)
        }
      })
    })
  }

  return contributions
}

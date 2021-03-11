export const TRIAGE_LABEL = "status/triage"
export const IN_PROGRESS_LABEL = "status/in-progress"
export const IN_REVIEW_LABEL = "status/in-review"
export const ASSIGNED_LABEL = "status/assigned"

export const LABEL_TO_COLUMN: Record<string, string> = {
  "status/icebox": "Icebox",
  "status/blocked": "Blocked",
  [TRIAGE_LABEL]: "Triage",
  "status/needs-defined": "Needs Defined",
  "status/ready-to-work-on": "Ready to Work On",
  [ASSIGNED_LABEL]: "Assigned",
  [IN_PROGRESS_LABEL]: "In Progress",
  [IN_REVIEW_LABEL]: "In Review",
  "status/done": "Done",
}

export const CONTRIB_TO_FILETYPE: Record<string, string[]> = {
  doc: [".md", ".mdx", ".txt"],
  test: [".test.js", ".test.ts"],
  code: [".js", ".ts", ".jsx", ".tsx", ".json", ".sh"],
}

export const CONTRIBUTIONS_SETTINGS = {
  repo: {owner: "blitz-js", repo: "blitz"},
  defaultBranch: "canary",
}

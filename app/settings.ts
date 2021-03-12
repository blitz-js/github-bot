import {parseRepo} from "./utils/helpers"

export const WHOAMI = "blitzjs-bot"
export const ENDPOINT = "https://github-bot.blitzjs.com/api/webhooks"

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

export const LABEL_TO_COLOR: Record<string, string> = {
  "status/icebox": "#dbf24b",
  "status/blocked": "#ba1405",
  [TRIAGE_LABEL]: "#25bff7",
  "status/needs-defined": "#006b75",
  "status/ready-to-work-on": "#25f93e",
  [ASSIGNED_LABEL]: "#baf9a7",
  [IN_PROGRESS_LABEL]: "#f1fc9f",
  [IN_REVIEW_LABEL]: "#8bef8b",
  "status/done": "#4ec641",
}

export const CONTRIB_TO_FILETYPE: Record<string, string[]> = {
  doc: [".md", ".mdx", ".txt"],
  test: [".test.js", ".test.ts"],
  code: [".js", ".ts", ".jsx", ".tsx", ".json", ".sh"],
}

export const CONTRIBUTIONS_SETTINGS = {
  repo: parseRepo({owner: "blitz-js", repo: "blitz"}),
  defaultBranch: "canary",
}

export const COMMAND_PREFIXES = ["@blitzjs-bot", "blitzjs-bot", "blitz-bot", "blitz bot"]

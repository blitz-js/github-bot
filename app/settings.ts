import {ParsedRepo} from "./utils/helpers"

export const WHOAMI = "blitzjs-bot"
export const ENDPOINT = "https://github-bot.blitzjs.com/api/webhooks"

export const TRIAGE_LABEL = "status/triage"
export const IN_PROGRESS_LABEL = "status/in-progress"
export const IN_REVIEW_LABEL = "status/in-review"
export const ASSIGNED_LABEL = "status/assigned"
export const DONE_LABEL = "status/done"

export const LABEL_TO_COLUMN: Record<string, string> = {
  "status/icebox": "Icebox",
  "status/blocked": "Blocked",
  [TRIAGE_LABEL]: "Triage",
  "status/ready-to-define-implementation": "Ready to Define Implementation",
  "status/ready-to-work-on": "Ready to Work On",
  [ASSIGNED_LABEL]: "Assigned",
  [IN_PROGRESS_LABEL]: "In Progress",
  [IN_REVIEW_LABEL]: "In Review",
  [DONE_LABEL]: "Done",
}

export const LABEL_TO_COLOR: Record<string, string> = {
  "status/icebox": "#dbf24b",
  "status/blocked": "#ba1405",
  [TRIAGE_LABEL]: "#25bff7",
  "status/ready-to-define-implementation": "#006b75",
  "status/ready-to-work-on": "#25f93e",
  [ASSIGNED_LABEL]: "#baf9a7",
  [IN_PROGRESS_LABEL]: "#f1fc9f",
  [IN_REVIEW_LABEL]: "#8bef8b",
  [DONE_LABEL]: "#4ec641",
}

export const CONTRIB_TO_FILETYPE: Record<string, string[]> = {
  doc: [".md", ".mdx", ".txt"],
  test: [".test.js", ".test.ts"],
}

export const CONTRIBUTIONS_SETTINGS = {
  repo: new ParsedRepo("blitz-js", "blitz"),
  defaultBranch: "main",
}

export const COMMAND_PREFIXES = [`@${WHOAMI}`, WHOAMI, "blitz-bot", "blitz bot"]

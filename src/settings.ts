export const TRIAGE_LABEL = "status/triage";
export const IN_PROGRESS_LABEL = "status/in-progress";
export const IN_REVIEW_LABEL = "status/in-review";

export const LABEL_TO_COLUMN: Record<string, string> = {
  "status/icebox": "Icebox",
  "status/blocked": "Blocked",
  [TRIAGE_LABEL]: "Triage",
  "status/ready-to-work-on": "Ready to Work On",
  "status/assigned": "Assigned",
  [IN_PROGRESS_LABEL]: "In Progress",
  [IN_REVIEW_LABEL]: "In Review",
  "status/done": "Done",
};

export const FILETYPE_TO_CONTRIB_TYPE: Array<Record<string, Array<string>>> = [
  { docs: [".md", ".txt"] },
  { test: [".test.js", ".test.ts"] },
  { code: [".js", ".ts", ".jsx", ".tsx", ".json", ".sh"] },
];

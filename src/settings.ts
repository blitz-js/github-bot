export const TRIAGE_LABEL = "status/triage";
export const IN_PROGRESS_LABEL = "status/in-progress";
export const IN_REVIEW_LABEL = "status/in-review";

export const LABEL_TO_COLUMN: Record<string, string> = {
  [TRIAGE_LABEL]: "Triage",
  "status/ready-to-work-on": "Ready to Work On",
  "status/assigned": "Assigned",
  [IN_PROGRESS_LABEL]: "In Progress",
  [IN_REVIEW_LABEL]: "In Review",
  "status/done": "Done",
};

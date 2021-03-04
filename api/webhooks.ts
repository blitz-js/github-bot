import app from "../app";
import { createNodeMiddleware, createProbot } from "probot";
import path from "path";

const probot = createProbot({
  defaults: {
    webhookPath: "/api/webhooks",
  },
});

export default createNodeMiddleware(app, { probot });

// Ensure these files are not eliminated by trace-based tree-shaking (like Vercel)
// https://github.com/blitz-js/blitz/issues/794
import "lodash";
import "all-contributors-cli";

path.resolve("app/events/pull_request-closed/index.ts");
path.resolve("app/events/pull_request-closed/addContributor.ts");
path.resolve("app/events/pull_request-closed/getContributions.ts");
path.resolve("app/events/issue_comment-created.ts");
path.resolve("app/events/issues-assigned.ts");
path.resolve("app/events/issues-labeled.ts");
path.resolve("app/events/issues-opened.ts");
path.resolve("app/events/project_card-moved.ts");
path.resolve("app/events/pull_request-labeled.ts");
path.resolve("app/events/pull_request-opened.ts");
path.resolve("app/utils/errors.ts");
path.resolve("app/utils/syncLabelToBoard.ts");
path.resolve("app/utils/types.ts");
path.resolve("app/index.ts");
path.resolve("app/settings.ts");
// End anti-tree-shaking

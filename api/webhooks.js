import app from "../dist";
import { createNodeMiddleware, createProbot } from "probot";

const probot = createProbot({
  defaults: {
    webhookPath: "/api/webhooks",
  },
});

export default createNodeMiddleware(app, { probot });

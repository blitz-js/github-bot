import app from "../app";
import { createNodeMiddleware, createProbot } from "probot";

const probot = createProbot({
  defaults: {
    webhookPath: "/api/webhook",
  },
});

export default createNodeMiddleware(app, { probot });

import app from "@/app";
import { createNodeMiddleware, createProbot } from "probot";

const probot = createProbot({
  defaults: {
    webhookPath: "/api/webhooks",
  },
});

export default createNodeMiddleware(app, { probot });

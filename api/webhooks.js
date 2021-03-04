const app = require("../dist");
const { createNodeMiddleware, createProbot } = require("probot");

const probot = createProbot({
  defaults: {
    webhookPath: "/api/webhooks",
  },
});

module.exports = createNodeMiddleware(app, { probot });

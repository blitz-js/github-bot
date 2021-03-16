import {Webhooks} from "@octokit/webhooks"
import {issue_commentCreated} from "./events/issue_comment-created"
import {issuesAssigned} from "./events/issues-assigned"
import {issuesClosed} from "./events/issues-closed"
import {issuesLabeled} from "./events/issues-labeled"
import {issuesOpened} from "./events/issues-opened"
import {project_cardMoved} from "./events/project_card-moved"
import {pull_requestClosed} from "./events/pull_request-closed"
import {pull_requestLabeled} from "./events/pull_request-labeled"
import {pull_requestOpened} from "./events/pull_request-opened"
import {repositoryCreated} from "./events/repository-created"
import log from "./utils/log"

if (!process.env.WEBHOOK_SECRET) {
  throw new Error("Webhook Secret not found")
}

const app = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
  path: "/api/webhooks",
  log,
})

app.onAny((event) => {
  // @ts-expect-error
  log.info(`Recived ${event.name}.${event.payload?.action || "any"}`)
})

// Repository events
app.on("issue_comment.created", issue_commentCreated)
app.on("issues.assigned", issuesAssigned)
app.on(["issues.closed", "pull_request.closed"], issuesClosed)
app.on(["issues.labeled", "pull_request.labeled"], issuesLabeled)
app.on("issues.opened", issuesOpened)
app.on(["project_card.moved", "project_card.created"], project_cardMoved)
app.on("pull_request.closed", pull_requestClosed)
app.on("pull_request.labeled", pull_requestLabeled)
app.on(["pull_request.opened", "pull_request.ready_for_review"], pull_requestOpened)

// Organization events
app.on("repository.created", repositoryCreated)

export default app

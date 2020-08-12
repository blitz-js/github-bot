import { Context } from "probot";
import { WebhookPayloadIssues } from "@octokit/webhooks";
import { ASSIGNED } from './settings';

export async function issuesAssigned({
	payload,
	github
}: Context<WebhookPayloadIssues>) {
	const totalAssignees = payload.issue.assignees.length;
  if(totalAssignees === 1) {
    await github.issues.addLabels({
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: payload.issue.number,
			labels: [ ASSIGNED ],
		})
	}
}

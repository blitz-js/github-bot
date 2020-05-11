import { Context } from "probot";
import { addContributions } from "./add_contribution";
// Move pull request around based on draft status
export async function pull_requestClosed(context: Context) {
  // check if PR is merged
  if (context.payload.pull_request.merged) {
    await addContributions(context);
  }
}

import { Context } from "probot";
import { addContributions } from "./add_contribution";

export async function pull_requestClosed(context: Context) {
  await addContributions(context);
}

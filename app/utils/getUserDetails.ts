import { UserNotFoundError } from "@utils/errors";
import type { OctokitClient } from "@utils/types";

export async function getUserDetails({
  octokit,
  username,
}: {
  octokit: OctokitClient;
  username: string;
}) {
  let result;
  try {
    result = await octokit.users.getByUsername({ username });
  } catch (error) {
    if (error.status === 404) {
      throw new UserNotFoundError(username);
    } else {
      throw error;
    }
  }

  const { avatar_url, blog, html_url, name } = result.data;

  return {
    name: name || username,
    avatar_url,
    profile: blog || html_url,
  };
}

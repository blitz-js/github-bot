import { UserNotFoundError } from "./errors";

export async function getUserDetails({ github, username }: Record<any, any>) {
  let result;
  try {
    result = await github.users.getByUsername({ username });
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

module.exports = getUserDetails;

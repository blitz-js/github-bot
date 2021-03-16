import {Octokit} from "@octokit/rest"

if (!process.env.PERSONAL_ACCESS_TOKEN) {
  throw new Error("Personal Access Token not found")
}

const octokit = new Octokit({
  auth: `token ${process.env.PERSONAL_ACCESS_TOKEN}`,
})

export type OctokitClient = typeof octokit

export default octokit

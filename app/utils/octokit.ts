import {Octokit} from "@octokit/rest"

const octokit = new Octokit({
  auth: `token ${process.env.PERSONAL_ACCESS_TOKEN}`,
})

export type OctokitClient = typeof octokit

export default octokit

# blitz-bot

Bot to manage Blitz GitHub project board, all-contributors list in README, and other automations!

> A GitHub App built with [Probot](https://github.com/probot/probot) that automate project board

## Setup

```sh
# Install dependencies
yarn

# Run locally
./scripts/run-dev.sh [smee-url]
```

### Setup of the GitHub App

You need to [create a new GitHub app](https://docs.github.com/en/developers/apps/creating-a-github-app) and assing its values using [`app.yml`](app.yml).

Also, you need to set the enviroment variables as shown in [`.env.example`](.env.example).

### Developing locally

When developing locally, you need to get a new [Smee URL](https://smee.io/new) and set the **Webhook URL** of your GitHub app (inside the github config) to that Smee URL. Finally, you run this to run your app (make sure to have the Vercel CLI installed):

```bash
./scripts/run-dev.sh [your-smee-url]
```

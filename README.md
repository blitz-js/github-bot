# Blitz.js GitHub Bot

Bot to manage Blitz GitHub project board, all-contributors list in README, and other automations!

It runs on [Vercel](https://vercel.com).

## Setup

```sh
# Install dependencies
yarn

# Run locally
./scripts/run-dev.sh [smee-url]
```

### Environment Variables

- `WEBHOOK_SECRET`: a random string of characters. Could be anything
- `PERSONAL_ACCESS_TOKEN`: a Personal Access Token of the account that will _do_ all the interaction. [More info](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
- `LOG_LEVEL` (optional): log4js level. More info [here (look for `level`)](https://log4js-node.github.io/log4js-node/api.html)

### Developing locally

When developing locally, you need to get a new [Smee URL](https://smee.io/new) and set the **Webhook URL** to that Smee URL. Finally, you run this to run your app (make sure to have the Vercel CLI installed):

```bash
./scripts/run-dev.sh [your-smee-url]
```

## Adding a new event

If you are adding a _Organization_ event, rembember to add it to the organization webhook.

If you are adding a _Repository_ event, rembember to add it to the each repository **and** in [this events array](app/events/repository-created.ts).

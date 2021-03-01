// You can import your modules
// import index from '../src/index'

import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../app";
import { Probot, ProbotOctokit } from "probot";
import { IN_PROGRESS_LABEL, IN_REVIEW_LABEL } from "../app/settings";
import fs from "fs";
import path from "path";

const nockGH = () => nock("https://api.github.com");

const REPO = {
  name: "gh-project-bot",
  owner: {
    login: "dajinchu",
  },
};
const COL_ID_ASSIGNED = 1;
const COL_ID_TRIAGE = 29;
const PROJ_ID = 42;
const ISSUE_NUM = 9;
const ISSUE_ID = 123456;

describe("My Probot app", () => {
  let probot: any;
  let mockCert: string;

  beforeAll((done: Function) => {
    fs.readFile(
      path.join(__dirname, "fixtures/mock-cert.pem"),
      "utf8",
      (err: Error | null, cert: string) => {
        if (err) return done(err);
        mockCert = cert;
        done();
      }
    );
  });

  beforeEach(() => {
    nock.disableNetConnect();
    // Test that we correctly return a test token
    // Load our app into probot
    probot = new Probot({
      appId: 123,
      privateKey: mockCert,
      githubToken: "test",
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probot.load(myProbotApp);

    // check if token is working
    nockGH()
      .post("/app/installations/2/access_tokens")
      .reply(200, { token: "test" });

    // mock get project id
    nockGH()
      .get("/repos/dajinchu/gh-project-bot/projects")
      .reply(200, [{ id: PROJ_ID }]);

    // mock get columns
    nockGH()
      .get(`/projects/${PROJ_ID}/columns`)
      .reply(200, [
        { id: COL_ID_TRIAGE, name: "Triage" },
        { id: COL_ID_ASSIGNED, name: "Assigned" },
        { id: 3, name: "In Review" },
      ]);
  });

  describe("issue.labeled / pull_request.labeled", () => {
    function mockIssueLabeled(newLabel: string, allLabels: string[]) {
      return {
        name: "issues",
        payload: {
          action: "labeled",
          label: {
            name: newLabel,
          },
          issue: {
            id: ISSUE_ID,
            number: ISSUE_NUM,
            user: {
              login: "dajinchu",
            },
            labels: allLabels.map((name) => ({ name })),
          },
          repository: REPO,
        },
      };
    }
    it("add issue to project board when tagged", async (done) => {
      // Mock that the board is not yet on the project board
      nockGH()
        .post("/graphql")
        .reply(200, {
          data: {
            repository: { issueOrPullRequest: { projectCards: { nodes: [] } } },
          },
        });
      // Test that card created in assigned column
      nockGH()
        .post(`/projects/columns/${COL_ID_ASSIGNED}/cards`, (body: any) => {
          done(
            expect(body).toMatchObject({
              content_id: ISSUE_ID,
              content_type: "Issue",
            })
          );
          return true;
        })
        .reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "priority/high",
        ])
      );
    });

    it("moves issue to diff column if already on project board", async (done) => {
      nockGH()
        .post("/graphql")
        .reply(200, {
          data: {
            repository: {
              issueOrPullRequest: {
                projectCards: {
                  nodes: [
                    {
                      column: { databaseId: COL_ID_TRIAGE },
                      databaseId: 424242,
                    },
                  ],
                },
              },
            },
          },
        });
      nockGH()
        .post("/projects/columns/cards/424242/moves", (body: any) => {
          expect(body).toMatchObject({
            column_id: COL_ID_ASSIGNED,
          });
          done();
          return true;
        })
        .reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "priority/high",
        ])
      );
    });

    it("does not move issue if they are already in right column", async () => {
      nockGH()
        .post("/graphql")
        .reply(200, {
          data: {
            repository: {
              issueOrPullRequest: {
                projectCards: {
                  nodes: [
                    {
                      column: { databaseId: COL_ID_ASSIGNED },
                      databaseId: 424242,
                    },
                  ],
                },
              },
            },
          },
        });
      const onMove = jest.fn().mockReturnValue(true);
      nockGH().post("/projects/columns/cards/424242/moves", onMove).reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "priority/high",
        ])
      );
      expect(onMove).not.toHaveBeenCalled();
      // throw new Error('it tried to move')
    });

    it("removes old status tags", async () => {
      nockGH()
        .post("/graphql")
        .reply(200, {
          data: {
            repository: { issueOrPullRequest: { projectCards: { nodes: [] } } },
          },
        });
      nockGH()
        .delete(
          `/repos/dajinchu/gh-project-bot/issues/${ISSUE_NUM}/labels/status/triage`
        )
        .reply(200);
      nockGH().post(`/projects/columns/${COL_ID_ASSIGNED}/cards`).reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "status/triage",
        ])
      );
    });
    it("gracefully handles not finding any status tags", async () => {
      await expect(
        probot.receive(mockIssueLabeled("priority/high", ["priority/high"]))
      ).resolves.toBeDefined();
    });
  });

  describe("issues.opened", () => {
    beforeEach(() => {
      // Mock that the card is not yet on the project board
      nockGH()
        .post("/graphql")
        .reply(200, {
          data: {
            repository: { issueOrPullRequest: { projectCards: { nodes: [] } } },
          },
        });
    });
    it("if already status labeled, sync to board", async (done) => {
      // Test that card created in assigned column
      nockGH()
        .post(`/projects/columns/${COL_ID_ASSIGNED}/cards`, (body: any) => {
          done(
            expect(body).toMatchObject({
              content_id: ISSUE_ID,
              content_type: "Issue",
            })
          );
          return true;
        })
        .reply(201);

      probot.receive({
        name: "issues",
        payload: {
          action: "opened",
          issue: {
            number: 33,
            id: ISSUE_ID,
            labels: [{ name: "status/assigned" }],
          },
          repository: REPO,
        },
      });
    });

    it("adds to triage column if no other labels", async (done) => {
      // Test that card created in assigned column
      nockGH()
        .post(`/projects/columns/${COL_ID_TRIAGE}/cards`, (body: any) => {
          done(
            expect(body).toMatchObject({
              content_id: ISSUE_ID,
              content_type: "Issue",
            })
          );
          return true;
        })
        .reply(201);
      probot.receive({
        name: "issues",
        payload: {
          action: "opened",
          issue: { number: 33, id: ISSUE_ID, labels: [{ name: "kind/bug" }] },
          repository: REPO,
        },
      });
    });
  });

  describe("project_card.moved", () => {
    it("moving a card with no issue inside does nothing", async () => {
      await expect(
        probot.receive({
          name: "project_card",
          payload: {
            action: "moved",
            project_card: { column_id: COL_ID_TRIAGE },
            repository: REPO,
          },
        })
      ).resolves.toBeDefined();
    });
    it("moving a card with an issue changes the label", async (done) => {
      nockGH()
        .get(`/projects/columns/${COL_ID_ASSIGNED}`)
        .reply(200, { name: "Assigned" });

      nockGH()
        .post(`/repos/dajinchu/gh-project-bot/issues/2/labels`, (body: any) => {
          done(expect(body).toMatchObject(["status/assigned"]));
          return true;
        })
        .reply(201);

      await probot.receive({
        name: "project_card",
        payload: {
          action: "moved",
          project_card: {
            column_id: COL_ID_ASSIGNED,
            content_url:
              "https://api.github.com/repos/dajinchu/gh-project-bot/issues/2",
          },
          repository: REPO,
        },
      });
    });
  });

  describe("pull_request.opened + ready_for_review", () => {
    it("adds the in progress label when PR is marked ready for review", async (done) => {
      nockGH()
        .post(
          `/repos/dajinchu/gh-project-bot/issues/33/labels`,
          (body: any) => {
            expect(body).toMatchObject([IN_REVIEW_LABEL]);
            done();
            return true;
          }
        )
        .reply(201);
      probot.receive({
        name: "pull_request",
        payload: {
          action: "ready_for_review",
          pull_request: { draft: false, number: 33 },
          repository: REPO,
        },
      });
    });
    it("adds the in progress label when PR ready for review is opened", async (done) => {
      nockGH()
        .post(
          `/repos/dajinchu/gh-project-bot/issues/33/labels`,
          (body: any) => {
            expect(body).toMatchObject([IN_REVIEW_LABEL]);
            done();
            return true;
          }
        )
        .reply(201);
      probot.receive({
        name: "pull_request",
        payload: {
          action: "opened",
          pull_request: { draft: false, number: 33 },
          repository: REPO,
        },
      });
    });
    it("adds the in progress label when draft PR is opened", async (done) => {
      nockGH()
        .post(
          `/repos/dajinchu/gh-project-bot/issues/33/labels`,
          (body: any) => {
            expect(body).toMatchObject([IN_PROGRESS_LABEL]);
            done();
            return true;
          }
        )
        .reply(201);
      probot.receive({
        name: "pull_request",
        payload: {
          action: "opened",
          pull_request: { draft: true, number: 33 },
          repository: REPO,
        },
      });
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

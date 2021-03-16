import app from "../../app"
import {ASSIGNED_LABEL, TRIAGE_LABEL} from "../../app/settings"
import {API_REPO, COL_ID_ASSIGNED, COL_ID_TRIAGE, nockGH, REPO, setupNock} from "../utils"

const ISSUE_NUM = 9
const ISSUE_ID = 123456

describe("issues.labeled / pull_request.labeled", () => {
  setupNock()

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
          labels: allLabels.map((name) => ({name})),
        },
        repository: API_REPO,
      },
    }
  }
  it("add issue to project board when tagged", async (done) => {
    // Mock that the board is not yet on the project board
    nockGH()
      .post("/graphql")
      .reply(200, {
        data: {
          repository: {issueOrPullRequest: {projectCards: {nodes: []}}},
        },
      })
    // Test that card created in assigned column
    nockGH()
      .post(`/projects/columns/${COL_ID_ASSIGNED}/cards`, (body: any) => {
        done(
          expect(body).toMatchObject({
            content_id: ISSUE_ID,
            content_type: "Issue",
          }),
        )
        return true
      })
      .reply(201)

    // Receive a webhook event
    await app.receive(
      // @ts-expect-error
      mockIssueLabeled(ASSIGNED_LABEL, [ASSIGNED_LABEL, "priority/high"]),
    )
  })

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
                    column: {databaseId: COL_ID_TRIAGE},
                    databaseId: 424242,
                  },
                ],
              },
            },
          },
        },
      })
    nockGH()
      .post("/projects/columns/cards/424242/moves", (body: any) => {
        expect(body).toMatchObject({
          column_id: COL_ID_ASSIGNED,
        })
        done()
        return true
      })
      .reply(201)

    // Receive a webhook event
    await app.receive(
      // @ts-expect-error
      mockIssueLabeled(ASSIGNED_LABEL, [ASSIGNED_LABEL, "priority/high"]),
    )
  })

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
                    column: {databaseId: COL_ID_ASSIGNED},
                    databaseId: 424242,
                  },
                ],
              },
            },
          },
        },
      })
    const onMove = jest.fn().mockReturnValue(true)
    nockGH().post("/projects/columns/cards/424242/moves", onMove).reply(201)

    // Receive a webhook event
    await app.receive(
      // @ts-expect-error
      mockIssueLabeled(ASSIGNED_LABEL, [ASSIGNED_LABEL, "priority/high"]),
    )
    expect(onMove).not.toHaveBeenCalled()
    // throw new Error('it tried to move')
  })

  it("removes old status tags", async () => {
    nockGH()
      .post("/graphql")
      .reply(200, {
        data: {
          repository: {issueOrPullRequest: {projectCards: {nodes: []}}},
        },
      })
    nockGH()
      .delete(`/repos/${REPO}/issues/${ISSUE_NUM}/labels/${encodeURIComponent(TRIAGE_LABEL)}`)
      .reply(200)
    nockGH().post(`/projects/columns/${COL_ID_ASSIGNED}/cards`).reply(201)

    // Receive a webhook event
    await app.receive(
      // @ts-expect-error
      mockIssueLabeled(ASSIGNED_LABEL, [ASSIGNED_LABEL, TRIAGE_LABEL]),
    )
  })
  it("gracefully handles not finding any status tags", async () => {
    await expect(
      // @ts-expect-error
      app.receive(mockIssueLabeled("priority/high", ["priority/high"])),
    ).resolves.not.toThrowError()
  })
})

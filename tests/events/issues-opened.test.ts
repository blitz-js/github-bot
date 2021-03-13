import app from "../../app"
import {ASSIGNED_LABEL} from "../../app/settings"
import {API_REPO, COL_ID_ASSIGNED, COL_ID_TRIAGE, nockGH, setupNock} from "../utils"

const ISSUE_ID = 123456

describe("issues.opened", () => {
  setupNock()

  beforeEach(() => {
    // Mock that the card is not yet on the project board
    nockGH()
      .post("/graphql")
      .reply(200, {
        data: {
          repository: {issueOrPullRequest: {projectCards: {nodes: []}}},
        },
      })
  })
  it("if already status labeled, sync to board", async (done) => {
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

    await app.receive({
      name: "issues",
      payload: {
        // @ts-expect-error
        action: "opened",
        issue: {
          number: 33,
          id: ISSUE_ID,
          // @ts-expect-error
          labels: [{name: ASSIGNED_LABEL}],
        },
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })

  it("adds to triage column if no other labels", async (done) => {
    // Test that card created in assigned column
    nockGH()
      .post(`/projects/columns/${COL_ID_TRIAGE}/cards`, (body: any) => {
        done(
          expect(body).toMatchObject({
            content_id: ISSUE_ID,
            content_type: "Issue",
          }),
        )
        return true
      })
      .reply(201)

    await app.receive({
      name: "issues",
      payload: {
        // @ts-expect-error
        action: "opened",
        // @ts-expect-error
        issue: {number: 33, id: ISSUE_ID, labels: [{name: "kind/bug"}]},
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })
})

import app from "../../app"
import {ASSIGNED_LABEL} from "../../app/settings"
import {API_REPO, COL_ID_ASSIGNED, COL_ID_TRIAGE, nockGH, REPO, setupNock} from "../utils"

describe("project_card.moved", () => {
  setupNock()

  it("moving a card with no issue inside does nothing", async () => {
    await expect(
      app.receive({
        name: "project_card",
        payload: {
          // @ts-expect-error
          action: "moved",
          // @ts-expect-error
          project_card: {column_id: COL_ID_TRIAGE},
          // @ts-expect-error
          repository: API_REPO,
        },
      }),
    ).resolves.not.toThrowError()
  })
  it("moving a card with an issue changes the label", async (done) => {
    nockGH().get(`/projects/columns/${COL_ID_ASSIGNED}`).reply(200, {name: "Assigned"})

    nockGH()
      .post(`/repos/${REPO}/issues/2/labels`, (body: any) => {
        done(expect(body).toMatchObject({labels: [ASSIGNED_LABEL]}))
        return true
      })
      .reply(201)

    await app.receive({
      name: "project_card",
      payload: {
        // @ts-expect-error
        action: "moved",
        // @ts-expect-error
        project_card: {
          column_id: COL_ID_ASSIGNED,
          content_url: `https://api.github.com/repos/${REPO}/issues/2`,
        },
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })
})

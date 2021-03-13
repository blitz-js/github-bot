import app from "../../app"
import {IN_PROGRESS_LABEL, IN_REVIEW_LABEL} from "../../app/settings"
import {API_REPO, nockGH, REPO, setupNock} from "../utils"

describe("pull_request.opened / pull_request.ready_for_review", () => {
  setupNock()

  it("adds the in progress label when PR is marked ready for review", async (done) => {
    nockGH()
      .post(`/repos/${REPO}/issues/33/labels`, (body: any) => {
        expect(body).toMatchObject({labels: [IN_REVIEW_LABEL]})
        done()
        return true
      })
      .reply(201)

    await app.receive({
      name: "pull_request",
      payload: {
        // @ts-expect-error
        action: "ready_for_review",
        pull_request: {draft: false, number: 33},
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })
  it("adds the in progress label when PR ready for review is opened", async (done) => {
    nockGH()
      .post(`/repos/${REPO}/issues/33/labels`, (body: any) => {
        expect(body).toMatchObject({labels: [IN_REVIEW_LABEL]})
        done()
        return true
      })
      .reply(201)

    await app.receive({
      name: "pull_request",
      payload: {
        // @ts-expect-error
        action: "opened",
        pull_request: {draft: false, number: 33},
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })
  it("adds the in progress label when draft PR is opened", async (done) => {
    nockGH()
      .post(`/repos/${REPO}/issues/33/labels`, (body: any) => {
        expect(body).toMatchObject({labels: [IN_PROGRESS_LABEL]})
        done()
        return true
      })
      .reply(201)

    await app.receive({
      name: "pull_request",
      payload: {
        // @ts-expect-error
        action: "opened",
        pull_request: {draft: true, number: 33},
        // @ts-expect-error
        repository: API_REPO,
      },
    })
  })
})

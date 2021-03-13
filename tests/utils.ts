import nock from "nock"
import {ParsedRepo} from "../app/utils/helpers"

export const nockGH = () => nock("https://api.github.com")

export const REPO = new ParsedRepo("blitz-js", "blitz")
export const API_REPO = {
  owner: {login: REPO.owner},
  name: REPO.repo,
}

export const COL_ID_ASSIGNED = 1
export const COL_ID_TRIAGE = 29
export const PROJ_ID = 42

export const setupNock = () => {
  beforeEach(() => {
    nock.disableNetConnect()

    // check if token is working
    nockGH()
      .post("/app/installations/2/access_tokens")
      .reply(200, {token: process.env.PERSONAL_ACCESS_TOKEN})

    // mock get project id
    nockGH()
      .get(`/repos/${REPO}/projects`)
      .reply(200, [{id: PROJ_ID}])

    // mock get columns
    nockGH()
      .get(`/projects/${PROJ_ID}/columns`)
      .reply(200, [
        {id: COL_ID_TRIAGE, name: "Triage"},
        {id: COL_ID_ASSIGNED, name: "Assigned"},
        {id: 3, name: "In Review"},
      ])
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
}

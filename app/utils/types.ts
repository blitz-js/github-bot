import type { Context } from "probot";
import type { WebhookEvents, WebhookEvent } from "@octokit/webhooks";
import type { HandlerFunction } from "@octokit/webhooks/dist-types/types";

export type Handler<E extends WebhookEvents> = HandlerFunction<
  E,
  Omit<Context, keyof WebhookEvent>
>;

export type OctokitClient = Context<any>["octokit"];
export type LogClient = Context<any>["log"];

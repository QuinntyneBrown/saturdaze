import { Page } from "@playwright/test";

/**
 * Agent-drafted weekends (L2-211). The e2e API runs with agent planning off,
 * so these stubs patch the real weekend: an applied draft marks Saturday's
 * first activity as the agents' pick with its reason; a fallen-back draft
 * carries the reason and the family-facing notice the API would send.
 */
export const PICK_REASON = "Sunny Saturday, a calm garden walk the kids can run in";

export const NOTICES = {
  Disabled: "Agent planning is off right now, so the planner made this weekend.",
  Error: "The agents couldn't finish, so the planner made this weekend.",
} as const;

type Block = { day: string; kind: string; refId: string | null; title: string; reason: string; pickedByAgents?: boolean };
type Weekend = { id: string; blocks: Block[]; planSource?: string; agentDraft?: unknown };

export interface AgentDraftStub {
  /** The title of the block the agents picked (applied drafts only). */
  pick: string | null;
}

export async function stubAgentDraft(
  page: Page,
  opts: { outcome: "Applied" | "Error" },
): Promise<AgentDraftStub> {
  const stub: AgentDraftStub = { pick: null };
  await page.route(/\/api\/weekends\/current(\?|$)/, async (route) => {
    const response = await route.fetch();
    const weekend = (await response.json()) as Weekend;
    const applied = opts.outcome === "Applied";
    if (applied) {
      const pick = weekend.blocks.find((b) => b.day === "Saturday" && b.kind === "Activity");
      if (pick) {
        pick.pickedByAgents = true;
        pick.reason = PICK_REASON;
        stub.pick = pick.title;
      }
    }
    weekend.planSource = applied ? "Agents" : "Planner";
    weekend.agentDraft = {
      runId: "00000000-0000-0000-0000-0000000000a1",
      status: applied ? "Applied" : "FellBack",
      trigger: "Scheduled",
      requestedUtc: "2026-10-30T12:00:00Z",
      finishedUtc: "2026-10-30T12:01:30Z",
      fallbackReason: applied ? null : "Error",
      notice: applied ? null : NOTICES.Error,
    };
    await route.fulfill({ response, json: weekend });
  });
  return stub;
}

/** Answers the draft request with the API's refusal (409 in progress, 429 over the weekend's limit). */
export async function refuseDraftRequests(page: Page, status: 409 | 429, detail: string): Promise<void> {
  await page.route(/\/api\/weekends\/[^/]+\/drafts$/, (route) =>
    route.fulfill({
      status,
      contentType: "application/problem+json",
      json: { status, title: status === 409 ? "Conflict" : "Too many requests", detail },
    }),
  );
}

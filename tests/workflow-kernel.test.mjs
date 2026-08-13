import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { decideTransition } from "../tools/workflow/kernel.mjs";

const legalTransitions = Object.freeze({ draft: ["ready"], ready: ["draft", "done"], done: [] });

describe("workflow kernel", () => {
  test("accepts a legal transition and increments version", () => {
    const decision = decideTransition({
      currentState: "draft",
      currentVersion: 2,
      legalTransitions,
      command: { from: "draft", to: "ready", expectedVersion: 2 }
    });
    assert.deepEqual(decision, { accepted: true, nextState: "ready", nextVersion: 3 });
  });

  test("rejects stale versions without producing a next state", () => {
    const decision = decideTransition({
      currentState: "draft",
      currentVersion: 3,
      legalTransitions,
      command: { from: "draft", to: "ready", expectedVersion: 2 }
    });
    assert.equal(decision.accepted, false);
    assert.match(decision.failures.join("\n"), /expected 2, current 3/);
  });

  test("rejects illegal and mismatched source states", () => {
    const decision = decideTransition({
      currentState: "done",
      currentVersion: 1,
      legalTransitions,
      command: { from: "ready", to: "draft" }
    });
    assert.equal(decision.accepted, false);
    assert.match(decision.failures.join("\n"), /does not match current state/);
    assert.match(decision.failures.join("\n"), /Illegal transition/);
  });
});
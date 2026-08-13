import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fixtureRoot;

function isolatedEnvironment() {
  return {
    ...process.env,
    HOME: fixtureRoot,
    GIT_CONFIG_NOSYSTEM: "1"
  };
}

function runProject(...args) {
  return spawnSync(process.execPath, ["tools/project.mjs", ...args], {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: isolatedEnvironment()
  });
}

function runGit(...args) {
  return spawnSync("git", args, {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: isolatedEnvironment()
  });
}

function writeSpec(state, filename, content) {
  const target = path.join(fixtureRoot, "specs", state, filename);
  writeFileSync(target, content);
  return target;
}

function approvedDraft(overrides = {}) {
  return `# SDD Spec: fixture

- **Delivery Status**: ${overrides.deliveryStatus || "draft"}
- **RIPER Phase**: ${overrides.riperPhase || "Execute"}
- **Approval Status**: ${overrides.approvalStatus || "Plan Approved"}
- **Owner**: ${overrides.owner || "Framework Maintainer"}

## 1. Requirements (Context)

- **Goal**: Prove controlled transitions.
- **In-Scope**: Local fixture.
- **Out-of-Scope**: External systems.

### Acceptance Criteria

- The transition succeeds without overwriting data.

## 2. Research Findings

- The fixture is isolated.

## 4. Plan (Contract)

### 4.1 File Changes

- \`fixture.md\`: update delivery state.

### 4.2 Signatures

- \`SpecState\`: draft, ready, or done.

### 4.3 Implementation Checklist

- [x] Define the transition.

## 5. Execute Log

- [x] Fixture execution complete.

## 8. Change Log & Handoff

- **Current State**: Ready for controlled transition.
`;
}

function reviewedReady() {
  return `# SDD Spec: reviewed fixture

- **Delivery Status**: ready
- **RIPER Phase**: Review
- **Approval Status**: Plan Approved
- **Owner**: Framework Maintainer

## 1. Requirements (Context)

- **Goal**: Prove completion gates.

### Acceptance Criteria

- Review passes.

## 4. Plan (Contract)

### 4.1 File Changes

- \`fixture.md\`: complete delivery.

### 4.2 Signatures

- \`SpecState\`: done.

### 4.3 Implementation Checklist

- [x] Complete implementation.

## 5. Execute Log

- [x] Implementation completed.

## 6. Validation & Review Verdict

### Verification Evidence

- Commands: \`node --test\` passed.
- Screenshots: not applicable.
- Logs: transition fixture passed.
- Reviewer Notes: all three axes passed.

- **Overall Verdict**: PASS
- **Blocking Issues**: None.
- **Regression Risk**: Low.
- **Follow-ups**: None.

## 8. Change Log & Handoff

- **Current State**: Review complete.
- **Next Action**: Move to done.
- **Recovery / Rollback Notes**: Restore the reviewed file if needed.
`;
}

beforeEach(() => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), "project-cli-"));
  mkdirSync(path.join(fixtureRoot, "tools"), { recursive: true });
  for (const state of ["draft", "ready", "done"]) {
    mkdirSync(path.join(fixtureRoot, "specs", state), { recursive: true });
  }
  mkdirSync(path.join(fixtureRoot, "specs", "templates"), { recursive: true });
  cpSync(path.join(repositoryRoot, "tools"), path.join(fixtureRoot, "tools"), { recursive: true });
  cpSync(
    path.join(repositoryRoot, "specs/templates/change-spec.md"),
    path.join(fixtureRoot, "specs/templates/change-spec.md")
  );
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("capability registry", () => {
  test("emits stable JSON with explicit lifecycle statuses", () => {
    const result = runProject("capability", "list", "--json");
    assert.equal(result.status, 0, result.stderr);

    const output = JSON.parse(result.stdout);
    assert.ok(output.capabilities.length > 0);
    assert.ok(output.capabilities.every(({ status }) => ["available", "hook", "planned"].includes(status)));
    assert.deepEqual(
      output.capabilities.find(({ id }) => id === "ops.logs"),
      {
        id: "ops.logs",
        command: "project ops logs",
        status: "available",
        summary: "Build a redacted read-only observability query plan.",
        boundary: "query-plan-only"
      }
    );
    assert.equal(output.capabilities.find(({ id }) => id === "spec.transition").status, "available");
  });

  test("groups human output by status", () => {
    const result = runProject("capability", "list");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /available:\n/);
    assert.match(result.stdout, /hook:\n/);
    assert.match(result.stdout, /planned:\n/);
  });
});

describe("Spec creation", () => {
  test("injects Git user.name without machine-specific metadata", () => {
    assert.equal(runGit("init").status, 0);
    assert.equal(runGit("config", "user.name", "Fixture Owner").status, 0);

    const result = runProject("spec", "new", "Portable Owner");

    assert.equal(result.status, 0, result.stderr);
    const created = path.join(fixtureRoot, "specs", "draft", `${new Date().toISOString().slice(0, 10)}-portable-owner.md`);
    const content = readFileSync(created, "utf8");
    assert.match(content, /- \*\*Owner\*\*: Fixture Owner/);
    assert.match(content, /- \*\*Workflow Version\*\*: 0/);
    assert.doesNotMatch(content, /Active Project|Active Workdir|Change Scope|\{\{owner\}\}/);
  });

  test("rejects creation when Git user.name is unavailable", () => {
    assert.equal(runGit("init").status, 0);

    const result = runProject("spec", "new", "Missing Owner");

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Git user\.name is not configured/);
    assert.equal(existsSync(path.join(fixtureRoot, "specs", "draft", `${new Date().toISOString().slice(0, 10)}-missing-owner.md`)), false);
  });
});

describe("Spec state machine", () => {
  test("moves an approved draft to ready and records history", () => {
    const filename = "approved.md";
    const source = writeSpec("draft", filename, approvedDraft());
    const result = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Plan approved"
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(source), false);
    const target = path.join(fixtureRoot, "specs", "ready", filename);
    const content = readFileSync(target, "utf8");
    assert.match(content, /- \*\*Delivery Status\*\*: ready/);
    assert.match(content, /- \*\*Workflow Version\*\*: 1/);
    assert.match(content, /## 10\. Transition History/);
    assert.match(content, /\| draft \| ready \| Test Reviewer \| Plan approved \|/);
    assert.equal(existsSync(path.join(fixtureRoot, ".workflow")), false);
  });

  test("moves a reviewed ready Spec to done", () => {
    const filename = "reviewed.md";
    writeSpec("ready", filename, reviewedReady());
    const result = runProject(
      "spec",
      "transition",
      "reviewed",
      "done",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Review passed"
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(path.join(fixtureRoot, "specs", "ready", filename)), false);
    assert.equal(existsSync(path.join(fixtureRoot, "specs", "done", filename)), true);
  });

  test("rejects missing actor without modifying the Spec", () => {
    const filename = "missing-actor.md";
    const source = writeSpec("draft", filename, approvedDraft());
    const before = readFileSync(source, "utf8");
    const result = runProject("spec", "transition", filename, "ready", "--reason", "No actor");

    assert.equal(result.status, 1);
    assert.match(result.stderr, /requires --actor/);
    assert.equal(readFileSync(source, "utf8"), before);
  });

  test("rejects an illegal transition without modifying the Spec", () => {
    const filename = "illegal.md";
    const source = writeSpec("draft", filename, approvedDraft());
    const result = runProject(
      "spec",
      "transition",
      filename,
      "done",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Skip state"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Illegal transition: draft -> done/);
    assert.equal(existsSync(source), true);
  });

  test("rejects incomplete Plan gates", () => {
    const filename = "incomplete.md";
    const source = writeSpec("draft", filename, approvedDraft({ owner: "TBD", approvalStatus: "Pending" }));
    const result = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Try incomplete"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Owner must be complete/);
    assert.match(result.stderr, /Approval Status must be exactly 'Plan Approved'/);
    assert.equal(existsSync(source), true);
  });

  test("rejects incomplete Review gates", () => {
    const filename = "incomplete-review.md";
    const content = reviewedReady().replace("- **Overall Verdict**: PASS", "- **Overall Verdict**: PENDING");
    const source = writeSpec("ready", filename, content);
    const result = runProject(
      "spec",
      "transition",
      filename,
      "done",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Try incomplete review"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Validation evidence and Review fields must be complete/);
    assert.match(result.stderr, /Overall Verdict must be PASS/);
    assert.equal(existsSync(source), true);
  });

  test("rejects ambiguous exact filenames", () => {
    const filename = "duplicate.md";
    writeSpec("draft", filename, approvedDraft());
    writeSpec("ready", filename, reviewedReady());
    const result = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Resolve duplicate"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Spec reference is ambiguous/);
  });

  test("rejects a stale expected version without persistent effects", () => {
    const filename = "stale.md";
    const source = writeSpec("draft", filename, approvedDraft());
    const result = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Stale command",
      "--expected-version",
      "1"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /expected 1, current 0/);
    assert.equal(existsSync(source), true);
    assert.equal(existsSync(path.join(fixtureRoot, ".workflow")), false);
  });

  test("never overwrites an existing target snapshot", () => {
    const filename = "target-exists.md";
    const source = writeSpec("draft", filename, approvedDraft());
    const target = writeSpec("ready", filename, "existing target\n");

    const result = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Do not overwrite"
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Spec reference is ambiguous/);
    assert.equal(existsSync(source), true);
    assert.equal(readFileSync(target, "utf8"), "existing target\n");
  });

  test("keeps versions and Markdown history continuous across transitions", () => {
    const filename = "continuous.md";
    writeSpec("ready", filename, reviewedReady());
    const toDraft = runProject(
      "spec",
      "transition",
      filename,
      "draft",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Revise plan",
      "--expected-version",
      "0"
    );
    assert.equal(toDraft.status, 0, toDraft.stderr);

    const toReady = runProject(
      "spec",
      "transition",
      filename,
      "ready",
      "--actor",
      "Test Reviewer",
      "--reason",
      "Approve revision",
      "--expected-version",
      "1"
    );
    assert.equal(toReady.status, 0, toReady.stderr);

    const content = readFileSync(path.join(fixtureRoot, "specs", "ready", filename), "utf8");
    assert.match(content, /Workflow Version\*\*: 2/);
    assert.match(content, /\| ready \| draft \| Test Reviewer \| Revise plan \|/);
    assert.match(content, /\| draft \| ready \| Test Reviewer \| Approve revision \|/);
    assert.equal(existsSync(path.join(fixtureRoot, ".workflow")), false);
  });
});
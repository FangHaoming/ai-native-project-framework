#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { decideTransition } from "./workflow/kernel.mjs";
import { persistWorkflowSnapshot, resolveWorkflowSnapshot } from "./workflow/file-store.mjs";
import { readSpecProjection, renderSpecTransition, validateSpecPolicy } from "./spec/policy.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const [area, action, ...rest] = args;

const CAPABILITIES = Object.freeze([
  Object.freeze({
    id: "project.check",
    command: "project check",
    status: "available",
    summary: "Validate required framework files.",
    boundary: "local-only"
  }),
  Object.freeze({
    id: "spec.new",
    command: "project spec new",
    status: "available",
    summary: "Create a draft Spec from the project template.",
    boundary: "local-filesystem"
  }),
  Object.freeze({
    id: "spec.list",
    command: "project spec list",
    status: "available",
    summary: "List Specs grouped by delivery state.",
    boundary: "local-filesystem"
  }),
  Object.freeze({
    id: "capability.list",
    command: "project capability list",
    status: "available",
    summary: "List project capabilities and lifecycle status.",
    boundary: "local-only"
  }),
  Object.freeze({
    id: "ops.logs",
    command: "project ops logs",
    status: "available",
    summary: "Build a redacted read-only observability query plan.",
    boundary: "query-plan-only"
  }),
  Object.freeze({
    id: "dev.status",
    command: "project dev status",
    status: "hook",
    summary: "Integration hook for local runtime status.",
    boundary: "no-runtime-adapter"
  }),
  Object.freeze({
    id: "test.affected",
    command: "project test affected",
    status: "hook",
    summary: "Integration hook for affected test detection.",
    boundary: "no-test-adapter"
  }),
  Object.freeze({
    id: "preview.create",
    command: "project preview create",
    status: "hook",
    summary: "Integration hook for preview environment creation.",
    boundary: "no-preview-adapter"
  }),
  Object.freeze({
    id: "deliver",
    command: "project deliver",
    status: "hook",
    summary: "Integration hook for delivery orchestration.",
    boundary: "no-delivery-adapter"
  }),
  Object.freeze({
    id: "spec.transition",
    command: "project spec transition",
    status: "available",
    summary: "Transition Specs through versioned Markdown delivery states.",
    boundary: "local-declarative-identity"
  }),
  Object.freeze({
    id: "db.plan",
    command: "project db plan",
    status: "planned",
    summary: "Plan database migrations through a controlled adapter.",
    boundary: "not-implemented"
  }),
  Object.freeze({
    id: "db.apply",
    command: "project db apply",
    status: "planned",
    summary: "Apply approved database migrations through a controlled adapter.",
    boundary: "not-implemented"
  }),
  Object.freeze({
    id: "config.get",
    command: "project config get",
    status: "planned",
    summary: "Read approved configuration through a controlled adapter.",
    boundary: "not-implemented"
  })
]);

const SPEC_STATES = Object.freeze(["draft", "ready", "done"]);
const LEGAL_SPEC_TRANSITIONS = Object.freeze({
  draft: Object.freeze(["ready"]),
  ready: Object.freeze(["draft", "done"]),
  done: Object.freeze([])
});
function usage() {
  console.log(`Usage:
  node tools/project.mjs check
  node tools/project.mjs capability list [--json]
  node tools/project.mjs spec new "change title"
  node tools/project.mjs spec list
  node tools/project.mjs spec transition <spec> <draft|ready|done> --actor <name> --reason <text> [--expected-version <number>]
  node tools/project.mjs ops logs --service api --env staging --since 30m --level error
  node tools/project.mjs dev status
  node tools/project.mjs test affected
  node tools/project.mjs preview create
  node tools/project.mjs deliver`);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "change";
}

function parseFlags(values) {
  const out = {};
  for (let i = 0; i < values.length; i += 1) {
    const item = values[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = values[i + 1];
    out[key] = next && !next.startsWith("--") ? next : true;
    if (out[key] === next) i += 1;
  }
  return out;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function capabilityList(values) {
  const flags = parseFlags(values);
  if (flags.json) {
    console.log(JSON.stringify({ capabilities: CAPABILITIES }, null, 2));
    return;
  }

  for (const status of ["available", "hook", "planned"]) {
    console.log(`${status}:`);
    for (const capability of CAPABILITIES.filter((item) => item.status === status)) {
      console.log(`- ${capability.command} [${capability.boundary}]`);
      console.log(`  ${capability.summary}`);
    }
  }
}

function check() {
  const required = [
    "AGENTS.md",
    ".ai/rules/engineering.md",
    ".cursor/skills/sdd-riper-one/SKILL.md",
    ".cursor/skills/sdd-riper-one/protocol.md",
    ".cursor/skills/sdd-riper-one/spec-template.md",
    "specs/templates/change-spec.md",
    "platform/observability-gateway/policy.json"
  ];
  const missing = required.filter((item) => !existsSync(path.join(root, item)));
  if (missing.length) {
    console.error("Missing required files:");
    for (const item of missing) console.error(`- ${item}`);
    process.exitCode = 1;
    return;
  }
  console.log("Framework check passed.");
}

function readGitUserName() {
  try {
    const name = execFileSync("git", ["config", "--get", "user.name"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (name) return name;
  } catch {
    // A missing repository identity is reported through the stable CLI error below.
  }
  throw new Error("Cannot create Spec: Git user.name is not configured.");
}

function specNew(titleParts) {
  const title = titleParts.join(" ").trim();
  if (!title) {
    console.error("Spec title is required.");
    process.exitCode = 1;
    return;
  }

  const owner = readGitUserName();
  const templatePath = path.join(root, "specs/templates/change-spec.md");
  const template = readFileSync(templatePath, "utf8");
  const filename = `${today()}-${slugify(title)}.md`;
  const targetDir = path.join(root, "specs/draft");
  mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, filename);

  if (existsSync(targetPath)) {
    console.error(`Spec already exists: ${path.relative(root, targetPath)}`);
    process.exitCode = 1;
    return;
  }

  const content = template
    .replaceAll("{{title}}", title)
    .replaceAll("{{owner}}", owner)
    .replaceAll("{{date}}", today());
  writeFileSync(targetPath, content);
  console.log(`Created ${path.relative(root, targetPath)}`);
}

function specList() {
  for (const state of SPEC_STATES) {
    const dir = path.join(root, "specs", state);
    const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".md")) : [];
    console.log(`${state}: ${files.length}`);
    for (const file of files) console.log(`- specs/${state}/${file}`);
  }
}

function specTransition(values) {
  const [reference, targetState] = values;
  const flags = parseFlags(values.slice(2));
  const actor = typeof flags.actor === "string" ? flags.actor.trim() : "";
  const reason = typeof flags.reason === "string" ? flags.reason.trim() : "";
  const expectedVersion = flags["expected-version"] === undefined ? undefined : Number(flags["expected-version"]);

  if (!actor) throw new Error("Transition requires --actor <name>.");
  if (!reason) throw new Error("Transition requires --reason <text>.");
  if (expectedVersion !== undefined && (!Number.isInteger(expectedVersion) || expectedVersion < 0)) {
    throw new Error("--expected-version must be a non-negative integer.");
  }

  const filename = reference?.endsWith(".md") ? reference : `${reference}.md`;
  const workflowId = filename?.slice(0, -3);
  const spec = resolveWorkflowSnapshot(root, SPEC_STATES, reference);
  const projection = readSpecProjection(spec.content);
  const command = Object.freeze({
    workflowId,
    workflowType: "spec",
    from: spec.state,
    to: targetState,
    expectedVersion,
    actor,
    reason,
    evidenceRefs: Object.freeze([])
  });
  const decision = decideTransition({
    currentState: spec.state,
    currentVersion: projection.version,
    legalTransitions: LEGAL_SPEC_TRANSITIONS,
    command
  });
  const failures = [
    ...(SPEC_STATES.includes(targetState) ? [] : [`Unknown target state: ${targetState}`]),
    ...(decision.accepted ? [] : decision.failures),
    ...validateSpecPolicy(projection, spec.state, targetState)
  ];
  if (failures.length) throw new Error(`Spec transition rejected:\n- ${failures.join("\n- ")}`);

  const transition = Object.freeze({
    workflowId,
    workflowType: "spec",
    version: decision.nextVersion,
    from: spec.state,
    to: targetState,
    actor,
    reason,
    timestamp: new Date().toISOString(),
    evidenceRefs: Object.freeze([])
  });
  const updated = renderSpecTransition(spec.content, transition);
  const targetPath = persistWorkflowSnapshot(root, spec, targetState, updated);
  console.log(`Transitioned ${spec.state} -> ${targetState} (v${transition.version}): ${path.relative(root, targetPath)}`);
}

function opsLogs(values) {
  const flags = parseFlags(values);
  const env = flags.env || "staging";
  const service = flags.service || "api";
  const since = flags.since || "30m";
  const level = flags.level || "error";

  console.log("Observability query plan:");
  console.log(JSON.stringify({
    kind: "logs",
    service,
    env,
    since,
    level,
    access: env === "production" ? "read-only" : "read-only-with-runbook-policy",
    redaction: ["tokens", "cookies", "emails", "phones", "authorizationHeaders"],
    note: "Wire this command to Loki, Elasticsearch, CloudWatch, Datadog, or Grafana through platform/observability-gateway."
  }, null, 2));
}

function stub(name) {
  console.log(`${name} is a framework hook. Connect it to your local stack or control plane implementation.`);
}

try {
  if (!area) {
    usage();
  } else if (area === "check") {
    check();
  } else if (area === "capability" && action === "list") {
    capabilityList(rest);
  } else if (area === "spec" && action === "new") {
    specNew(rest);
  } else if (area === "spec" && action === "list") {
    specList();
  } else if (area === "spec" && action === "transition") {
    specTransition(rest);
  } else if (area === "ops" && action === "logs") {
    opsLogs(rest);
  } else if (area === "dev" && action === "status") {
    stub("dev status");
  } else if (area === "test" && action === "affected") {
    stub("test affected");
  } else if (area === "preview" && action === "create") {
    stub("preview create");
  } else if (area === "deliver") {
    stub("deliver");
  } else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

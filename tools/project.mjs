#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

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
    summary: "Transition Specs through audited delivery states.",
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
const RIPER_PHASE_ORDER = Object.freeze({
  Research: 0,
  Innovate: 1,
  Plan: 2,
  Execute: 3,
  Review: 4
});

function usage() {
  console.log(`Usage:
  node tools/project.mjs check
  node tools/project.mjs capability list [--json]
  node tools/project.mjs spec new "change title"
  node tools/project.mjs spec list
  node tools/project.mjs spec transition <spec> <draft|ready|done> --actor <name> --reason <text>
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

function readSpecField(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.match(new RegExp(`^- \\*\\*${escapedLabel}\\*\\*: (.+)$`, "m"))?.[1]?.trim() || "";
}

function readSpecSection(content, heading) {
  const start = content.indexOf(`${heading}\n`);
  if (start === -1) return "";
  const bodyStart = start + heading.length + 1;
  const next = content.indexOf("\n## ", bodyStart);
  return content.slice(bodyStart, next === -1 ? content.length : next);
}

function hasIncompleteMarker(value) {
  return /\bTBD\b|\bpending\b/i.test(value);
}

function resolveSpec(reference) {
  if (!reference) throw new Error("Spec reference is required.");
  if (path.basename(reference) !== reference) {
    throw new Error("Spec reference must be an exact filename, not a path.");
  }

  const filename = reference.endsWith(".md") ? reference : `${reference}.md`;
  const matches = SPEC_STATES.flatMap((state) => {
    const filePath = path.join(root, "specs", state, filename);
    return existsSync(filePath) ? [{ state, filename, filePath }] : [];
  });

  if (matches.length === 0) throw new Error(`Spec not found: ${filename}`);
  if (matches.length > 1) throw new Error(`Spec reference is ambiguous: ${filename}`);

  const resolved = matches[0];
  return { ...resolved, content: readFileSync(resolved.filePath, "utf8") };
}

function readSpecMetadata(content) {
  return {
    deliveryStatus: readSpecField(content, "Delivery Status"),
    riperPhase: readSpecField(content, "RIPER Phase"),
    approvalStatus: readSpecField(content, "Approval Status"),
    owner: readSpecField(content, "Owner"),
    overallVerdict: readSpecField(content, "Overall Verdict")
  };
}

function validateSpecTransition(spec, targetState) {
  const failures = [];
  const metadata = readSpecMetadata(spec.content);
  const legalTargets = LEGAL_SPEC_TRANSITIONS[spec.state] || [];

  if (!SPEC_STATES.includes(targetState)) failures.push(`Unknown target state: ${targetState}`);
  if (!legalTargets.includes(targetState)) failures.push(`Illegal transition: ${spec.state} -> ${targetState}`);
  if (metadata.deliveryStatus !== spec.state) {
    failures.push(`Delivery Status '${metadata.deliveryStatus || "missing"}' does not match directory '${spec.state}'.`);
  }

  if (spec.state === "draft" && targetState === "ready") {
    const requirements = readSpecSection(spec.content, "## 1. Requirements (Context)");
    const plan = readSpecSection(spec.content, "## 4. Plan (Contract)");
    const phaseRank = RIPER_PHASE_ORDER[metadata.riperPhase];

    if (!metadata.owner || hasIncompleteMarker(metadata.owner)) failures.push("Owner must be complete.");
    if (phaseRank === undefined || phaseRank < RIPER_PHASE_ORDER.Plan) failures.push("RIPER Phase must have reached Plan.");
    if (metadata.approvalStatus !== "Plan Approved") failures.push("Approval Status must be exactly 'Plan Approved'.");
    if (!requirements || hasIncompleteMarker(requirements) || !requirements.includes("### Acceptance Criteria")) {
      failures.push("Requirements and acceptance criteria must be complete.");
    }
    if (!plan || hasIncompleteMarker(plan) || !plan.includes("### 4.1 File Changes") || !plan.includes("### 4.2 Signatures") || !plan.includes("### 4.3 Implementation Checklist")) {
      failures.push("Plan file changes, signatures, and checklist must be complete.");
    }
  }

  if (spec.state === "ready" && targetState === "done") {
    const executeLog = readSpecSection(spec.content, "## 5. Execute Log");
    const validation = readSpecSection(spec.content, "## 6. Validation & Review Verdict");
    const handoff = readSpecSection(spec.content, "## 8. Change Log & Handoff");

    if (metadata.riperPhase !== "Review") failures.push("RIPER Phase must be Review.");
    if (!executeLog || executeLog.includes("- [ ]")) failures.push("Execute Log must have no incomplete checklist items.");
    if (!validation || hasIncompleteMarker(validation)) failures.push("Validation evidence and Review fields must be complete.");
    if (!/Reviewer Notes:\s*(?!pending|TBD)\S+/i.test(validation)) failures.push("Reviewer Notes must be complete.");
    if (metadata.overallVerdict !== "PASS") failures.push("Overall Verdict must be PASS.");
    if (!handoff || hasIncompleteMarker(handoff)) failures.push("Handoff must be complete.");
  }

  return failures;
}

function updateSpecForTransition(content, sourceState, targetState, actor, reason, timestamp) {
  const statusPattern = /^- \*\*Delivery Status\*\*: .+$/m;
  if (!statusPattern.test(content)) throw new Error("Delivery Status field is missing.");

  const updated = content.replace(statusPattern, `- **Delivery Status**: ${targetState}`).trimEnd();
  const historyHeading = "## 10. Transition History";
  const historyRow = `| ${timestamp} | ${sourceState} | ${targetState} | ${actor.replaceAll("|", "\\|")} | ${reason.replaceAll("|", "\\|")} |`;

  if (updated.includes(historyHeading)) return `${updated}\n${historyRow}\n`;
  return `${updated}\n\n${historyHeading}\n\n| Timestamp | From | To | Actor | Reason |\n| --- | --- | --- | --- | --- |\n${historyRow}\n`;
}

function persistSpecTransition(spec, targetState, content) {
  const targetPath = path.join(root, "specs", targetState, spec.filename);
  if (existsSync(targetPath)) throw new Error(`Target Spec already exists: ${path.relative(root, targetPath)}`);

  const nonce = `${process.pid}-${Date.now()}`;
  const preparedPath = `${targetPath}.prepared-${nonce}`;
  const rollbackPath = `${spec.filePath}.rollback-${nonce}`;
  writeFileSync(preparedPath, content, { flag: "wx" });

  renameSync(spec.filePath, rollbackPath);
  try {
    renameSync(preparedPath, targetPath);
  } catch (error) {
    if (existsSync(rollbackPath)) renameSync(rollbackPath, spec.filePath);
    if (existsSync(preparedPath)) unlinkSync(preparedPath);
    throw error;
  }

  try {
    unlinkSync(rollbackPath);
  } catch {
    // The transition is already committed; retain the hidden rollback artifact for manual recovery.
  }

  return targetPath;
}

function specTransition(values) {
  const [reference, targetState] = values;
  const flags = parseFlags(values.slice(2));
  const actor = typeof flags.actor === "string" ? flags.actor.trim() : "";
  const reason = typeof flags.reason === "string" ? flags.reason.trim() : "";

  if (!actor) throw new Error("Transition requires --actor <name>.");
  if (!reason) throw new Error("Transition requires --reason <text>.");

  const spec = resolveSpec(reference);
  const failures = validateSpecTransition(spec, targetState);
  if (failures.length) throw new Error(`Spec transition rejected:\n- ${failures.join("\n- ")}`);

  const timestamp = new Date().toISOString();
  const updated = updateSpecForTransition(spec.content, spec.state, targetState, actor, reason, timestamp);
  const targetPath = persistSpecTransition(spec, targetState, updated);
  console.log(`Transitioned ${spec.state} -> ${targetState}: ${path.relative(root, targetPath)}`);
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

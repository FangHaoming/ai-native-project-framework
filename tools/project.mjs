#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = process.argv.slice(2);
const [area, action, ...rest] = args;

function usage() {
  console.log(`Usage:
  node tools/project.mjs check
  node tools/project.mjs spec new "change title"
  node tools/project.mjs spec list
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

function check() {
  const required = ["AGENTS.md", ".ai/rules/engineering.md", "specs/templates/change-spec.md", "platform/observability-gateway/policy.json"];
  const missing = required.filter((item) => !existsSync(path.join(root, item)));
  if (missing.length) {
    console.error("Missing required files:");
    for (const item of missing) console.error(`- ${item}`);
    process.exitCode = 1;
    return;
  }
  console.log("Framework check passed.");
}

function specNew(titleParts) {
  const title = titleParts.join(" ").trim();
  if (!title) {
    console.error("Spec title is required.");
    process.exitCode = 1;
    return;
  }

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
    .replaceAll("{{date}}", today());
  writeFileSync(targetPath, content);
  console.log(`Created ${path.relative(root, targetPath)}`);
}

function specList() {
  for (const state of ["draft", "ready", "done"]) {
    const dir = path.join(root, "specs", state);
    const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".md")) : [];
    console.log(`${state}: ${files.length}`);
    for (const file of files) console.log(`- specs/${state}/${file}`);
  }
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

if (!area) {
  usage();
} else if (area === "check") {
  check();
} else if (area === "spec" && action === "new") {
  specNew(rest);
} else if (area === "spec" && action === "list") {
  specList();
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

# Change Spec: initialize AI native framework

Status: done
Owner: Codex
Created: 2026-08-10

## Goal

Create a reusable AI-native project framework skeleton with spec-driven delivery, controlled agent tools, role rules, and read-only observability access.

## Scope

In scope:

- Repository layout for apps, packages, platform, specs, AI rules, and tools.
- Minimal `project` CLI for checks, specs, logs, dev, tests, preview, and delivery hooks.
- Observability gateway policy for environment-scoped log access.
- Documentation for architecture, workflow, and roadmap.

Out of scope:

- Binding to a specific web framework, backend framework, database, or deployment provider.
- Real integration with Loki, Datadog, CloudWatch, GitHub, GitLab, Temporal, or Kubernetes.

## Acceptance Criteria

- `npm run check` passes.
- `npm run ops:logs -- --service api --env staging --since 30m` prints a redacted read-only query plan.
- The repository documents production safety boundaries for AI agents.

## Risk

- Security: production mutation is intentionally not implemented.
- Data: logs are represented as sanitized query plans until a real provider is connected.
- Runtime: no long-running services are started.
- Compatibility: requires Node.js 20 or newer.

## Implementation Notes

- The CLI lives in `tools/project.mjs`.
- AI operating constraints live in `AGENTS.md` and `.ai/rules`.
- The observability boundary lives in `platform/observability-gateway`.

## Verification Evidence

- `node tools/project.mjs check`: passed.
- `node tools/project.mjs ops logs --service api --env staging --since 30m --level error`: printed read-only redacted query plan.

## Handoff

Next useful step is choosing the concrete runtime stack, then replacing CLI stubs with real adapters.

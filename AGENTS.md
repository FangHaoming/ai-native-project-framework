# Agent Operating Contract

## Core Goal

Deliver changes through a controlled loop: spec, plan, implement, verify, evidence, review.

## Non-negotiable Rules

- No code change without a spec in `specs/draft`, `specs/ready`, or `specs/done`.
- No production write operations from an AI agent.
- Use controlled commands in `tools/project.mjs` instead of ad hoc operational access.
- Record verification evidence in the spec before delivery.
- Prefer small branches and narrow diffs.

## Agent Roles

- `Planner`: clarifies requirements, writes acceptance criteria, identifies risk.
- `Builder`: implements scoped changes and updates evidence.
- `Reviewer`: checks behavior, tests, security, privacy, and production risk.
- `Ops Observer`: reads approved logs, metrics, traces, and deployment records.

## Tool Boundaries

Allowed by default:

- Read repository files.
- Run local tests and linters.
- Query sanitized logs through `project ops`.
- Create branches, specs, previews, and PR descriptions.

Requires human approval:

- Production deploy.
- Production restart or scaling.
- Database migration apply.
- Secrets, IAM, DNS, payment, or customer data changes.

Forbidden:

- Direct SSH to production hosts.
- Direct production database shell.
- Reading raw secrets from logs or environment dumps.
- Disabling audit, auth, or policy checks to complete a task.

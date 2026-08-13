# Specs

Specs are the project memory and delivery contract. This repository uses the project-local `.cursor/skills/sdd-riper-one/SKILL.md` protocol: `Spec is Truth`, `No Spec, No Code`, `Reverse Sync`, and explicit RIPER gates.

## Two State Dimensions

Delivery state is stored by directory:

- `draft`: research or planning is incomplete, or the Plan is not approved.
- `ready`: the Plan is complete and has the exact approval `Plan Approved`; implementation may start.
- `done`: execution, validation, and three-axis Review have passed.

Engineering state is stored inside the Spec:

```text
Research -> (Innovate, optional) -> Plan -> Execute -> Review
```

Every Spec must explicitly record `RIPER Phase` and `Approval Status`. Directory state and RIPER phase are related but are not interchangeable.

## Workflow

Create a new Spec from the SDD-RIPER-ONE-aligned template:

```bash
npm run spec:new -- "short change title"
```

List Specs:

```bash
npm run spec:list
```

Transition Specs only through the controlled state machine:

```bash
npm run spec:transition -- <spec-filename> ready --actor "reviewer" --reason "Plan approved" --expected-version 0
npm run spec:transition -- <spec-filename> draft --actor "reviewer" --reason "Plan revision required" --expected-version 1
npm run spec:transition -- <spec-filename> done --actor "reviewer" --reason "Review passed" --expected-version 2
```

The CLI accepts exact filenames with or without `.md`, rejects ambiguous references and illegal transitions, prevents target overwrite, increments `Workflow Version`, updates `Delivery Status`, and appends Transition History. `--expected-version` is optional and rejects an explicitly stale Markdown version before mutation; it is not a process or distributed lock.

Markdown under `specs/` is the complete workflow record, and Git is the collaboration and recovery boundary across branches and machines. A transition uses short-lived prepared and rollback filenames only within one command. There is no local event store, persistent transaction metadata, or automatic crash recovery; inspect named artifacts and the Git working tree if a process is interrupted.

Legacy active Specs without `Workflow Version` are treated as version `0` until their next successful transition; completed Specs are not migrated. Actor metadata is declarative local audit context, not authenticated identity.

## Execution Gate

Code execution is locked until:

1. Research findings are persisted.
2. Plan contains exact file changes, signatures, and an atomic checklist.
3. The user provides the exact phrase `Plan Approved`.
4. Approval status is reverse-synced into the Spec.

Review must compare requirements, Plan versus implementation, and intrinsic code quality. Validation evidence and Review verdict must be written back before completion.

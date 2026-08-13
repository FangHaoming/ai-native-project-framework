# Workflow

## State Model

Delivery state and engineering phase are separate dimensions.

```text
Delivery: draft -> ready -> done
                    -> draft

RIPER: Research -> (Innovate) -> Plan -> Execute -> Review
```

- `draft`: Research or Plan is incomplete, or exact approval is absent.
- `ready`: the Plan is complete, `Plan Approved` is recorded, and implementation may proceed.
- `done`: execution, validation, and three-axis Review passed.

A RIPER phase may advance while a legacy active Spec is still in `draft`; the ready gate therefore requires a phase that has reached Plan, not strict equality with Plan.

## Controlled Transitions

All directory moves use the controlled CLI:

```bash
project spec transition <spec-filename> ready --actor <name> --reason <text> [--expected-version <number>]
project spec transition <spec-filename> draft --actor <name> --reason <text> [--expected-version <number>]
project spec transition <spec-filename> done --actor <name> --reason <text> [--expected-version <number>]
```

Legal transitions are `draft -> ready`, `ready -> draft`, and `ready -> done`; `done` is terminal. References are exact filenames. Every successful move increments `Workflow Version`, updates `Delivery Status`, and appends Markdown Transition History. Markdown under `specs/` is the only workflow persistence, and Git carries it across branches and machines.

`--expected-version` is optional for compatibility. When supplied, it rejects a command that was prepared from a different Markdown version before filesystem mutation. It is not a lock and does not provide cross-process, cross-worktree, or distributed serialization.

## Local File Boundary

```text
resolve exact Markdown snapshot
  -> validate state, version, and Spec policy
  -> write a uniquely named prepared file
  -> move the source to a uniquely named rollback file
  -> promote the prepared file into the target directory
  -> remove the rollback file
```

The command never overwrites an existing target. If promotion fails during the command, it restores the source when immediately possible and removes the prepared file. A failure after the target becomes visible may leave a clearly named rollback artifact for manual inspection. There is no persistent transaction log or automatic crash recovery; use the working tree and Git history as the final recovery mechanism.

A legacy active Spec without `Workflow Version` is read as version `0` and upgraded on its next successful transition. Existing completed Specs are not migrated. Actor metadata is declarative local identity for audit context; it is not authenticated identity.

## RIPER Gates

- Research persists scope, acceptance criteria, context, findings, and risk.
- Plan persists exact files, signatures or data contracts, and atomic checklist items.
- Execute requires the exact phrase `Plan Approved` in `Approval Status`.
- Review compares requirement completion, Plan versus implementation, and intrinsic code quality.
- `ready -> done` requires completed execution, verification evidence, reviewer notes, `Overall Verdict: PASS`, and complete handoff.

## Evidence

Every completed change should include:

- Spec id and transition history.
- Commit or PR when applicable.
- Exact test command and result.
- Relevant screenshots or logs, or an explicit not-applicable reason.
- Reviewer notes and known residual risk.

## Incident Lifecycle

```text
alert -> observe -> correlate -> hypothesize -> patch -> verify -> review -> release
```

AI can observe and correlate approved production data. It must not directly mutate production systems.

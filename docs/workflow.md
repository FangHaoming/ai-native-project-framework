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
project spec transition <spec-filename> ready --actor <name> --reason <text>
project spec transition <spec-filename> draft --actor <name> --reason <text>
project spec transition <spec-filename> done --actor <name> --reason <text>
```

Legal transitions are `draft -> ready`, `ready -> draft`, and `ready -> done`; `done` is terminal. References are exact filenames. Every successful move updates `Delivery Status` and appends timestamp, actor, reason, source, and target to Transition History.

Actor metadata is declarative local identity for audit context; it is not authenticated identity.

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

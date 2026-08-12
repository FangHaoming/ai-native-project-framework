# Project SDD-RIPER-ONE Protocol

## Purpose

This protocol makes project changes reviewable, resumable, and evidence-based. Specs serve humans first and Agents second.

## Safeguards

- Never run destructive cleanup commands or discard unrelated working-tree changes.
- Never perform production writes, secret access, direct production SSH, or direct production database access.
- Use `tools/project.mjs` for controlled project and operational actions.
- Keep diffs narrow and preserve existing user changes.

## State dimensions

### Delivery state

```text
draft -> ready -> done
ready -> draft
```

- `draft`: Research or Plan is incomplete, or approval is absent.
- `ready`: Plan is complete and exact approval `Plan Approved` is persisted.
- `done`: Execute, validation, and Review passed.
- `done` is terminal in the local state machine.

### RIPER phase

```text
Research -> (Innovate, optional) -> Plan -> Execute -> Review
```

`RIPER Phase` is independent from the directory name. `Approval Status` must always be explicit.

## Research

Status is locked for implementation.

Persist:

- Goal, in-scope, and out-of-scope
- acceptance criteria and Done Contract
- context sources and Codemap reference
- runtime or repository facts
- open questions, risks, and next actions

Use a feature Codemap for focused changes and a project Codemap for broad architecture work. A small repository may use a concise feature index.

## Innovate

Use only when alternatives have meaningful trade-offs. Persist options, selection, and rationale. If skipped, record `Skipped: true` and a concrete reason.

## Plan

Status remains locked.

The Plan is an implementation contract and must contain:

- exact file paths
- changed function, command, schema, or data-contract signatures
- atomic ordered checklist
- risks and rollback or recovery approach
- validation commands and expected evidence

After persistence, stop. Execute is forbidden until the user sends the exact phrase `Plan Approved` and it is written into the Spec.

## Execute

Status is active only after approval.

- Reload the Plan and active checklist item before editing.
- Implement one atomic checklist item by default.
- `全部`, `all`, `execute all`, `继续完成所有`, or `一次性完成` authorizes batch execution of all remaining approved items.
- Persist Execute Log after every logical item.
- If reality requires a logic or architecture change, stop, revise Plan, and request approval again.

## Validation

Validation evidence must state the exact command or observation and result. Do not treat a placeholder, hook message, or query plan as a successful test or Provider integration.

## Review

Reload Requirements, Plan, Execute Log, validation evidence, and changed files. Persist this matrix:

1. Spec Quality and Requirement Completion
2. Spec-Code Fidelity
3. Code Intrinsic Quality

Each axis receives `PASS`, `FAIL`, or `PARTIAL` with evidence. Record Overall Verdict, blockers, regression risk, follow-ups, and Plan-Execution Diff. Any unresolved high-risk issue prevents completion.

## Reverse sync

Update the active Spec immediately when:

- a user decision changes scope or constraints
- approval is received or revoked
- implementation reveals a false assumption
- a checklist item completes
- validation succeeds or fails
- Review identifies a deviation

## Context loading

Every turn retains phase, approval, Spec path, goal, active checklist, risks, and next action. On phase changes reload the corresponding full sections. During Review reload the complete active Spec.

## Stop and wait

Before waiting:

1. persist current findings or Plan
2. list unresolved blockers in one batch
3. state the exact command or decision needed next
4. do not perform further execution
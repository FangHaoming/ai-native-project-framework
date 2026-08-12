---
name: sdd-riper-one
description: Enforces project-local Spec-driven delivery with explicit Research, Plan, Execute, and Review gates. Use for repository code, architecture, workflow, or operational changes, and whenever the user mentions Spec, RIPER, planning, implementation, or review.
---

# SDD-RIPER-ONE

Use this Skill for every non-trivial project change. The active Spec is the persistent source of truth; chat is not.

## Required references

- Read [protocol.md](protocol.md) once before applying the workflow.
- Use [spec-template.md](spec-template.md) when creating or restructuring a Spec.
- Reload only the current phase sections during normal work; reload the full Spec on phase changes or Review.

## Core gates

- `No Spec, No Code`: persist a Spec under `specs/draft`, `specs/ready`, or `specs/done` before implementation.
- `Spec is Truth`: write decisions, discovered constraints, execution results, and deviations back to the Spec immediately.
- `No Approval, No Execute`: only the exact phrase `Plan Approved`, recorded as `Approval Status`, unlocks Execute.
- `Reverse Sync`: when implementation reality differs from the Plan, update the Spec before changing behavior.
- Production writes remain prohibited; project approval does not override operational policy.

## State model

Keep two dimensions explicit:

- Delivery state: `draft -> ready -> done`, represented by the directory and `Delivery Status`.
- Engineering phase: `Research -> (Innovate) -> Plan -> Execute -> Review`, represented by `RIPER Phase`.

Do not collapse these dimensions. A Spec becomes `ready` only after the Plan is complete and approved. It becomes `done` only after Execute, validation, and three-axis Review pass.

## Hot context

Every active turn must retain:

- active Spec path
- `RIPER Phase`
- `Approval Status`
- Goal and scope
- active checklist item
- open questions and risks
- next action

## Workflow

1. Research repository facts and persist requirements, acceptance criteria, context sources, findings, risks, and next actions.
2. Use Innovate only when meaningful alternatives exist; otherwise record the skip reason.
3. Plan exact file changes, signatures or data contracts, and atomic checklist items.
4. Stop and wait for exact `Plan Approved`.
5. Execute the approved checklist without unplanned behavior changes; update Execute Log continuously.
6. Validate behavior and persist command results or equivalent evidence.
7. Review three axes: requirement completion, Spec-code fidelity, and intrinsic quality.
8. Record `Plan-Execution Diff`, handoff state, residual risk, and optional archive information.

## Stop conditions

Stop and return to Research or Plan when requirements conflict, a planned signature is insufficient, execution requires an unplanned architectural decision, or validation reveals a behavior gap. Never infer approval from conversational tone.

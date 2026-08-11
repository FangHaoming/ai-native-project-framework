# Architecture

## Principle

AI should handle ambiguous work. Deterministic and risky operations should stay inside software controls.

## Layers

```text
Collaboration Portal
  -> Spec Workflow
  -> Agent Harness
  -> Controlled Tools
  -> Runtime Platform
  -> Governance and Observability
```

## Controlled Tools

Agents should use commands like:

```bash
project db plan
project db apply
project config get
project dev status
project test affected
project preview create
project ops logs
project deliver
```

The first version in this repository implements the shape of the tool contract in `tools/project.mjs`.

## Production Safety

Production is read-only for AI by default. Any mutation must be represented as an auditable workflow:

```text
proposal -> approval -> runbook -> execution -> evidence -> rollback notes
```

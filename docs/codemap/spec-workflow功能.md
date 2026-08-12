# Spec Workflow 功能 CodeMap

## Scope

本索引覆盖能力状态契约与 Spec 生命周期控制，不覆盖具体业务应用、部署 Provider 或生产运维实现。

## Entry Points

- `package.json`: 人和 Agent 使用的 npm 命令入口。
- `tools/project.mjs`: 受控 CLI、能力声明和 Spec 操作入口。
- `specs/templates/change-spec.md`: 新 Spec 的持久化结构。
- `specs/draft/`, `specs/ready/`, `specs/done/`: 交付状态存储。

## Core Flow

```text
project capability list
  -> capability registry
  -> human output / JSON output

project spec new
  -> SDD-RIPER-ONE template
  -> specs/draft

project spec transition
  -> resolve exact Spec
  -> validate legal transition
  -> validate phase and evidence gates
  -> update Delivery Status
  -> append transition history
  -> atomic move to target directory
```

## State Boundaries

- Directory state records delivery readiness: `draft`, `ready`, `done`.
- `RIPER Phase` records engineering phase: `Research`, `Innovate`, `Plan`, `Execute`, `Review`.
- `Approval Status` records whether the Plan has the exact approval required for execution.
- These dimensions are related but must not be collapsed into one status field.

## Dependencies

- Node.js built-in `fs`, `path`, and `process` modules.
- Local Markdown files as the current persistence layer.
- No external identity, approval, SCM, database, or observability Provider.

## Risks

- Directory and Markdown state can diverge if writes are not atomic.
- Declarative actor metadata can be mistaken for authenticated identity.
- Loose placeholder detection can allow incomplete Specs through gates or reject valid prose.
- Capability documentation can drift unless generated or validated from one registry.
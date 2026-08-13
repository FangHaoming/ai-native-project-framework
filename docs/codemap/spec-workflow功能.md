# Spec Workflow 功能 CodeMap

## Scope

本索引覆盖能力状态契约与 Spec 生命周期控制，不覆盖具体业务应用、部署 Provider 或生产运维实现。

## Entry Points

- `package.json`: 人和 Agent 使用的 npm 命令入口。
- `tools/project.mjs`: 受控 CLI、能力声明和 Spec 操作入口。
- `tools/workflow/kernel.mjs`: 与领域和文件系统无关的合法转换及期望版本判定。
- `tools/spec/policy.mjs`: Markdown 投影、RIPER/审批/Review 门禁和快照渲染。
- `tools/workflow/file-store.mjs`: 精确解析与不覆盖目标的 Markdown 文件切换。
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
  -> resolve exact Markdown snapshot
  -> Spec policy projection and RIPER/evidence gates
  -> pure workflow legality and optional expected-version decision
  -> render status, version, and Markdown history
  -> switch the snapshot without overwriting the target
  -> rely on Git for branch and machine reconciliation
```

## State Boundaries

- Directory state records delivery readiness: `draft`, `ready`, `done`.
- `RIPER Phase` records engineering phase: `Research`, `Innovate`, `Plan`, `Execute`, `Review`.
- `Approval Status` records whether the Plan has the exact approval required for execution.
- These dimensions are related but must not be collapsed into one status field.

## Dependencies

- Node.js built-in `fs`, `path`, and `process` modules.
- Git-managed Markdown snapshots for complete workflow content, version, and transition history.
- No local event store, process lock, durable transaction, database, queue, or external workflow engine.
- No external identity, approval, SCM Provider, database, or observability Provider.

## Risks

- Explicit `--expected-version` can reject a stale command but cannot serialize simultaneous processes or reconcile Git branches.
- A process interruption may leave a clearly named prepared or rollback artifact that requires local inspection.
- Declarative actor metadata can be mistaken for authenticated identity.
- Loose placeholder detection can allow incomplete Specs through gates or reject valid prose.
- Capability documentation can drift unless generated or validated from one registry.

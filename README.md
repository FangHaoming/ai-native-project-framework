# AI Native Project Framework

这是一个通用 AI 原生项目框架的起步仓库。它不是单纯的 Agent Demo，而是把企业应用底座、AI 工程约束、协作流、受控运维观测放在同一个 Golden Path 里。

## 设计目标

- 用 `spec` 固化需求、边界、验收标准和验证证据。
- 让 AI 通过受控 CLI / MCP 工具工作，而不是直接越权操作代码库、服务器或生产数据。
- 把日志、trace、部署、PR、测试结果串起来，形成可审计的排障和交付链路。
- 支持人类产品、研发、测试、运维一起协作，而不是只服务单个程序员的聊天窗口。

## 分层

1. `apps/`: 业务应用入口，例如 Web、API、Admin。
2. `packages/`: 可复用业务包、SDK、UI、配置。
3. `platform/`: 权限、审计、工作流、MCP、观测网关等平台能力。
4. `specs/`: 需求和变更的状态化记录。
5. `.ai/`: Agent 角色、规则、技能、评测和工具权限。
6. `tools/`: 给人和 AI 共用的受控命令。

## 最小工作流

```text
capture -> clarify -> specified -> approved -> implementing -> verifying -> human_acceptance -> review -> merged -> released
```

每个变更都应该有一个 spec。AI 可以负责澄清、计划、实现、排障和验证，但高风险操作必须通过控制面审批。

## 快速开始

```bash
npm run check
npm run spec:new -- "add billing audit log"
npm run spec:list
npm run ops:logs -- --service api --env staging --since 30m
```

当前仓库不绑定具体前后端技术栈，默认把框架骨架和控制面接口先立住。实际项目可以在 `apps/` 和 `packages/` 中接入 React/Vue、NestJS/FastAPI、PostgreSQL、Redis、Temporal/DBOS、OpenTelemetry 等。

## AI 看服务器日志的边界

AI 可以通过 `platform/observability-gateway` 和 `project ops logs` 查询脱敏后的日志、指标、trace 和部署记录。默认策略：

- `local` / `preview`: 可读日志，可操作自己创建的环境。
- `staging`: 可读日志，可触发受限 runbook。
- `production`: 默认只读；重启、扩容、配置、数据库变更必须审批。

AI 不应该直接 SSH 到生产机器，也不应该拥有绕过审计的 `kubectl`、数据库或云账号权限。

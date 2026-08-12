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

## 控制面与应用运行时

根目录的 `package.json` 只定义工程控制面入口：它通过 Node.js 运行 `tools/project.mjs`，统一承载 Spec、检查、观测和交付等受控工作流。这里的 Node.js 版本要求不是业务后端的技术栈约束，Python 或 Java 依赖不应加入根 `package.json`。

业务应用统一放在 `apps/<name>`，每个应用自行拥有依赖、构建、测试和运行配置：

```text
apps/
├── api-python/    # pyproject.toml、uv.lock 或 requirements.txt
├── api-java/      # pom.xml 或 build.gradle.kts
└── web/           # package.json 及其 lockfile
```

根控制面可以在后续 Real Stack Binding 阶段编排这些应用，但当前版本尚未实现技术栈自动识别或跨语言测试分派。

## 最小工作流

```text
capture -> clarify -> specified -> approved -> implementing -> verifying -> human_acceptance -> review -> merged -> released
```

每个变更都应该有一个 spec。AI 可以负责澄清、计划、实现、排障和验证，但高风险操作必须通过控制面审批。项目内 `.cursor/skills/sdd-riper-one/` 定义 Spec 的 RIPER 阶段、精确批准门禁和三轴 Review。

## 能力状态

`tools/project.mjs` 中的能力注册表是命令成熟度的唯一事实源。执行 `npm run capability:list` 查看当前状态，或追加 `-- --json` 获取机器可读结果。

- `available`: 当前行为已经实现，可以按描述执行。
- `hook`: CLI 入口存在，但尚未连接真实运行栈或 Provider。
- `planned`: 目标架构能力，当前没有可执行实现。

当前 `ops logs` 的可用范围仅为生成脱敏、只读的查询计划，边界标记为 `query-plan-only`；它尚未连接 Loki、Datadog、CloudWatch 等日志 Provider。

## 快速开始

```bash
npm run check
npm run test
npm run capability:list
npm run spec:new -- "add billing audit log"
npm run spec:list
npm run spec:transition -- <spec-filename> ready --actor "reviewer" --reason "Plan approved"
npm run ops:logs -- --service api --env staging --since 30m
```

当前仓库不绑定具体前后端技术栈，默认把框架骨架和控制面接口先立住。实际项目可以在 `apps/` 和 `packages/` 中接入 React/Vue、NestJS/FastAPI、PostgreSQL、Redis、Temporal/DBOS、OpenTelemetry 等。

## AI 看服务器日志的边界

AI 通过 `platform/observability-gateway` 和 `project ops logs` 建立脱敏、只读的观测查询边界。当前仓库只实现查询计划生成，不读取真实日志、指标、trace 或部署记录；接入 Provider 后仍必须执行以下策略：

- `local` / `preview`: 可读日志，可操作自己创建的环境。
- `staging`: 可读日志，可触发受限 runbook。
- `production`: 默认只读；重启、扩容、配置、数据库变更必须审批。

AI 不应该直接 SSH 到生产机器，也不应该拥有绕过审计的 `kubectl`、数据库或云账号权限。

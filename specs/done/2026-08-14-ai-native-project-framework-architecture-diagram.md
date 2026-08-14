# SDD Spec: AI native project framework architecture diagram

- **Delivery Status**: done
- **Workflow Version**: 2
- **RIPER Phase**: Review
- **Approval Status**: Plan Approved
- **Owner**: helmy
- **Created**: 2026-08-14

## 0. Open Questions

- [x] None

## 1. Requirements (Context)

- **Goal**: 基于项目设计初衷和真实实现，生成一张准确、可复用的 AI 原生交付控制面架构图。
- **In-Scope**: 协作入口、Spec 真相源、Agent 角色、受控 CLI、能力注册表、平台边界、业务应用、共享包，以及审批、审计、脱敏和生产只读约束。
- **Out-of-Scope**: 具体业务技术栈、内部函数级流程、Provider 拓扑、动态动画、PNG/SVG 导出、生产操作。

### Acceptance Criteria

- 生成单文件 HTML，内嵌 CSS 与可访问 SVG，可在现代浏览器直接打开。
- 主图采用 Architecture 类型、doc-wide 尺寸、balanced 细节、mixed 受众和 minimal-light 风格。
- 主图不超过 9 个节点和 12 条连接；橙色焦点不超过 2 个；连接使用正交圆角路径。
- 准确区分 available、hook、planned；`ops logs` 明示为 `query-plan-only`。
- 图中不把自动技术栈识别、真实 Provider、生产执行器或耐久工作流误画为当前能力。
- Diagram Design 自检和浏览器视觉检查通过，验证证据回写本 Spec。

### Done Contract

- **Complete when**: HTML 架构图完成、自检与视觉检查通过、三轴 Review 为 PASS、Spec 进入 done。
- **Evidence**: 自检命令输出、浏览器桌面与窄窗口观察、最终文件路径、Review Matrix。
- **Still incomplete when**: 图面存在连接冲突、状态边界失真、可访问性缺口，或 Spec 尚未记录证据。

## 1.1 Context Sources

- Requirement Source: 用户请求“根据这个项目的设计初衷做一个架构设计图”。
- Design Refs: Diagram Design 默认 style guide；Architecture 类型规范。
- Chat/Business Refs: 2026-08-14 用户选择默认视觉基线并发送精确批准短语 `Plan Approved`。
- Extra Context: `README.md`、`docs/architecture.md`、`docs/workflow.md`、`docs/roadmap.md`、`.ai/roles/`、`.ai/rules/`、`platform/observability-gateway/` 与控制面实现。

## 1.5 Codemap Used (Feature/Project Index)

- Codemap Mode: project
- Codemap File: `docs/codemap/spec-workflow功能.md`
- Key Index:
  - Entry Points / Architecture Layers: `package.json`、`tools/project.mjs`、`apps/`、`packages/`、`platform/`、`specs/`、`.ai/`。
  - Core Logic / Cross-Module Flows: CLI 路由 -> Spec policy -> workflow kernel -> filesystem store -> Git reconciliation。
  - Dependencies / External Systems: 当前仅 Node.js 内建模块与 Git 管理的 Markdown；无真实 SCM、审批、数据库或观测 Provider。

## 1.6 Context Bundle Snapshot (Lite/Standard)

- Bundle Level: Standard
- Bundle File: None
- Key Facts: 项目当前是 AI 与人协作的本地交付控制面骨架；业务运行时独立拥有依赖；Markdown Spec 是完整状态、版本与历史的持久化载体；生产对 AI 默认只读。
- Open Questions: None

## 2. Research Findings

- 核心原则：AI 处理模糊工作；确定性和高风险操作留在软件控制内。
- 根 `package.json` 与 `tools/project.mjs` 属于工程控制面，不约束 `apps/<name>` 的业务技术栈。
- 当前可用能力包括 check、capability list、Spec new/list/transition 与只生成脱敏查询计划的 ops logs。
- dev status、test affected、preview create、deliver 仅为 hook；db plan/apply、config get 为 planned。
- Spec delivery state 与 RIPER engineering phase 是两个独立维度，不能在图中合并。
- 本地状态存于 `specs/{draft,ready,done}` Markdown；没有数据库、进程锁、耐久队列、事务日志或自动恢复服务。
- Observability Gateway 当前主要是策略和契约；真实 logs/traces/metrics/deploy Provider 尚未接入。
- 治理是横切约束：Spec truth、approval gate、audit evidence、redaction/RBAC 和 production read-only。
- 风险：若把 roadmap 与现状混画，会误导读者；通过实线/虚线和状态说明规避。

## 2.1 Next Actions

- 生成自包含 HTML/SVG 架构图。
- 执行结构、几何、可访问性和浏览器视觉验证。
- 回写证据并完成三轴 Review。

## 3. Innovate (Optional: Options & Decision)

- **Skipped**: false
- **Reason**: “按目录分层”与“按交付控制流”均可成立，但前者无法表达审批和安全边界。
- **Selected Strategy**: 使用主数据流为轴的 Architecture 图，以治理边界横切表达；目录只作为节点技术副标签。

## 4. Plan (Contract)

### 4.1 File Changes

- `specs/draft/2026-08-14-ai-native-project-framework-architecture-diagram.md`: 持久化需求、计划、批准、执行、验证与 Review 证据；按状态迁移到 ready/done。
- `docs/diagrams/ai-native-project-framework-architecture.html`: 新建自包含 HTML/SVG 架构图。

### 4.2 Signatures

- HTML contract: 单文件、内嵌 CSS、inline SVG、无脚本、无外部图片。
- SVG contract: `role="img"`，`aria-labelledby` 指向唯一前缀的 `<title>` 与 `<desc>`。
- Visual contract: 8 个核心节点、最多 12 条正交连接、2 个焦点、底部图例、实线/虚线状态语义。

### 4.3 Implementation Checklist

- [x] 创建 `docs/diagrams/` 与 HTML 架构图。
- [x] 完成 Diagram Design 自检与几何人工检查。
- [x] 完成桌面与窄窗口浏览器视觉检查。
- [x] 回写证据并完成三轴 Review。

### 4.4 Spec Review Notes (Optional Advisory)

- **Readiness Verdict**: Ready
- **Risks & Suggestions**: 主图严格限制节点数；未来能力只用虚线，不出现虚假 Provider 连接。
- **Phase Reminders**: Execute 仅限批准的 HTML 产物与 Spec 证据更新。
- **User Decision**: `Plan Approved` received on 2026-08-14.

## 5. Execute Log

- [x] 2026-08-14: Research 与 Plan 已持久化，精确批准已记录。
- [x] 2026-08-14: 生成 `docs/diagrams/ai-native-project-framework-architecture.html`，包含 8 个核心节点、7 条关系、2 个焦点和当前/未来状态图例。
- [x] 2026-08-14: Diagram Design 自检通过；完成桌面与 390px 窄窗口浏览器验证。
- [x] 2026-08-14: 验证证据与三轴 Review 已回写。

## 6. Validation & Review Verdict

### Verification Evidence

- Commands: `python3 /Users/fanghaoming/.claude/skills/diagram-design/scripts/self_check.py docs/diagrams/ai-native-project-framework-architecture.html` → `OK`。
- Screenshots: IDE 隔离浏览器完成 1440×900 桌面与 390×844 窄窗口视觉检查；未导出额外截图文件。
- Logs: 桌面视口 1440px 下 SVG 正常呈现；Google Fonts 状态为 loaded，Geist 与 Instrument Serif 均可用。390px 视口下 document `scrollWidth = clientWidth = 390`，图面容器 `clientWidth = 326`、`scrollWidth = 1040`、`overflow-x = auto`，页面无整体横向溢出，图面可独立横向浏览。
- Reviewer Notes: 8 个核心节点、7 条关系、2 个橙色焦点；当前能力使用实线，hook/受限路径使用虚线，`ops logs` 明示为 `query-plan-only`。SVG 包含有效 `role="img"` 与唯一前缀的 `aria-labelledby`。

### Review Matrix

| Axis | Key Checks | Verdict | Evidence |
| --- | --- | --- | --- |
| Spec Quality & Requirement Completion | Goal, scope, acceptance, completion | PASS | 单文件 HTML 架构图已完成；范围、现状/未来边界和验证证据齐全。 |
| Spec-Code Fidelity | Files, signatures, checklist, behavior | PASS | 仅新增批准的 HTML 并更新 Spec；图面规格、节点预算、状态语义与 Plan 一致。 |
| Code Intrinsic Quality | Correctness, robustness, maintainability, tests, risk | PASS | 自包含静态结构、可访问 SVG、响应式容器、结构自检与双视口视觉检查通过。 |

- **Overall Verdict**: PASS
- **Blocking Issues**: None
- **Regression Risk**: Low；新增静态文档，不改变控制面或业务运行时。
- **Follow-ups**: None

## 7. Plan-Execution Diff

- No deviation. 产物、图面语义、验证方法与批准 Plan 一致。

## 8. Change Log & Handoff

- 2026-08-14: Spec created in Research phase.
- 2026-08-14: Research and Plan persisted; exact approval `Plan Approved` recorded; RIPER phase advanced to Execute.
- 2026-08-14: HTML 架构图、自检、双视口视觉验证和三轴 Review 完成。
- **Current State**: done；验证与三轴 Review 均为 PASS。
- **Next Action**: None。
- **Recovery / Rollback Notes**: Remove only the new diagram file if rollback is required; preserve unrelated working-tree changes.

## 9. Archive Record (Optional at Closure)

- **Skipped**: false
- **Reason**: 架构图已交付，验证证据与 Review 结果完整，Spec 已通过受控命令转入 done。

## 10. Transition History

| Timestamp | From | To | Actor | Reason |
| --- | --- | --- | --- | --- |
| 2026-08-14T06:24:01.667Z | draft | ready | helmy | Plan Approved |
| 2026-08-14T06:38:12.148Z | ready | done | helmy | Architecture diagram verified and three-axis Review passed |

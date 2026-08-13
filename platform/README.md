# Platform

Platform modules define control-plane boundaries used by humans and AI agents.

Current implementation boundary:

- The available Spec workflow is a repository-local development tool in `tools/workflow/` and `tools/spec/`.
- It provides pure transition decisions, optional expected-version checks, Spec policy gates, Git-managed Markdown snapshots, and non-overwriting local file switches.
- It does not provide a local event store, process serialization, automatic recovery, general execution platform, distributed workflow durability, authenticated approval, or production mutation.
- `project deliver` remains a `hook`; Deployment and Runbook are domain contracts for future vertical slices, not implemented executors.

Planned or partial module boundaries:

- `auth`: future RBAC, service accounts, and approval policies; not implemented.
- `audit`: Markdown Transition History provides repository-local context; a general immutable audit service is not implemented.
- `workflow`: the local Spec collaboration flow is available; deploy and runbook workflows remain future work.
- `mcp`: controlled tool surface exposed to agents; adapters remain project-specific.
- `observability-gateway`: sanitized query planning exists; live Provider access is not implemented.

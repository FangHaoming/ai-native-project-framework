# Platform

Platform modules provide the control plane used by humans and AI agents.

Suggested modules:

- `auth`: RBAC, service accounts, approval policies.
- `audit`: immutable audit records for AI and human actions.
- `workflow`: durable state machines for specs, deploys, and runbooks.
- `mcp`: controlled tool surface exposed to agents.
- `observability-gateway`: sanitized logs, metrics, traces, and deploy history.

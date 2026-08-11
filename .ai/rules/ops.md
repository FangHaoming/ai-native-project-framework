# Ops Rules

- AI can read sanitized operational data through approved tools.
- AI cannot mutate production directly.
- All operational queries must be auditable.
- Query results should be scoped by service, environment, time window, and severity.
- PII and secrets must be redacted before reaching model context.

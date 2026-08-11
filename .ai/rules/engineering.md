# Engineering Rules

- Keep every AI change tied to a spec id.
- Prefer typed contracts at service boundaries.
- Prefer structured logs with `request_id`, `trace_id`, `service`, `env`, `version`, and `spec_id`.
- Keep migrations reversible or explicitly document why they are not.
- Treat tests, logs, screenshots, and reviewer comments as delivery evidence.

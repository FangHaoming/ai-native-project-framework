# Observability Gateway

This module is the boundary between AI agents and runtime systems.

It should expose read-only APIs such as:

```text
GET /logs?service=api&env=staging&since=30m&level=error
GET /traces/:trace_id
GET /metrics?service=api&window=1h
GET /deploys?service=api&env=prod
```

Required controls:

- RBAC by environment and service.
- PII and secret redaction.
- Query window and result-size limits.
- Audit record for every query.
- Production read-only by default.

The first implementation can proxy Loki, Elasticsearch, CloudWatch, Datadog, or Grafana APIs.

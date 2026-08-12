# Architecture

## Principle

AI should handle ambiguous work. Deterministic and risky operations should stay inside software controls.

## Layers

```text
Collaboration Portal
  -> Spec Workflow
  -> Agent Harness
  -> Controlled Tools
  -> Runtime Platform
  -> Governance and Observability
```

## Control Plane and Application Runtimes

The root `package.json` belongs to the project control plane. Its Node.js requirement exists to run `tools/project.mjs`; it does not constrain the language used by business applications.

```text
Root control plane
  -> controlled project workflow
  -> apps/<name>
       -> application-owned dependencies
       -> application-owned build, test, and runtime
```

Applications live under `apps/<name>` and may use Python, Java, Node.js, or another stack. Each application keeps its own dependency manifest, such as `pyproject.toml`, `pom.xml`, `build.gradle.kts`, or `package.json`. Business dependencies do not belong in the root control-plane manifest.

Automatic stack discovery and cross-language command dispatch are not implemented yet. They belong to the Real Stack Binding phase and must be added as explicit control-plane capabilities rather than inferred from this layout.

## Controlled Tools

The capability registry in `tools/project.mjs` is the source of truth for command maturity. Query it with:

```bash
project capability list
project capability list --json
```

Capabilities use exactly one status:

- `available`: the described local behavior is implemented.
- `hook`: the command exists but has no runtime or Provider adapter.
- `planned`: the command belongs to the target architecture but is not implemented.

Current contract:

```text
available
  project check
  project capability list
  project spec new
  project spec list
  project spec transition
  project ops logs          # query-plan-only

hook
  project dev status
  project test affected
  project preview create
  project deliver

planned
  project db plan
  project db apply
  project config get
```

Documentation must not promote a `hook` or `planned` command to operational capability. `project ops logs` currently builds a redacted read-only query plan; it does not query a live observability Provider.

## Production Safety

Production is read-only for AI by default. Any mutation must be represented as an auditable workflow:

```text
proposal -> approval -> runbook -> execution -> evidence -> rollback notes
```

# Apps

Place each independently runnable business application under `apps/<name>`.

Each application owns its dependency manifest, lockfile, build, test, and runtime configuration. The root `package.json` belongs to the project control plane and does not require application backends to use Node.js.

Examples:

- `apps/api-python`: Python API with `pyproject.toml` and an application lockfile.
- `apps/api-java`: Java API with `pom.xml` or `build.gradle.kts`.
- `apps/web`: web application with its own `package.json` and lockfile.
- `apps/admin`: operations console with its own stack-specific configuration.

The current framework does not automatically discover these manifests or dispatch cross-language test commands. Add that behavior later through explicit controlled-tool bindings.

# Workflow

## Change Lifecycle

```text
capture -> clarify -> specified -> approved -> implementing -> verifying -> human_acceptance -> review -> merged -> released
```

## Evidence

Every completed change should include:

- Spec id.
- Commit or PR.
- Test command and result.
- Relevant screenshots or logs.
- Known residual risk.

## Incident Lifecycle

```text
alert -> observe -> correlate -> hypothesize -> patch -> verify -> review -> release
```

AI can observe and correlate production data. It should not directly mutate production systems.

# Agent guide

Do not optimize for code volume. Optimize for engineering quality and explainability.

SignalGate is a showcase of incident classification: telemetry becomes context, a decision engine classifies it, and a deterministic policy chooses the action. Jev never executes an action.

Current work is **v0.1**, the in-memory path Incident → Jev → Decision → Policy → Response. Do not add PostgreSQL, Redis, OpenTelemetry, a benchmark runner, or an LLM engine in this phase.

Before implementing, follow `.cursor/skills/signalgate/SKILL.md`.

Decisions already recorded:

- `docs/adr/0001-separate-decision-from-policy.md`
- `docs/adr/0002-map-jev-primitives-into-domain-types.md`
- `docs/adr/0003-defer-postgres-redis-and-opentelemetry.md`
- `docs/adr/0004-use-fastify.md`

# Agent guide

Do not optimize for code volume. Optimize for engineering quality and explainability.

SignalGate classifies an incident, then a deterministic policy chooses the action. Jev never executes an action.

Current work is **v0.1**, the in-memory path Incident → Jev → Decision → Policy → Response. Do not add PostgreSQL, Redis, OpenTelemetry, a benchmark runner, or an LLM engine in this phase.

Guidelines live in four folders:

| Folder | Role |
| --- | --- |
| `.cursor/skills/` | Workflow for the agent. Local only, not versioned. |
| `.cursor/rules/` | Short constraints the editor applies. |
| `.cursor/context/` | Phase, domain, and Jev facts. |
| `.cursor/harness/` | DDD, logging, tests, and the definition of done. |

Start with `.cursor/context/project.md` and `.cursor/harness/done.md`.

Decisions already recorded:

- `docs/adr/0001-separate-decision-from-policy.md`
- `docs/adr/0002-map-jev-primitives-into-domain-types.md`
- `docs/adr/0003-defer-postgres-redis-and-opentelemetry.md`
- `docs/adr/0004-use-fastify.md`

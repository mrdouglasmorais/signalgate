# Roadmap

SignalGate grows in public slices. Each slice is small enough to explain, and each one leaves the repository in a state a reviewer can run.

| Version | Theme | Outcome |
| --- | --- | --- |
| v0.1 | Decision path | Incident → Jev → Decision → Policy → Response, in memory, 6–10 scenarios |
| v0.2 | Policy depth | Richer precedence, human-review reasons, branch coverage of the policy |
| v0.3 | Audit trail | PostgreSQL history that can be replayed |
| v0.4 | Observability | Traces and the evaluation metrics |
| v0.5 | Benchmark | Rules vs Jev on a fixed incident set |
| v0.6 | LLM comparison | A third engine, same policy, same fixtures |

## v0.1 acceptance

- An incident can be created, evaluated, and read back through the HTTP API.
- Evaluation calls Jev only inside `JevDecisionEngine`.
- Severity 0–100 is produced by a tested mapper.
- The policy precedence is unit-tested, including confidence below 0.60 overriding a page.
- Scenario fixtures cover the eight cases in `.cursor/context/domain.md`.
- The default test command does not need `TYPESAFE_API_KEY`.
- README shows one real request and one real decision taken from the running slice.

## Explicitly later

PostgreSQL, Redis, OpenTelemetry, dashboards, benchmark statistics, and any LLM client. Adding them during v0.1 is out of scope even if the dependency is easy to install.

Phase boundaries for agents live in `.cursor/context/phases.md`.

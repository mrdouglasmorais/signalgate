# 0003. Defer PostgreSQL, Redis, and OpenTelemetry

## Status

Accepted

## Context

The full brief includes PostgreSQL for audit history, Redis as an optional cache, and OpenTelemetry for traces and metrics. Building them in the first commit creates adapters, migrations, and dashboards before there is a decision worth auditing.

The quality bar is a small system that is real, not a diagram of every tool we know.

## Decision

v0.1 stores incidents and decision records in memory and logs with Pino. The process forgets state on restart. The README says so.

PostgreSQL arrives in v0.3, when the audit record has a stable shape. OpenTelemetry arrives in v0.4, when there is a duration and a set of actions worth measuring. Redis is not scheduled. Add it only after a measured hot path needs it.

Docker Compose arrives with the first infrastructure dependency that needs a container, not before.

## Consequences

- The first review is about domain, policy, and tests.
- A repository interface is postponed until PostgreSQL exists. The in-memory module is a concrete type.
- v0.3 will be a visible migration, which is a better public story than a database that never had data.
- Local demos cannot claim durability. That is an honest limit, not a hidden one.

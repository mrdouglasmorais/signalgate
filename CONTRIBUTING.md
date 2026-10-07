# Contributing

SignalGate is a public engineering showcase. Clarity beats volume.

## Current work

v0.1 only: Incident → Jev → Decision → Policy → Response, in memory. See [docs/roadmap.md](docs/roadmap.md).

Pull requests that add PostgreSQL, Redis, OpenTelemetry, a benchmark runner, or an LLM client before that slice is done will be closed with a pointer to the phase that owns them.

## Changes

- Keep business rules in the domain and application layers.
- Do not call Jev from a route handler.
- Read the installed `@typesafe-ai/sdk` types before changing the adapter. Do not invent response fields.
- Add or update tests for every policy, mapping, or validation change.
- Use Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`.

## Done

Implementation, strict types, passing tests, lint, and formatting. Update the README or `docs/` when public behavior or an architectural decision changes. New architectural decisions get an ADR in `docs/adr/`.

## Agent assistance

Guidelines are split into `.cursor/skills/` (local workflow), `.cursor/rules/`, `.cursor/context/`, and `.cursor/harness/`. The harness holds the DDD, logging, and test-coverage standards.

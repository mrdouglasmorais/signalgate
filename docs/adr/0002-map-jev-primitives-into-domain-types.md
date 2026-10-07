# 0002. Map Jev primitives into domain types

## Status

Accepted

## Context

The domain wants a severity from 0 to 100 and a confidence from 0 to 1. Jev does not return an arbitrary percentage. Its documented primitives are `choice`, `score`, and `noul`. A score is a value on an ordered legend of at most ten levels, and it may be fractional. Choice and score answers carry a confidence derived from the distribution.

Inventing a response field to match the domain model would make the showcase look typed while calling an API that does not exist.

## Decision

The Jev adapter asks two questions:

- `domain`, a `choice` over the six domain labels, including `unknown`
- `severity`, a `score` over a short impact legend

A pure function maps that score onto an integer 0–100. Confidence is aggregated only from properties present on the installed SDK types. Values outside 0–1, unknown labels, and missing answers are `DecisionEngineError`.

The adapter is written against `@typesafe-ai/sdk` as installed. Docs that drift from those types get fixed; the types are not cast away.

`noul` is unused in v0.1. The model id on each decision is a pinned id, not the moving `jev-latest` alias, once a live call is recorded.

## Consequences

- The domain stays stable if TypeSafe adds a field or renames a helper.
- Severity mapping is testable without the network.
- The legend is part of the product. Changing its wording can change scores, so legend edits belong with mapper tests and a note in the decision record's model context.
- Engineers must read the installed declarations before extending the adapter.

# 0004. Use Fastify for the HTTP API

## Status

Accepted

## Context

v0.1 needs a small JSON API: create an incident, evaluate it, read it back, and simulate a payload. The handlers must stay thin, validation must be explicit, and tests must run without binding a port.

## Decision

Use Fastify. Validate bodies and params with Zod. Exercise the API with `app.inject()` so integration tests stay in-process. Use Fastify's Pino logger rather than a second logger.

Errors thrown by the domain are mapped in one error handler. The response body is a code and a message.

## Consequences

- Route schemas and domain schemas can share Zod types, with a clear parse step at the edge.
- The test suite does not need Supertest.
- Fastify plugins are unnecessary in v0.1. Register routes on the app instance until a plugin boundary solves a real split.

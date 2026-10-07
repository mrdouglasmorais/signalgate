# Security

SignalGate treats model output as untrusted. A Jev answer cannot run a command, query a database, deploy, roll back, or change configuration. The Policy Engine returns an action label. v0.1 has no executor behind that label.

## Reporting

If you find a vulnerability, open a private security advisory on GitHub rather than a public issue. Include the version, the request you sent, and the behavior you observed. Do not include live API keys.

## Handling secrets

- `TYPESAFE_API_KEY` stays in the server environment. Do not commit it. `.env` is gitignored.
- Logs may include request id, incident id, engine name, severity, and confidence.
- Logs must not include the API key, authorization headers, or credentials copied into incident metadata.
- HTTP error responses omit stack traces.

## Dependencies

Live classification depends on TypeSafe. Their availability and data processing terms apply to any incident payload sent to `systemOne`. Scenario tests must not send fixtures to that API.

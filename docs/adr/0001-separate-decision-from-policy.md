# 0001. Separate probabilistic decision from deterministic policy

## Status

Accepted

## Context

The original sketch put `escalation` (`none`, `notify`, `page`) on the same structure Jev would fill, and then ran a policy over severity and confidence. That gives two authors for the action. A model can say `page` while the policy says `human_review`, and a reader cannot tell which one was obeyed.

Jev is useful because it classifies a state into types the application defined. It is a poor place to encode "page only when severity and confidence are both high," because that rule must be reviewed like code and must not change when the model changes.

## Decision

Jev answers classification questions: which domain owns the incident, and how severe it is.

`IncidentDecision` carries domain, severity, and confidence. It does not carry an action.

`PolicyEngine` is a pure function. First match wins:

1. confidence below 0.60 → `human_review`
2. domain `unknown` → `human_review`
3. severity at least 90 and confidence at least 0.90 → `page`
4. severity at least 70 → `notify`
5. otherwise → `none`

No model output executes a command. The only action values in v0.1 are those four labels.

## Consequences

- Policy tests do not need Jev, a network, or a fixture of prose.
- Swapping Jev for rules or an LLM does not rewrite the action rules.
- The decision record stores both the classification and the rule id that fired, so a later audit can replay the split.
- Escalation thresholds are now product decisions. Changing them is a code change with tests, not a prompt change.

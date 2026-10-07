export const POLICY_ACTIONS = ['none', 'notify', 'page', 'human_review'] as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[number];

export const POLICY_RULES = ['low-confidence', 'unknown-domain', 'page', 'notify', 'none'] as const;

export type PolicyRuleId = (typeof POLICY_RULES)[number];

export type PolicyOutcome = {
  readonly action: PolicyAction;
  readonly ruleId: PolicyRuleId;
};

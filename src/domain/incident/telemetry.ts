export type Telemetry = {
  readonly latency?: number;
  readonly errorRate?: number;
  readonly cpu?: number;
  readonly memory?: number;
  readonly queueDepth?: number;
  readonly statusCode?: number;
  readonly exception?: string;
  readonly logs?: readonly string[];
};

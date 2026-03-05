export interface SplunkWebhookPayload {
  result: {
    _raw?: string;
    raw?: string;
    host?: string;
    source?: string;
    sourcetype?: string;
    [key: string]: unknown;
  };
  sid?: string;
  search_name?: string;
}

export interface ServiceNowWebhookPayload {
  incident_number: string;
  short_description: string;
  description: string;
  ci: string; // Configuration item -> maps to repo
  priority: string;
  error_logs?: string;
  stack_trace?: string;
}

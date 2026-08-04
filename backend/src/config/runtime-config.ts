const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

export function environmentFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  return !FALSE_VALUES.has(value);
}

export function analyticsJobsEnabled(): boolean {
  return environmentFlag('ANALYTICS_JOBS_ENABLED', false);
}

export function pipelineModuleEnabled(): boolean {
  return environmentFlag('PIPELINE_MODULE_ENABLED', true);
}

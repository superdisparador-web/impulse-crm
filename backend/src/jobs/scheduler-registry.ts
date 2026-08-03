const registryKey = Symbol.for('impulse-crm.scheduler-registry');
type SchedulerRegistry = Map<string, object>;

function registry(): SchedulerRegistry {
  const globalState = globalThis as typeof globalThis & { [registryKey]?: SchedulerRegistry };
  return globalState[registryKey] ??= new Map();
}

export function acquireScheduler(name: string, owner: object) {
  if (registry().has(name)) return false;
  registry().set(name, owner);
  return true;
}

export function releaseScheduler(name: string, owner: object) {
  if (registry().get(name) === owner) registry().delete(name);
}


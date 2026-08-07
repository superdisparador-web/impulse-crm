const finalStatuses = new Set([
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "CANCELED",
  "FAILED",
]);
export function shouldPollCampaign(status, hidden) {
  return Boolean(status) && !hidden && !finalStatuses.has(status);
}
export function primaryCampaignAction(status) {
  if (status === "DRAFT") return "validate";
  if (status === "READY") return "start";
  if (status === "QUEUED" || status === "RUNNING") return "pause";
  if (status === "PAUSED") return "resume";
  return null;
}
export function canCancelCampaign(status) {
  return ["SCHEDULED", "QUEUED", "RUNNING", "PAUSED"].includes(status);
}

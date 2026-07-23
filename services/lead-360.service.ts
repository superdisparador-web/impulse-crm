import { leadService } from "@/services/lead.service";
import { Lead, LeadActivityFormData, LeadFormData } from "@/types/lead";

export function getLead360(leadId: string) {
  return leadService.getById(leadId);
}

export function updateLead360(leadId: string, data: Partial<LeadFormData>) {
  return leadService.update(leadId, data);
}

export function archiveLead360(leadId: string) {
  return fetchArchive(leadId);
}

export function createLead360Activity(leadId: string, data: LeadActivityFormData) {
  return leadService.createActivity(leadId, data);
}

async function fetchArchive(leadId: string): Promise<Lead> {
  return leadService.updateStatus(leadId, "ARCHIVED");
}

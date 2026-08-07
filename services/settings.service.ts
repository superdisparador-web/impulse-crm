import { api } from "./api";
import type {
  AuditEntry,
  IntegrationStatus,
  OrganizationSettings,
  PermissionMatrix,
  SettingsMe,
} from "@/types/settings";
const patch = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(data) });
export const settingsService = {
  me: () => api.get<SettingsMe>("/settings/me"),
  updateMe: (data: unknown) => patch<SettingsMe>("/settings/me", data),
  organization: () => api.get<OrganizationSettings>("/settings/organization"),
  updateOrganization: (data: unknown) =>
    patch<OrganizationSettings>("/settings/organization", data),
  permissions: () => api.get<PermissionMatrix>("/settings/permissions"),
  security: () => api.get<Record<string, unknown>>("/settings/security"),
  updateSecurity: (data: unknown) => patch("/settings/security", data),
  notifications: () => api.get<SettingsMe>("/settings/notifications"),
  updateNotifications: (data: unknown) =>
    patch<SettingsMe>("/settings/notifications", data),
  branding: () => api.get<Record<string, unknown>>("/settings/branding"),
  updateBranding: (data: unknown) => patch("/settings/branding", data),
  operations: () => api.get<Record<string, unknown>>("/settings/operations"),
  updateOperations: (data: unknown) => patch("/settings/operations", data),
  integrations: () => api.get<IntegrationStatus>("/settings/integrations"),
  audit: () => api.get<AuditEntry[]>("/settings/audit"),
  system: () => api.get<Record<string, unknown>>("/settings/system"),
  updateSystem: (data: unknown) => patch("/settings/system", data),
};

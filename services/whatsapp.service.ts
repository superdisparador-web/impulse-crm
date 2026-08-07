import { api } from "./api";
import {
  ManualWhatsappAccountFormData,
  PaginatedWhatsappAccounts,
  SyncWhatsappTemplatesData,
  WhatsappAccount,
  WhatsappAccountFormData,
  WhatsappListParams,
  WhatsappTemplate,
} from "@/types/whatsapp";

function toQueryString(params: WhatsappListParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

class WhatsappService {
  /**
   * O backend cria e armazena o estado OAuth.
   * Apenas a URL temporária da Meta chega ao navegador.
   */
  startEmbeddedSignup() {
    return api.post<{
      authorizationUrl: string;
      expiresAt: string;
    }>("/whatsapp/embedded-signup/session", {
      returnUrl: `${window.location.origin}/whatsapp`,
    });
  }

  completeEmbeddedSignup(code: string, state: string) {
    return api.post<{
      accountsConnected: number;
    }>("/whatsapp/embedded-signup/complete", {
      code,
      state,
    });
  }

  getAccounts(params: WhatsappListParams = {}) {
    return api.get<PaginatedWhatsappAccounts>(
      `/whatsapp/accounts${toQueryString(params)}`,
    );
  }

  createAccount(data: WhatsappAccountFormData) {
    const { credential, ...rest } = data;

    return api.post<WhatsappAccount>("/whatsapp/accounts", {
      ...rest,
      accessToken: credential,
    });
  }

  createManualAccount(data: ManualWhatsappAccountFormData) {
    return api.post<WhatsappAccount>(
      "/whatsapp/admin/accounts/manual",
      data,
    );
  }

  updateAccount(
    id: string,
    data: Pick<
      WhatsappAccountFormData,
      "name" | "phoneNumber" | "apiVersion"
    >,
  ) {
    return api<WhatsappAccount>(`/whatsapp/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  updateAccessToken(id: string, accessToken: string) {
    return api<WhatsappAccount>(`/whatsapp/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        accessToken,
      }),
    });
  }

  updateStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    return api<WhatsappAccount>(`/whatsapp/accounts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    });
  }

  setDefault(id: string) {
    return api<WhatsappAccount>(`/whatsapp/accounts/${id}/default`, {
      method: "PATCH",
    });
  }

  testAccount(id: string) {
    return api.post<WhatsappAccount>(
      `/whatsapp/accounts/${id}/test`,
      {},
    );
  }

  syncAccount(id: string) {
    return api.post<WhatsappAccount>(
      `/whatsapp/accounts/${id}/sync`,
      {},
    );
  }

  /**
   * Envia um template de teste utilizando a API oficial da Meta.
   */
  sendTest(
    accountId: string,
    data: {
      phone: string;
      templateId: string;
      components?: unknown[];
    },
  ) {
    return api.post<{
      success: boolean;
      status: string;
      phone: string;
      templateId: string;
      templateName: string;
      externalMessageId: string;
    }>(
      `/whatsapp/accounts/${accountId}/send-test`,
      data,
    );
  }

  async deleteAccount(id: string) {
    await api.delete<{
      success: boolean;
    }>(`/whatsapp/accounts/${id}`);
  }

  restoreAccount(id: string) {
    return api<WhatsappAccount>(`/whatsapp/accounts/${id}/restore`, {
      method: "PATCH",
    });
  }

  getTemplates(params: WhatsappListParams = {}) {
    return api.get<WhatsappTemplate[]>(
      `/whatsapp/templates${toQueryString(params)}`,
    );
  }

  syncTemplates(data: SyncWhatsappTemplatesData) {
    return api.post<{
      success: boolean;
      count: number;
    }>("/whatsapp/templates/sync", data);
  }
}

export const whatsappService = new WhatsappService();
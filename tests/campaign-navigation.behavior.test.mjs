import assert from "node:assert/strict";
import test from "node:test";
import { loadComponent } from "./react-component-loader.mjs";
const { nextStep, previousStep, completedStepTarget, campaignContinueReason } =
  loadComponent("components/campaigns/wizard/campaign-navigation.ts");
const base = {
  step: 1,
  audienceMode: "MANUAL",
  audienceValid: false,
  listConfirmed: false,
  segmentMaterialized: false,
  templateAvailable: false,
  mappingsValid: false,
  destinationConfigured: false,
  reviewed: false,
};
test("avança, volta e impede acesso a etapa futura", () => {
  assert.equal(nextStep(1), 2);
  assert.equal(nextStep(7), 7);
  assert.equal(previousStep(3), 2);
  assert.equal(previousStep(1), 1);
  assert.equal(completedStepTarget(4, 2), 2);
  assert.equal(completedStepTarget(4, 6), 4);
});
test("bloqueia cada etapa inválida e libera após correção", () => {
  assert.equal(
    campaignContinueReason({ ...base, step: 2 }),
    "Adicione pelo menos um destinatário válido.",
  );
  assert.equal(
    campaignContinueReason({
      ...base,
      step: 2,
      audienceValid: true,
      listConfirmed: true,
    }),
    undefined,
  );
  assert.equal(
    campaignContinueReason({ ...base, step: 3 }),
    "Selecione um template aprovado.",
  );
  assert.equal(
    campaignContinueReason({ ...base, step: 3, templateAvailable: true }),
    "Preencha todas as variáveis obrigatórias.",
  );
  assert.equal(
    campaignContinueReason({
      ...base,
      step: 3,
      templateAvailable: true,
      mappingsValid: true,
    }),
    undefined,
  );
  assert.equal(
    campaignContinueReason({ ...base, step: 4 }),
    "Configure o destino da campanha.",
  );
  assert.equal(
    campaignContinueReason({ ...base, step: 5 }),
    "Confirme a revisão da campanha.",
  );
});
test("serviço persiste e restaura draft e público manual nos endpoints corretos", async () => {
  const calls = [],
    api = {
      get: async (path) => {
        calls.push(["GET", path]);
        return { id: "draft" };
      },
      post: async (path, body) => {
        calls.push(["POST", path, body]);
        return { valid: 1 };
      },
      delete: async () => ({}),
      blob: async () => new Blob(),
    };
  api.api = async (path, init) => {
    calls.push([init.method, path, JSON.parse(init.body)]);
    return { id: "draft" };
  };
  const loaded = loadComponent("services/campaigns.service.ts", {
    "./api": { api: Object.assign((...args) => api.api(...args), api) },
  });
  await loaded.campaignsService.updateCampaign("draft", { name: "Campanha" });
  await loaded.campaignsService.saveStep("draft", 2);
  await loaded.campaignsService.saveManualRecipients("draft", [
    { name: "Ana", phone: "+5511954325801" },
  ]);
  await loaded.campaignsService.getManualRecipients("draft");
  assert.deepEqual(
    calls.map((x) => x.slice(0, 2)),
    [
      ["PATCH", "/campaigns/draft"],
      ["PATCH", "/campaigns/draft/step"],
      ["POST", "/campaigns/draft/audience/manual"],
      ["GET", "/campaigns/draft/audience/manual"],
    ],
  );
});

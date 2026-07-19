"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/ui/Modal";
import AgentForm from "@/components/agents/AgentForm";
import AgentTable from "@/components/agents/AgentTable";

import { agentService } from "@/services/agent.service";
import { Agent } from "@/types/agent";

export default function ContactsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function loadAgents() {
    try {
      setLoading(true);
      setError("");

      const data = await agentService.getAll();

      setAgents(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os agentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  function handleCloseModal() {
    setModalOpen(false);
  }

  function handleSave() {
    console.log("Salvar agente");

    setModalOpen(false);

    loadAgents();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Agentes</h1>

          <p className="mt-2 text-slate-400">
            Total de agentes: {agents.length}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-blue-600 px-5 py-3 transition hover:bg-blue-700"
        >
          Novo Agente
        </button>
      </div>

      <AgentTable
        agents={agents}
        loading={loading}
        error={error}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Novo Agente"
        width="lg"
      >
        <AgentForm
          onCancel={handleCloseModal}
          onSave={handleSave}
        />
      </Modal>
    </main>
  );
}
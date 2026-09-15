import type { Step } from "../domain/step.ts";
import type { StepRepo } from "./types.ts";

export function createFakeStepRepo(initState: Record<string, Step>): StepRepo {
  const state = new Map(Object.entries(initState));

  return {
    async create(input) {
      const created: Step = { ...input, id: crypto.randomUUID() };
      state.set(created.id, created);
      return created;
    },
    async getById(id) {
      return state.get(id);
    },
    async getByQrToken(token) {
      return [...state.values()].find((step) => step.qrToken === token);
    },
    async listByCaseId(caseId) {
      return [...state.values()]
        .filter((step) => step.caseId === caseId)
        .sort((left, right) => left.order - right.order);
    },
    async update(id, input) {
      const existing = state.get(id);
      if (!existing) throw new Error(`no step with id=${id}`);
      const updated: Step = { ...existing, ...input, id };
      state.set(id, updated);
      return updated;
    },
    async delete(id) {
      state.delete(id);
    },
    async deleteByCaseId(caseId) {
      for (const [id, step] of state) {
        if (step.caseId === caseId) state.delete(id);
      }
    },
    async nextOrder(caseId) {
      const orders = [...state.values()]
        .filter((step) => step.caseId === caseId)
        .map((step) => step.order);
      return orders.length === 0 ? 0 : Math.max(...orders) + 1;
    },
  } satisfies StepRepo;
}

export default createFakeStepRepo;

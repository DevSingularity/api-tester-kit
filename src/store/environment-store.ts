import { create } from "zustand";
import type { Environment } from "@/types";
import { generateId } from "@/utils";

interface EnvironmentStore {
  environments: Environment[];
  activeEnvironmentId: string | null;
  globalVariables: Record<string, string>;

  createEnvironment: (name: string) => string;
  deleteEnvironment: (id: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  setActiveEnvironment: (id: string | null) => void;
  setVariable: (envId: string, key: string, value: string) => void;
  deleteVariable: (envId: string, key: string) => void;
  setGlobalVariable: (key: string, value: string) => void;
  getActiveVariables: () => Record<string, string>;
  resolveVariables: (template: string) => string;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,
  globalVariables: {},

  createEnvironment: (name) => {
    const env: Environment = {
      id: generateId(),
      name,
      variables: {},
      isSecret: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      environments: [...state.environments, env],
    }));

    return env.id;
  },

  deleteEnvironment: (id) =>
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironmentId:
        state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
    })),

  updateEnvironment: (id, updates) =>
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e
      ),
    })),

  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  setVariable: (envId, key, value) =>
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === envId
          ? {
              ...e,
              variables: { ...e.variables, [key]: value },
              updatedAt: new Date().toISOString(),
            }
          : e
      ),
    })),

  deleteVariable: (envId, key) =>
    set((state) => ({
      environments: state.environments.map((e) => {
        if (e.id !== envId) return e;
        const { [key]: _, ...rest } = e.variables;
        return { ...e, variables: rest, updatedAt: new Date().toISOString() };
      }),
    })),

  setGlobalVariable: (key, value) =>
    set((state) => ({
      globalVariables: { ...state.globalVariables, [key]: value },
    })),

  getActiveVariables: () => {
    const state = get();
    if (!state.activeEnvironmentId) return state.globalVariables;
    const env = state.environments.find(
      (e) => e.id === state.activeEnvironmentId
    );
    return { ...state.globalVariables, ...(env?.variables ?? {}) };
  },

  resolveVariables: (template) => {
    const vars = get().getActiveVariables();
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  },
}));

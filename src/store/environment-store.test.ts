import { describe, it, expect, beforeEach } from "vitest";
import { useEnvironmentStore } from "@/store/environment-store";

describe("EnvironmentStore", () => {
  beforeEach(() => {
    const store = useEnvironmentStore.getState();
    store.environments.forEach((env) => store.deleteEnvironment(env.id));
    Object.keys(store.globalVariables).forEach((key) =>
      store.setGlobalVariable(key, "")
    );
  });

  it("creates an environment", () => {
    const { createEnvironment } = useEnvironmentStore.getState();
    createEnvironment("Development");

    const state = useEnvironmentStore.getState();
    expect(state.environments.length).toBe(1);
    expect(state.environments[0].name).toBe("Development");
    expect(state.environments[0].variables).toEqual({});
  });

  it("deletes an environment", () => {
    const { createEnvironment } = useEnvironmentStore.getState();
    const id = createEnvironment("Test");

    useEnvironmentStore.getState().deleteEnvironment(id);

    const state = useEnvironmentStore.getState();
    expect(state.environments.length).toBe(0);
  });

  it("sets active environment", () => {
    const { createEnvironment, setActiveEnvironment } = useEnvironmentStore.getState();
    const id = createEnvironment("Production");

    setActiveEnvironment(id);

    const state = useEnvironmentStore.getState();
    expect(state.activeEnvironmentId).toBe(id);
  });

  it("sets variables in environment", () => {
    const { createEnvironment, setVariable } = useEnvironmentStore.getState();
    const id = createEnvironment("Dev");

    setVariable(id, "host", "localhost:3000");

    const state = useEnvironmentStore.getState();
    expect(state.environments[0].variables.host).toBe("localhost:3000");
  });

  it("deletes variables from environment", () => {
    const { createEnvironment, setVariable, deleteVariable } = useEnvironmentStore.getState();
    const id = createEnvironment("Dev");
    setVariable(id, "host", "localhost:3000");

    deleteVariable(id, "host");

    const state = useEnvironmentStore.getState();
    expect(state.environments[0].variables.host).toBeUndefined();
  });

  it("sets global variables", () => {
    const { setGlobalVariable } = useEnvironmentStore.getState();
    setGlobalVariable("app_name", "API Tester");

    const state = useEnvironmentStore.getState();
    expect(state.globalVariables.app_name).toBe("API Tester");
  });

  it("getActiveVariables returns env variables merged with globals", () => {
    const { createEnvironment, setActiveEnvironment, setVariable, setGlobalVariable } =
      useEnvironmentStore.getState();

    setGlobalVariable("app", "tester");
    const id = createEnvironment("Dev");
    setVariable(id, "host", "localhost");
    setActiveEnvironment(id);

    const vars = useEnvironmentStore.getState().getActiveVariables();
    expect(vars.host).toBe("localhost");
    expect(vars.app).toBe("tester");
  });

  it("resolveVariables replaces template strings", () => {
    const { setGlobalVariable, resolveVariables } = useEnvironmentStore.getState();
    setGlobalVariable("host", "api.test.com");

    const result = resolveVariables("https://{{host}}/users");
    expect(result).toBe("https://api.test.com/users");
  });

  it("resolveVariables leaves missing vars as-is", () => {
    const { resolveVariables } = useEnvironmentStore.getState();
    const result = resolveVariables("{{missing_var}}");
    expect(result).toBe("{{missing_var}}");
  });

  it("updates environment name", () => {
    const { createEnvironment, updateEnvironment } = useEnvironmentStore.getState();
    const id = createEnvironment("Old Name");

    updateEnvironment(id, { name: "New Name" });

    const state = useEnvironmentStore.getState();
    expect(state.environments[0].name).toBe("New Name");
  });
});

import type { ApiResponse, ApiRequest } from "@/types";

interface AssertionChain {
  toBe: (expected: unknown) => void;
  toBeDefined: () => void;
  toBeUndefined: () => void;
  toBeNull: () => void;
  toBeTruthy: () => void;
  toBeFalsy: () => void;
  toEqual: (expected: unknown) => void;
  toContain: (expected: string) => void;
  toBeLessThan: (expected: number) => void;
  toBeGreaterThan: (expected: number) => void;
  toHaveProperty: (key: string) => void;
}

interface ScriptResult {
  success: boolean;
  logs: string[];
  errors: string[];
  variables: Record<string, string>;
  assertions: { passed: number; failed: number; messages: string[] };
}

function createExpect(
  assertions: { passed: number; failed: number; messages: string[] }
): (value: unknown) => AssertionChain {
  return (value: unknown) => {
    const chain: AssertionChain = {
      toBe: (expected) => {
        if (value === expected) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`);
        }
      },
      toBeDefined: () => {
        if (value !== undefined) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push("Expected value to be defined");
        }
      },
      toBeUndefined: () => {
        if (value === undefined) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected value to be undefined, got ${JSON.stringify(value)}`);
        }
      },
      toBeNull: () => {
        if (value === null) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected value to be null, got ${JSON.stringify(value)}`);
        }
      },
      toBeTruthy: () => {
        if (value) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${JSON.stringify(value)} to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (!value) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${JSON.stringify(value)} to be falsy`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(value) === JSON.stringify(expected)) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(
            `Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`
          );
        }
      },
      toContain: (expected) => {
        if (typeof value === "string" && value.includes(expected)) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${JSON.stringify(value)} to contain "${expected}"`);
        }
      },
      toBeLessThan: (expected) => {
        if (typeof value === "number" && value < expected) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${value} to be less than ${expected}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (typeof value === "number" && value > expected) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected ${value} to be greater than ${expected}`);
        }
      },
      toHaveProperty: (key) => {
        if (typeof value === "object" && value !== null && key in value) {
          assertions.passed++;
        } else {
          assertions.failed++;
          assertions.messages.push(`Expected object to have property "${key}"`);
        }
      },
    };
    return chain;
  };
}

export function executeScript(
  script: string,
  context: {
    request: ApiRequest;
    response: ApiResponse | null;
    variables: Record<string, string>;
  }
): ScriptResult {
  const result: ScriptResult = {
    success: true,
    logs: [],
    errors: [],
    variables: { ...context.variables },
    assertions: { passed: 0, failed: 0, messages: [] },
  };

  const logs: string[] = [];
  const errors: string[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
  };

  const expect = createExpect(result.assertions);

  try {
    const wrappedScript = `
      return (function(console, expect, vars) {
        ${script}
      })(sandboxConsole, expect, vars);
    `;

    const fn = new Function("sandboxConsole", "expect", "vars", wrappedScript);
    fn(sandboxConsole, expect, result.variables);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Script execution failed");
    result.success = false;
  }

  result.logs = logs;
  result.errors = [...result.errors, ...errors];

  if (result.assertions.failed > 0) {
    result.success = false;
  }

  return result;
}

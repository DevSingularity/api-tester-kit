# Scripting

## Overview

The scripting system provides a sandboxed JavaScript execution environment for pre-request and post-request scripts. It includes a custom assertion framework for testing API responses.

## File: `src/lib/script-runner.ts`

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Script Editor UI                     │
│  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Pre-request      │  │ Test Script          │  │
│  │ Script           │  │ (post-response)      │  │
│  └────────┬────────┘  └──────────┬──────────┘  │
│           │                      │              │
└───────────┼──────────────────────┼──────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────┐
│           executeScript() Function                │
│                                                  │
│  1. Create sandbox console                       │
│  2. Create expect() function                     │
│  3. Wrap script in IIFE                          │
│  4. Execute via new Function()                   │
│  5. Collect logs, errors, assertions             │
│                                                  │
└─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────┐
│              ScriptResult                        │
│  {                                               │
│    success: boolean,                             │
│    logs: string[],                               │
│    errors: string[],                             │
│    variables: Record<string, string>,            │
│    assertions: { passed, failed, messages }      │
│  }                                               │
└─────────────────────────────────────────────────┘
```

## Script Execution

### `executeScript(script, context): ScriptResult`

```typescript
interface ScriptContext {
  request: ApiRequest;        // Current request
  response: ApiResponse | null;  // Response (null for pre-request)
  variables: Record<string, string>;  // Environment variables
}

interface ScriptResult {
  success: boolean;
  logs: string[];
  errors: string[];
  variables: Record<string, string>;
  assertions: {
    passed: number;
    failed: number;
    messages: string[];
  };
}
```

### Sandbox Environment

The script runs in a sandboxed function with:

| Variable | Description |
|---|---|
| `console.log()` | Capture output to logs array |
| `console.warn()` | Capture warnings with [WARN] prefix |
| `console.error()` | Capture errors to errors array |
| `expect()` | Assertion function (see below) |
| `vars` | Mutable environment variables |

### Execution Mechanism

```typescript
const wrappedScript = `
  return (function(console, expect, vars) {
    ${script}
  })(sandboxConsole, expect, vars);
`;

const fn = new Function("sandboxConsole", "expect", "vars", wrappedScript);
fn(sandboxConsole, expect, result.variables);
```

**Security Notes**:
- Scripts run in an isolated function scope
- No access to `window`, `document`, or other browser APIs
- `new Function()` is used instead of `eval()` for better isolation
- Errors are caught and returned as structured results

---

## Assertion Framework

### `expect(value)` API

The `expect()` function returns a chain of assertion methods:

| Method | Description | Example |
|---|---|---|
| `toBe(expected)` | Strict equality (`===`) | `expect(status).toBe(200)` |
| `toBeDefined()` | Value is not undefined | `expect(body.id).toBeDefined()` |
| `toBeUndefined()` | Value is undefined | `expect(body.deleted).toBeUndefined()` |
| `toBeNull()` | Value is null | `expect(body.error).toBeNull()` |
| `toBeTruthy()` | Value is truthy | `expect(body.active).toBeTruthy()` |
| `toBeFalsy()` | Value is falsy | `expect(body.deleted).toBeFalsy()` |
| `toEqual(expected)` | Deep equality (JSON compare) | `expect(body).toEqual({...})` |
| `toContain(expected)` | String contains substring | `expect(body.name).toContain("John")` |
| `toBeLessThan(expected)` | Number less than | `expect(time).toBeLessThan(500)` |
| `toBeGreaterThan(expected)` | Number greater than | `expect(body.count).toBeGreaterThan(0)` |
| `toHaveProperty(key)` | Object has property | `expect(body).toHaveProperty("id")` |

### Assertion Implementation

```typescript
function createExpect(assertions) {
  return (value) => ({
    toBe: (expected) => {
      if (value === expected) {
        assertions.passed++;
      } else {
        assertions.failed++;
        assertions.messages.push(
          `Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`
        );
      }
    },
    // ... other methods
  });
}
```

### Assertion Results

```typescript
{
  passed: 3,    // Number of passing assertions
  failed: 1,    // Number of failing assertions
  messages: [
    "Expected 404 to be 200"  // Failure messages
  ]
}
```

---

## Pre-request Scripts

Run **before** the HTTP request is sent. Use cases:

### Setting Dynamic Variables

```javascript
vars.TIMESTAMP = Date.now();
vars.REQUEST_ID = crypto.randomUUID();
console.log('Request ID:', vars.REQUEST_ID);
```

### Request Validation

```javascript
if (!vars.TOKEN) {
  console.error('Authentication token is required');
}
```

### Logging

```javascript
console.log('Sending request to:', vars.BASE_URL);
console.log('Method:', request.method);
```

---

## Test Scripts (Post-request)

Run **after** the response is received. Use cases:

### Status Code Validation

```javascript
expect(response.status).toBe(200);
```

### Response Time Check

```javascript
expect(response.time).toBeLessThan(500);
```

### Response Body Validation

```javascript
expect(response.body).toBeDefined();
expect(response.body).toHaveProperty('id');
expect(response.body.id).toBeGreaterThan(0);
```

### Complex Assertions

```javascript
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('users');
expect(response.body.users).toBeDefined();
expect(response.body.total).toBeGreaterThan(0);
expect(response.time).toBeLessThan(1000);
console.log('All tests passed!');
```

### Error Response Testing

```javascript
expect(response.status).toBe(404);
expect(response.body).toHaveProperty('error');
expect(response.body.error).toContain('not found');
```

---

## Script Editor UI

**File**: `src/features/request-builder/components/script-editor.tsx`

### Layout

```
┌─────────────────────────────────────────────────┐
│ Pre-request Script                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ // Runs before the request is sent          │ │
│ │ console.log('Preparing request...');        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Test Script                        [Run Tests]  │
│ ┌─────────────────────────────────────────────┐ │
│ │ expect(response.status).toBe(200);          │ │
│ │ expect(response.body).toBeDefined();        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ✓ 2 passed  ✗ 1 failed                     │ │
│ │                                             │ │
│ │ ✗ Expected 404 to be 200                   │ │
│ │ › Request sent successfully                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Available in scripts:                           │
│ response.status, response.body, response.headers│
│ expect(value).toBe(), .toEqual(), .toContain()  │
└─────────────────────────────────────────────────┘
```

### Features

1. **Dual Editor**: Separate textareas for pre-request and test scripts
2. **Run Tests Button**: Only enabled when response exists
3. **Results Panel**: Shows passed/failed badges, error messages, logs
4. **Help Text**: Lists available variables and assertion methods

### Running Tests

1. User writes test script
2. Clicks "Run Tests" button
3. `executeScript()` is called with current request/response
4. Results are displayed:
   - Green badge: "N passed"
   - Red badge: "N failed" (if any failures)
   - Error messages with details
   - Console log output

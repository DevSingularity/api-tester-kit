import type { Collection, ApiRequest } from "@/types";

interface MockEndpoint {
  method: string;
  path: string;
  response: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
  };
  delay?: number;
}

function requestToEndpoint(request: ApiRequest): MockEndpoint {
  let path = "/";
  try {
    const url = new URL(request.url);
    path = url.pathname;
  } catch {
    path = request.url.startsWith("/") ? request.url : `/${request.url}`;
  }

  let responseBody: unknown = {};
  if (request.body.raw) {
    try {
      responseBody = JSON.parse(request.body.raw);
    } catch {
      responseBody = { message: request.body.raw };
    }
  }

  return {
    method: request.method.toLowerCase(),
    path,
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: responseBody,
    },
  };
}

export function generateExpressMockServer(collection: Collection): string {
  const endpoints: MockEndpoint[] = [];

  for (const request of collection.requests) {
    endpoints.push(requestToEndpoint(request));
  }

  const routes = endpoints
    .map(
      (ep) => `
app.${ep.method}('${ep.path}', (req, res) => {
  ${ep.delay ? `setTimeout(() => {` : ""}
  res.status(${ep.response.status}).json(${JSON.stringify(ep.response.body, null, 2)});
  ${ep.delay ? `}, ${ep.delay});` : ""}`
    )
    .join("\n");

  return `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock server generated from collection: ${collection.name}
// Generated at: ${new Date().toISOString()}

${routes}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Mock server running on http://localhost:\${PORT}\`);
});
`;
}

export function generateHonoMockServer(collection: Collection): string {
  const endpoints: MockEndpoint[] = [];

  for (const request of collection.requests) {
    endpoints.push(requestToEndpoint(request));
  }

  const routes = endpoints
    .map(
      (ep) => `
app.${ep.method}('${ep.path}', (c) => {
  ${ep.delay ? `await new Promise(r => setTimeout(r, ${ep.delay}));` : ""}
  return c.json(${JSON.stringify(ep.response.body, null, 2)});
})`
    )
    .join("\n");

  return `import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

// Mock server generated from collection: ${collection.name}
// Generated at: ${new Date().toISOString()}

${routes}

export default app;
`;
}

export function generateMockServerFromCollection(
  collection: Collection,
  framework: "express" | "hono" = "express"
): string {
  if (framework === "hono") {
    return generateHonoMockServer(collection);
  }
  return generateExpressMockServer(collection);
}

export function generateMockDataSchema(collection: Collection): MockEndpoint[] {
  const endpoints: MockEndpoint[] = [];

  for (const request of collection.requests) {
    endpoints.push(requestToEndpoint(request));
  }

  return endpoints;
}

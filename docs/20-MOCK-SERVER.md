# Mock Server Generator

## Overview

Generate mock server code from collections. Supports Express.js and Hono frameworks. Useful for frontend development, testing, and demos when the real API is unavailable.

## Access

Navigate to **Settings → Mock Server** section.

## Features

- **Express.js code generation**: Generates a complete Express server with routes
- **Hono code generation**: Generates a lightweight Hono server
- **One-click copy**: Copy generated code to clipboard
- **Download**: Download generated code as a file
- **Collection-based**: Generates routes from collection requests

## Supported Frameworks

| Framework | Language | Description |
|---|---|---|
| Express | JavaScript | Full-featured Node.js web framework |
| Hono | TypeScript | Ultrafast web framework for edge runtimes |

## Usage

1. Go to **Settings** page
2. Scroll to **Mock Server** section
3. Select a collection from the dropdown
4. Choose a framework (Express or Hono)
5. Click **Generate**
6. Copy or download the generated code

## Generated Code Example (Express)

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock server generated from collection: My API
// Generated at: 2026-07-18T12:00:00.000Z

app.get('/users', (req, res) => {
  res.status(200).json([
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ]);
});

app.post('/users', (req, res) => {
  res.status(201).json({ "id": 3, ...req.body });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
```

## Generated Code Example (Hono)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

// Mock server generated from collection: My API

app.get('/users', (c) => {
  return c.json([
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ]);
});

app.post('/users', (c) => {
  return c.json({ "id": 3, ...c.req.json() });
});

export default app;
```

## Running Generated Server

### Express

```bash
npm install express cors
node mock-server.js
```

### Hono

```bash
npm install hono @hono/node-server
npx tsx mock-server.ts
```

## Implementation

- **Generator**: `src/lib/mock-server-generator.ts`
- **UI**: `src/components/mock-server-generator.tsx`
- **Location**: Settings page

## Limitations

- Only generates routes from collection requests
- No dynamic response generation (uses static JSON from request body)
- No authentication/authorization simulation
- No request validation
- No file upload simulation

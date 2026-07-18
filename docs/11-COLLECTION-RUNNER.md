# Collection Runner

## Overview

The Collection Runner executes all requests in a collection sequentially, tracking results for each request. It provides real-time feedback and supports aborting mid-run.

## File: `src/app/runner/page.tsx`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Collection Runner Page                     │
│                                                              │
│  ┌──────────────┬──────────────────────────────────────────┐│
│  │ Collections  │  Results                                 ││
│  │              │                                          ││
│  │ ┌──────────┐│  ┌─────────────────────────────────────┐ ││
│  │ │ Col 1   ││  │ Total: 5  Success: 3  Failed: 1     │ ││
│  │ │ Col 2   ││  ├─────────────────────────────────────┤ ││
│  │ │ Col 3   ││  │ ✓ 1  200  GET   Get Users    150ms  │ ││
│  │ │         ││  │ ◌ 2  ---  POST  Create User  ...    │ ││
│  │ │         ││  │ ✓ 3  201  POST  Login        200ms  │ ││
│  │ │         ││  │ ✗ 4  404  GET   Get Post     80ms   │ ││
│  │ │         ││  │ ○ 5  ---  GET   Get Comments  ---   │ ││
│  │ └──────────┘│  └─────────────────────────────────────┘ ││
│  └──────────────┴──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Page Layout

### Left Panel: Collection Selector

- Scrollable list of all collections
- Shows collection name and request count
- Click to select a collection
- Selected collection highlighted

### Right Panel: Execution Results

- **Stats Bar**: Total, Success, Failed, Pending counts
- **Results List**: One row per request with real-time status updates

### Header

- **Title**: "Collection Runner"
- **Run Button**: Starts execution (disabled if no collection selected)
- **Stop Button**: Aborts execution (only shown during run)

## Execution Flow

```
User clicks "Run Collection"
       │
       ▼
┌─────────────────┐
│ 1. Initialize   │  Create initial results array
│    Results      │  All requests set to "pending"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. For Each     │  Loop through collection.requests
│    Request      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Set Running  │  Update result status to "running"
│    Status       │  Shows spinner icon
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Execute      │  Call sendRequest() with:
│    Request      │  - Request configuration
│                 │  - Proxy mode from request store
│                 │  - Active environment variables
│                 │  - Abort signal
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Success│ │ Error  │
│        │ │        │
│ Store  │ │ Store  │
│response│ │ error  │
└────┬───┘ └────┬───┘
     │          │
     └────┬─────┘
          │
          ▼
┌─────────────────┐
│ 5. Next Request │  Continue to next request
│    or Abort     │  Check if abort signal received
└────────┬────────┘
         │
    (loop back to step 2)
         │
         ▼
┌─────────────────┐
│ 6. Complete     │  All requests processed
│    Execution    │  Set isRunning to false
└─────────────────┘
```

## Result States

| State | Icon | Color | Description |
|---|---|---|---|
| `pending` | Clock | gray | Not yet executed |
| `running` | Spinner | primary | Currently executing |
| `success` | CheckCircle | emerald-400 | Completed successfully |
| `error` | XCircle | red-400 | Request failed |

## Result Row

```
┌────┬──────┬──────┬────────┬─────────────┬────────┬─────────────┐
│icon│  #   │Code  │ Method │    Name     │  Time  │   Error     │
├────┼──────┼──────┼────────┼─────────────┼────────┼─────────────┤
│ ✓  │  1   │ 200  │  GET   │ Get Users   │ 150ms  │             │
│ ◌  │  2   │  --- │  POST  │ Create User │  ...   │             │
│ ✗  │  4   │ 404  │  GET   │ Get Post    │ 80ms   │ Not Found   │
└────┴──────┴──────┴────────┴─────────────┴────────┴─────────────┘
```

### Fields

| Field | Description |
|---|---|
| Icon | Status indicator (pending/running/success/error) |
| # | Request index (1-based) |
| Code | HTTP status code or "---" if not available |
| Method | HTTP method (color-coded) |
| Name | Request name |
| Time | Response duration (if successful) |
| Error | Error message (if failed) |

## Abort Support

The runner uses `AbortController` to support cancellation:

```typescript
const controller = new AbortController();
setAbortController(controller);

// Pass signal to each request
await sendRequest({
  request: req,
  proxyMode,
  variables: getActiveVariables(),
  signal: controller.signal,
});

// On stop button click
controller.abort();
```

When aborted:
- Current request is cancelled (throws `AbortError`)
- Loop exits immediately
- Remaining requests stay in "pending" state

## Stats Bar

```
Total: 5  Success: 3  Failed: 1  Pending: 1
```

Updated in real-time as requests complete:
- **Total**: `results.length`
- **Success**: `results.filter(r => r.status === "success").length`
- **Failed**: `results.filter(r => r.status === "error").length`
- **Pending**: `results.filter(r => r.status === "pending").length`

## Integration with Stores

The runner reads from:
- **Collection Store**: To get the selected collection and its requests
- **Request Store**: For proxy mode setting
- **Environment Store**: For active environment variables

It does NOT write to the history store (each individual request is not saved to history when run via the runner).

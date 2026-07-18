# WebSocket Client

## Overview

Full-featured WebSocket client with connection management, message sending/receiving, auto-reconnect, and message history.

## Route: `/websocket`

## Features

- **Connection Management**: Connect/disconnect with status indicator
- **Message Sending**: Send text or JSON messages
- **Message Log**: Color-coded incoming/outgoing messages with timestamps
- **Auto-Reconnect**: Optional automatic reconnection on disconnect
- **Copy Messages**: One-click copy for any message
- **Environment Variables**: Supports `{{variable}}` syntax in URL and messages

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [WebSocket] [URL Input..............] (●) [Disconnect] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌──────────────────────┐
│ │ Messages              [Clear]│ │ Send Message         │
│ │                             │ │ [connected]          │
│ │ 10:30:01 [Connected to ...] │ │                      │
│ │                             │ │ {"type": "ping"}     │
│ │ 10:30:05 ▼ Hello server     │ │                      │
│ │                             │ │ [Send (Ctrl+Enter)]  │
│ │ 10:30:06 ▲ {"type":"ping"}  │ │                      │
│ │                             │ │ ☐ Auto-reconnect     │
│ │ 10:30:07 ▼ {"pong":true}   │ │                      │
│ │                             │ │                      │
│ └─────────────────────────────┘ └──────────────────────┘
└─────────────────────────────────────────────────────────┘
```

## Connection States

| State | Icon | Description |
|---|---|---|
| `disconnected` | WifiOff (gray) | No active connection |
| `connecting` | Spinner (yellow) | Connection in progress |
| `connected` | Wifi (green) | Active connection |
| `error` | WifiOff (red) | Connection error |

## Usage

### Connect to WebSocket

1. Enter the WebSocket URL (e.g., `wss://echo.websocket.org`)
2. Click **Connect** or press **Enter**
3. Status indicator shows connection state

### Send Messages

1. Type message in the Send Message panel
2. Click **Send** or press **Ctrl+Enter**
3. Message appears in the log (green, arrow up)

### Receive Messages

Incoming messages appear automatically in the log (blue, arrow down).

### Auto-Reconnect

Check **Auto-reconnect** to automatically reconnect after 3 seconds if the connection drops (except on clean close).

### Copy Messages

Hover over any message and click the copy icon to copy its content.

## Implementation

- **WebSocket**: Native browser `WebSocket` API
- **State**: Local React state
- **Reconnect**: `setTimeout` with 3-second delay
- **Cleanup**: Closes connection on component unmount

## Events Handled

| Event | Action |
|---|---|
| `onopen` | Set status to "connected", log message |
| `onmessage` | Add message to log |
| `onerror` | Set status to "error", log error |
| `onclose` | Set status to "disconnected", log reason, optionally reconnect |

## Dependencies

- `@/store/environment-store` - Variable resolution
- `@/components/sidebar` - Navigation
- `@/components/ui/*` - UI components

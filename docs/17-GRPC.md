# gRPC Client

## Overview

gRPC client interface for testing gRPC-Web endpoints with service/method configuration, metadata management, and JSON request/response handling.

## Route: `/grpc`

## Features

- **Service/Method Configuration**: Separate inputs for service and method names
- **gRPC Type Selection**: Unary, server-streaming, client-streaming, bidirectional
- **Metadata Manager**: Add/remove custom metadata headers
- **Request Body**: JSON editor for request payload
- **Response Viewer**: Formatted response display
- **Environment Variables**: Supports `{{variable}}` syntax in all inputs

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [gRPC] [Endpoint URL...........................] [Call] │
├─────────────────────────────────────────────────────────┤
│ Service: [mypackage.MyService]  Method: [MyMethod]     │
│ [unary] [server-streaming] [client-streaming] [bidi]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ Request Body        │ │ Metadata            │        │
│ │                     │ │                     │        │
│ │ {                   │ │ [content-type]      │        │
│ │   "name": "Hello"  │ │ [application/grpc]  │        │
│ │ }                   │ │                     │        │
│ │                     │ │ [+] Add Metadata    │        │
│ └─────────────────────┘ └─────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│ Response                                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ {                                                   ││
│ │   "message": "Hello, Hello!"                        ││
│ │ }                                                   ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## gRPC Types

| Type | Description |
|---|---|
| `unary` | Single request, single response |
| `server-streaming` | Single request, stream of responses |
| `client-streaming` | Stream of requests, single response |
| `bidirectional` | Stream of requests, stream of responses |

**Note**: Browser gRPC-Web support is limited. Streaming types may require a gRPC-Web proxy.

## Usage

### Basic Call

1. Enter the gRPC endpoint URL
2. Enter the service name (e.g., `mypackage.MyService`)
3. Enter the method name (e.g., `MyMethod`)
4. Enter the request body as JSON
5. Click **Call**

### Custom Metadata

1. Click **Add Metadata**
2. Enter key-value pairs (e.g., `authorization: Bearer <token>`)
3. Metadata is sent as request headers

### Using Environment Variables

Variables are resolved in URL, service name, method name, request body, and metadata:

```
Endpoint: {{grpc_host}}:443
Service: {{package}}.UserService
Metadata: authorization: Bearer {{token}}
```

## Implementation

- **Transport**: HTTP/1.1 POST with JSON payload (for gRPC-Web proxies)
- **Content-Type**: `application/json` (default) or `application/grpc+proto`
- **State**: Local React state
- **Response**: Parsed as JSON or plain text

## Limitations

- Native gRPC (HTTP/2 + protobuf) requires browser extensions or gRPC-Web proxy
- Binary protobuf encoding not supported in browser
- Streaming requires gRPC-Web proxy support

## Dependencies

- `@/store/environment-store` - Variable resolution
- `@/components/sidebar` - Navigation
- `@/components/ui/*` - UI components

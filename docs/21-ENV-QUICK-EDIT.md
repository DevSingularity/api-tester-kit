# Environment Quick-Edit

## Overview

Quickly view and edit environment variables directly from the main request builder without navigating to the Environments page.

## Access

Click the **Globe** icon in the request header (next to the Settings icon).

## Features

- **Quick access**: Edit variables without leaving the request builder
- **Global & environment variables**: Toggle between global and environment-specific variables
- **Add/remove**: Add new variables or remove existing ones
- **Secret masking**: Sensitive values are masked by default with toggle to reveal
- **Real-time updates**: Changes are applied immediately

## UI Layout

```
┌──────────────────────────────────────┐
│ Environment Variables                │
│ [Development] [Global]              │
├──────────────────────────────────────┤
│ {{host}}    [api.example.com   ] [👁]│
│ {{token}}   [••••••••••••••••••] [👁]│
│ {{version}} [v1                ] [👁]│
├──────────────────────────────────────┤
│ [Key    ] [Value    ] [+]          │
└──────────────────────────────────────┘
```

## Usage

### View Variables

1. Click the Globe icon in the request header
2. Variables from the active environment are displayed
3. Click the eye icon to reveal masked values

### Edit Variables

1. Click on a value field
2. Type the new value
3. Press Enter or click away to save

### Add Variable

1. Enter key name in the "Key" field
2. Enter value in the "Value" field
3. Click the **+** button or press Enter

### Remove Variable

1. Hover over the variable row
2. Click the **trash** icon that appears

### Switch Between Global and Environment

1. Click **Global** to edit global variables
2. Click the environment name (e.g., "Development") to edit environment variables

## Variable Usage

Variables are referenced in requests using double curly braces:

```
URL: https://{{host}}/api/{{version}}/users
Header: Authorization: Bearer {{token}}
Body: { "env": "{{environment}}" }
```

## Implementation

- **Component**: `src/components/env-quick-edit.tsx`
- **Location**: Main request header (popover)
- **State**: Uses `useEnvironmentStore` for variable management

## Dependencies

- `@/store/environment-store` - Environment variable management
- `@/components/ui/*` - UI components

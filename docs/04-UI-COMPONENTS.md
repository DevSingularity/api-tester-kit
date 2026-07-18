# UI Components

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ RootLayout (layout.tsx)                                      │
│ ├── ThemeProvider                                            │
│ ├── QueryProvider (TanStack Query)                          │
│ ├── TooltipProvider                                         │
│ └── CommandPalette (global, Ctrl+K)                         │
│                                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Page Component (page.tsx)                                 ││
│ │ ┌──────────┬──────────────────────────────────────────┐  ││
│ │ │ Sidebar  │  ┌────────────────────────────────────┐  │  ││
│ │ │          │  │ Header (URL Bar + Settings)         │  │  ││
│ │ │ Nav      │  ├────────────────────────────────────┤  │  ││
│ │ │ Items    │  │ Request Tabs                        │  │  ││
│ │ │          │  ├────────────────┬───────────────────┤  │  ││
│ │ │ Open     │  │ Request Panel  │ Response Viewer   │  │  ││
│ │ │ Tabs     │  │ (Params/       │ (Body/Headers/    │  │  ││
│ │ │          │  │  Headers/      │  Code/Search)     │  │  ││
│ │ │          │  │  Body/Auth/    │                   │  │  ││
│ │ │          │  │  Scripts)      │                   │  │  ││
│ │ │          │  └────────────────┴───────────────────┘  │  ││
│ │ └──────────┴──────────────────────────────────────────┘  ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Sidebar (`src/components/sidebar.tsx`)

**Purpose**: Main navigation and tab management.

**Features**:
- Collapsible sidebar (toggle with PanelLeft/PanelLeftClose icons)
- Navigation links to all pages
- "New Request" button
- "Search" button (opens command palette)
- Open tabs list with close/pin functionality

**Structure**:
```
Sidebar
├── Header (Logo + Collapse button)
├── Actions (New Request + Search)
├── Navigation (Links to all pages)
├── Separator
└── Open Tabs (Scrollable list)
    └── Tab item (Name + Pin + Close)
```

**Behavior**:
- Width: 260px when open, 48px when collapsed
- Only labels are shown when expanded
- Tabs show pin icon on hover
- Click tab to switch, click X to close

---

### Command Palette (`src/components/command-palette.tsx`)

**Purpose**: Quick access to commands and navigation (like Raycast/Linear).

**Trigger**: `Ctrl+K` or `Ctrl+Shift+P`

**Commands**:
| Command | Action |
|---|---|
| New Request | Creates a new request tab |
| Go to Collections | Navigates to /collections |
| Go to Environments | Navigates to /environments |
| Go to History | Navigates to /history |
| Go to Settings | Navigates to /settings |
| Switch to Light/Dark Theme | Toggles theme |

**Features**:
- Fuzzy search by label or category
- Keyboard navigation (↑/↓ arrows, Enter to select)
- Escape to close
- Category labels for organization

---

### Method Selector (`src/components/method-selector.tsx`)

**Purpose**: Dropdown to select HTTP method.

**Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD, TRACE, CONNECT

**Colors**:
- GET → emerald
- POST → amber
- PUT → blue
- PATCH → purple
- DELETE → red
- OPTIONS/HEAD → gray

**Interaction**: Click to toggle dropdown, click method to select.

---

### JSON Viewer (`src/components/json-viewer.tsx`)

**Purpose**: Interactive JSON response viewer with tree structure.

**Features**:
- Collapsible/expandable nodes
- Syntax highlighting (blue for keys, green for strings, amber for numbers, purple for booleans)
- Copy path to clipboard on hover
- Copy all button
- Search input
- Nested indentation (16px per level)
- Array indices and object keys displayed

**Structure**:
```
JsonViewer
├── Search bar (sticky top)
│   ├── Search input
│   └── Copy all button
└── JSON Tree
    └── JsonNode (recursive)
        ├── Expand/Collapse toggle
        ├── Key name (if object property)
        ├── Value (if primitive)
        ├── Copy path button (on hover)
        └── Children (if expandable)
```

**Expandability**:
- Objects and arrays are expandable
- Default expansion: depth < 2
- Click chevron to toggle

---

### Response Search (`src/components/response-search.tsx`)

**Purpose**: Search within response body.

**Features**:
- Real-time search as you type
- Match count display (e.g., "3/15")
- Previous/Next navigation buttons
- Clear button
- Case-insensitive matching

---

### Import/Export Dialog (`src/components/import-export-dialog.tsx`)

**Purpose**: Import and export collections in various formats.

**Import Formats**:
- **Postman Collection** (JSON)
- **cURL Command** (text)
- **HAR File** (.har)
- **JSON Collection** (custom format)

**Export Formats**:
- JSON
- YAML
- Markdown

**Features**:
- File upload (drag and drop area)
- Text paste for cURL/JSON
- Success/error feedback
- Format selector for export

---

### Code Generator Panel (`src/components/code-generator-panel.tsx`)

**Purpose**: Generate code snippets from the current request.

**Languages**: cURL, JavaScript, TypeScript, Python, Go, PHP

**Features**:
- Language selector dropdown
- Copy to clipboard button
- Monospace code display

---

### Theme Provider (`src/components/theme-provider.tsx`)

**Purpose**: Manages light/dark/system theme.

**Mechanism**:
- Adds `light` or `dark` class to `<html>` element
- Persists preference to localStorage
- System theme uses `prefers-color-scheme` media query

**API**:
```typescript
const { theme, setTheme } = useTheme();
```

---

### Query Provider (`src/components/query-provider.tsx`)

**Purpose**: Wraps the app with TanStack Query provider.

**Configuration**:
- `staleTime`: 60 seconds
- `refetchOnWindowFocus`: false

---

## shadcn/ui Components

Located in `src/components/ui/`, these are pre-built components from shadcn/ui (base-nova style):

| Component | File | Purpose |
|---|---|---|
| Button | `button.tsx` | Primary action buttons with variants |
| Input | `input.tsx` | Text input fields |
| Textarea | `textarea.tsx` | Multi-line text input |
| Tabs | `tabs.tsx` | Tab navigation |
| Dialog | `dialog.tsx` | Modal dialogs |
| Select | `select.tsx` | Dropdown selectors |
| Badge | `badge.tsx` | Status badges |
| Separator | `separator.tsx` | Visual dividers |
| ScrollArea | `scroll-area.tsx` | Custom scrollable areas |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Label | `label.tsx` | Form labels |
| Switch | `switch.tsx` | Toggle switches |
| Popover | `popover.tsx` | Floating panels |
| DropdownMenu | `dropdown-menu.tsx` | Context menus |
| Collapsible | `collapsible.tsx` | Collapsible sections |

All components support the `cn()` utility for className merging and follow the shadcn/ui design system with CSS variables.

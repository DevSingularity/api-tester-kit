# Keyboard Shortcuts

## Overview

The application supports keyboard shortcuts for common operations. Shortcuts are implemented using window event listeners and are documented in the UI.

## Global Shortcuts

| Shortcut | Action | File |
|---|---|---|
| `Ctrl+Enter` | Send current request | `use-keyboard-shortcuts.ts` |
| `Ctrl+S` | Save (prevent default) | `use-keyboard-shortcuts.ts` |
| `Ctrl+K` | Open command palette | `command-palette.tsx` |
| `Ctrl+Shift+P` | Open command palette | `command-palette.tsx` |
| `Escape` | Close command palette | `command-palette.tsx` |

## Command Palette Navigation

| Key | Action |
|---|---|
| `↑` | Move selection up |
| `↓` | Move selection down |
| `Enter` | Execute selected command |
| `Escape` | Close palette |

## Request Builder Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `Ctrl+Enter` | Send request | URL bar focused |

## Implementation

### File: `src/hooks/use-keyboard-shortcuts.ts`

```typescript
export function useKeyboardShortcuts() {
  const { getActiveRequest, setLoading, setResponse, proxyMode } =
    useRequestStore();
  const { addEntry } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter: Send request
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        // Execute request...
      }

      // Ctrl+S: Save (prevent default)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

### File: `src/components/command-palette.tsx`

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Shift+P or Ctrl+K: Toggle command palette
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "p") {
      e.preventDefault();
      setCommandPaletteOpen(!commandPaletteOpen);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setCommandPaletteOpen(!commandPaletteOpen);
    }
    // Escape: Close palette
    if (e.key === "Escape" && commandPaletteOpen) {
      setCommandPaletteOpen(false);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [commandPaletteOpen, setCommandPaletteOpen]);
```

## Command Palette Commands

| Command | Category | Action |
|---|---|---|
| New Request | General | Creates a new request tab |
| Go to Collections | Navigation | Navigates to /collections |
| Go to Environments | Navigation | Navigates to /environments |
| Go to History | Navigation | Navigates to /history |
| Go to Settings | Navigation | Navigates to /settings |
| Switch to Light/Dark Theme | Preferences | Toggles theme |

## Platform Support

All shortcuts work on both:
- **Windows/Linux**: `Ctrl` key
- **macOS**: `Cmd` (⌘) key

The code uses `(e.ctrlKey || e.metaKey)` to detect both:

```typescript
if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
  // Works on both platforms
}
```

## Preventing Default Behavior

Some shortcuts prevent the browser's default behavior:

```typescript
// Prevent browser's "Save Page" dialog
if ((e.ctrlKey || e.metaKey) && e.key === "s") {
  e.preventDefault();
}

// Prevent browser's "Print" dialog (if we added Ctrl+P)
if ((e.ctrlKey || e.metaKey) && e.key === "p") {
  e.preventDefault();
}
```

## Adding New Shortcuts

To add a new keyboard shortcut:

1. Choose the appropriate file:
   - Global shortcuts: `src/hooks/use-keyboard-shortcuts.ts`
   - Command palette: `src/components/command-palette.tsx`
   - Component-specific: Add to the component

2. Add the event listener:

```typescript
if ((e.ctrlKey || e.metaKey) && e.key === "x") {
  e.preventDefault();
  // Your action here
}
```

3. Update this documentation

## Accessibility

- All interactive elements are keyboard-focusable
- Tab order follows visual layout
- Focus indicators are visible
- Screen reader labels are provided via `aria-label` and `aria-describedby`

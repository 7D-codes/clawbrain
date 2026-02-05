# ClawBrain Design System

## Aesthetic: Mono Wireframe Grid

Architectural blueprint meets digital workspace. Every element serves a purpose. The grid is not hidden — it's the foundation of the design.

---

## Color Palette

**Pure Monochrome — No Accent Colors**

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-secondary` | `#FAFAFA` | Card backgrounds, sections |
| `--bg-tertiary` | `#F5F5F5` | Hover states, subtle fills |
| `--border-primary` | `#E5E5E5` | Primary borders, grid lines |
| `--border-secondary` | `#D4D4D4` | Active borders, focus states |
| `--border-strong` | `#A3A3A3` | Emphasis borders |
| `--text-primary` | `#171717` | Headings, primary text |
| `--text-secondary` | `#525252` | Body text, descriptions |
| `--text-tertiary` | `#737373` | Metadata, hints |
| `--text-muted` | `#A3A3A3` | Disabled, placeholders |

**Dark Mode (Future):**
| Token | Hex |
|-------|-----|
| `--bg-primary` | `#0A0A0A` |
| `--bg-secondary` | `#171717` |
| `--text-primary` | `#FAFAFA` |
| `--border-primary` | `#262626` |

---

## Typography

**Font Families:**
- **UI/Headings:** `Space Grotesk` or `DM Sans` — Geometric, technical feel
- **Body:** `IBM Plex Sans` — Clean, readable
- **Code/Data:** `JetBrains Mono` or `IBM Plex Mono` — Monospace for authenticity

**Scale:**
```
--text-xs: 0.75rem   (12px)   - Metadata, timestamps
--text-sm: 0.875rem  (14px)   - Secondary text
--text-base: 1rem    (16px)   - Body text
--text-lg: 1.125rem  (18px)   - Subheadings
--text-xl: 1.25rem   (20px)   - Card titles
--text-2xl: 1.5rem   (24px)   - Section headings
--text-3xl: 1.875rem (30px)   - Page titles
```

**Weights:**
- Regular (400) — Body text
- Medium (500) — UI labels, emphasis
- SemiBold (600) — Headings

---

## Grid System

**The grid is visible.** Thin lines create structure without clutter.

```css
/* Base grid unit */
--grid-unit: 8px;

/* Spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* Grid lines */
--grid-line: 1px solid var(--border-primary);
```

**Layout Principles:**
- All elements align to 8px grid
- Gaps are multiples of 8px (8, 16, 24, 32)
- Borders are 1px, solid, var(--border-primary)
- No border-radius (sharp corners) OR consistent 2px radius

---

## Components

### Cards

```
Border: 1px solid var(--border-primary)
Background: var(--bg-primary) or var(--bg-secondary)
Padding: 16px (var(--space-4))
Shadow: NONE (use borders for definition)
```

**Task Card:**
- Thin border box
- Title: `--text-base`, `--text-primary`, medium weight
- Description: `--text-sm`, `--text-secondary`, 2-line max
- Metadata row: `--text-xs`, `--text-tertiary`, monospace
- Status indicator: small square/dot, no text color change

### Buttons

**Primary:**
```
Background: var(--text-primary)
Text: var(--bg-primary)
Border: none
Padding: 8px 16px
Font: --text-sm, medium weight
```

**Secondary:**
```
Background: transparent
Border: 1px solid var(--border-primary)
Text: var(--text-primary)
```

**Ghost:**
```
Background: transparent
Border: none
Text: var(--text-secondary)
Hover: var(--bg-tertiary)
```

### Inputs

```
Border: 1px solid var(--border-primary)
Background: var(--bg-primary)
Padding: 8px 12px
Focus: border-color var(--border-secondary)
Placeholder: var(--text-muted)
```

### Kanban Column

```
Border-right: 1px solid var(--border-primary) [except last]
Background: transparent
Header: padding 16px, border-bottom 1px solid var(--border-primary)
Content: padding 16px, gap 12px between cards
```

### Chat Panel

```
Border: 1px solid var(--border-primary)
Background: var(--bg-primary)
Message user: right-aligned, bg-secondary
Message assistant: left-aligned, bg-primary with left border accent
Input: full-width at bottom, border-top
```

---

## Layout Structure

```
┌─────────────────────────────────────────────┐
│ HEADER (border-bottom)                      │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │           MAIN AREA              │
│ (fixed   │  ┌──────────────────────────┐   │
│  width,  │  │      CHAT / KANBAN       │   │
│  border- │  │                          │   │
│  right)  │  │                          │   │
│          │  │                          │   │
│          │  └──────────────────────────┘   │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Dimensions:**
- Sidebar: 240px fixed
- Header: 56px height
- Gutter: 24px

---

## Animations

**Principle:** Mechanical precision, not organic bounce

```css
/* Standard transition */
--transition-fast: 100ms ease;
--transition-base: 150ms ease;
--transition-slow: 200ms ease;

/* Drag and drop */
Drag start: scale(1.02), border-color change
Drop target: background-color shift
Drop complete: snap to position (no bounce)

/* Hover states */
Cards: background-color transition 150ms
Buttons: opacity or background shift
Links: underline appears
```

**No:**
- Spring physics
- Scale bounces
- Rotation effects
- Blur transitions

**Yes:**
- Linear movement
- Opacity fades
- Color transitions
- Transform translate (for drag)

---

## Icons

**Style:** Outline, 1.5px stroke, geometric
**Size:** 16px (sm), 20px (md), 24px (lg)
**Library:** Lucide React (consistent line weight)

**Usage:**
- Icons always paired with labels or tooltips
- Consistent sizing within contexts
- Monochrome (inherit text color)

---

## shadcn/ui Customization

Override these in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --accent: 0 0% 96%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 0 0% 64%;
  --radius: 0px; /* Sharp corners */
}
```

---

## File Structure

```
app/
├── globals.css          # Tailwind + CSS vars + grid system
├── layout.tsx           # Root layout with sidebar
├── page.tsx             # Main dashboard
├── api/
│   └── tasks/
├── components/
│   ├── ui/              # shadcn components
│   ├── ai-elements/     # AI Elements components
│   ├── kanban/          # Kanban-specific
│   ├── chat/            # Chat panel
│   └── layout/          # Sidebar, header
└── lib/
    ├── utils.ts
    └── store.ts         # Zustand store
```

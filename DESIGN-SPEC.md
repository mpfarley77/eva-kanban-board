# DESIGN-SPEC.md — Eva Kanban Board Visual Overhaul

## Design Direction: "Classic Board" (Design A)

Inspired by Trello's visual language: bold column header colors, white task cards, soft gray column backgrounds, customizable full-screen background image behind everything, generous spacing, and a clean top navigation bar.

---

## Color System

### Column Header Colors (solid backgrounds, white text)
- **Backlog**: `#0079BF` (Trello blue)
- **In Progress**: `#D29034` (warm gold)
- **Review**: `#89609E` (muted purple)
- **Completed**: `#519839` (forest green)

### Priority Colors
- **P0**: `#EB5A46` (red — urgent)
- **P1**: `#CF9F02` (dark gold — high)
- **P2**: `#61BD4F` (green — medium)
- **P3**: `#C377E0` (purple — low)

### Objective Colors (used for label strips and tags)
- **Skyworks**: `#0079BF` blue, tag bg `#E4F0F6`, tag text `#0079BF`
- **Personal**: `#519839` green, tag bg `#EEF6EC`, tag text `#519839`
- **Side Hustles**: `#D29034` gold, tag bg `#FCF1E2`, tag text `#B8860B`

### Surfaces
- **Column background**: `rgba(235, 236, 240, 0.95)` (soft gray, slightly transparent)
- **Card background**: `#FFFFFF`
- **Card text (title)**: `#172B4D`
- **Card text (meta)**: `#5E6C84`
- **Top bar**: `rgba(0,0,0,0.25)` with `backdrop-filter: blur(8px)`, white text

### Default Background
- Gradient fallback: `linear-gradient(135deg, #0062E6 0%, #33A1FD 30%, #59C3C3 60%, #7BCB72 100%)`
- User can set a custom background image URL via the existing background panel
- Background overlay uses the existing `bgOverlay` opacity slider

---

## Typography

- **Font family**: `'Nunito Sans', sans-serif` (import from Google Fonts)
- **Column headers**: 14px, bold (700), uppercase, letter-spacing 0.5px
- **Card title**: 14px, semi-bold (600), color `#172B4D`
- **Card meta text**: 11px, color `#5E6C84`
- **Priority pills**: 10px, bold (700), white text on priority color background, border-radius 3px
- **Objective tags**: 10px, semi-bold (600), colored text on light colored bg, border-radius 3px
- **Top bar title**: 18px, bold (700), white
- **Filter/control labels**: 13px, color `#5E6C84`

---

## Layout

### Top Bar
- Fixed at top, full width
- Dark translucent background (`rgba(0,0,0,0.25)`) with blur
- Left side: board title "Eva Kanban Board"
- Right side: Filter, Sort, + New task buttons
- Buttons: `rgba(255,255,255,0.2)` background, white text, 4px border-radius

### Board
- Horizontal flex layout, scrollable on overflow
- Gap between columns: 14px
- Padding: 16px 20px
- Columns aligned to flex-start (top)

### Columns
- Fixed width: 280px
- Background: soft gray `rgba(235, 236, 240, 0.95)`
- Border-radius: 12px
- Column header: colored background per status, rounded top corners (12px 12px 0 0)
- Column header contains: status label (left) + task count badge (right)
- Count badge: 22px circle, `rgba(255,255,255,0.3)` background

### Cards
- White background, 8px border-radius
- Padding: 10px 12px
- Box shadow: `0 1px 2px rgba(0,0,0,0.1)`
- Hover: translateY(-2px), shadow `0 4px 12px rgba(0,0,0,0.15)`
- Cursor: grab (for backlog cards with drag-and-drop)
- Card gap within column: 8px

### Card Anatomy (top to bottom)
1. **Color label strips**: 8px tall, 4px border-radius, 40px min-width (objective color + priority color)
2. **Title**: 14px semi-bold
3. **Meta row**: priority pill + objective tag + due date badge + avatar circle
   - Avatar: 28px circle, `#DFE1E6` bg, initials "E", 11px bold

### Drag-and-Drop (Backlog column)
- Six-dot grip handle on card left side, appears on hover
- Dragging card: `rotate(2deg) scale(1.03)`, elevated shadow
- Drop placeholder: dashed blue border (`#0079BF`), light blue fill
- Touch-compatible (both mouse and touch events)
- Toast notification on drop confirming new position

### Completed Column Cards
- Opacity: 0.8
- Green checkmark badge instead of date

### Add Card Button
- Below each column's card list
- Text: "+ Add a card"
- Color: `#5E6C84`, hover: darker with subtle background

### WIP Indicator
- Shown in "In Progress" column header
- Small pill: `rgba(255,255,255,0.25)` bg, white text, "WIP: 1"

---

## Implementation Phases

### Phase 1: Global Styles + Top Bar
- Add Google Fonts import for Nunito Sans
- Replace the existing dark theme with the new color system
- Build the top navigation bar component
- Apply the background gradient (and hook into existing bgImageUrl/bgOverlay state)

### Phase 2: Column Styling
- Style KanbanColumn with the new column design (colored headers, gray body, rounded corners)
- Add the count badge to each column header
- Add the WIP indicator to In Progress column

### Phase 3: Card Redesign
- Restyle TaskCard with white cards, label strips, priority pills, objective tags
- Add the avatar circle
- Style the hover elevation effect
- Style completed cards with reduced opacity and checkmark

### Phase 4: Drag-and-Drop Visual Polish
- Add the six-dot grip handle (visible on hover)
- Style the dragging state (rotation, shadow)
- Style the drop placeholder (dashed blue border)
- Add toast notification on successful reorder

### Phase 5: Filter Bar + Activity Log Styling
- Restyle FilterBar to match the new visual language
- Restyle ActivityLog to match
- Ensure all controls (selects, inputs, checkboxes) match the light theme

---

## Important Notes
- The app currently uses a dark theme (slate-900/950 backgrounds). This redesign moves to a LIGHT theme.
- All Tailwind classes need to be updated — dark bg classes become white/light gray.
- The existing functionality must be preserved exactly. This is a visual-only change.
- The background image customization feature must continue to work.
- The drag-and-drop between columns must continue to work.
- Mobile responsiveness: columns should scroll horizontally on small screens.

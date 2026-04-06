# Dark Theme Redesign — Design Doc

**Date:** 2026-04-05  
**Inspired by:** SmartGym (smartgymapp.com) — pure black + neon lime aesthetic.

---

## Goal

Retheme the entire frontend from the current light/glass-morphism aesthetic to a high-contrast dark mode matching SmartGym's visual identity: black background, `#a5fa01` neon lime accent, white text, Inter font.

---

## Design Decisions

| Decision | Choice |
|----------|--------|
| Background | `#000000` pure black |
| Accent | `#a5fa01` neon lime (exact SmartGym match) |
| Surface/cards | `#111111` |
| Elevated surface | `#1a1a1a` |
| Borders | `#2a2a2a` (default), `#1f1f1f` (subtle) |
| Text | `#ffffff` primary, `#888888` muted, `#555555` dim |
| Font | Inter (single family, Google Fonts, 400–800 weights) |
| Button shape | Pill (100px border-radius), lime bg, black text |
| Layout structure | Keep 3-column + side photo panels |

---

## Color System (`:root`)

```css
--bg:          #000000
--surface:     #111111
--surface-2:   #1a1a1a
--border:      #2a2a2a
--border-dim:  #1f1f1f
--lime:        #a5fa01
--lime-bg:     rgba(165, 250, 1, 0.10)
--lime-border: rgba(165, 250, 1, 0.25)
--lime-glow:   rgba(165, 250, 1, 0.15)
--text:        #ffffff
--text-muted:  #888888
--text-dim:    #555555
--warn:        #ef4444
--ok:          #22c55e
--shadow:      0 20px 60px rgba(0, 0, 0, 0.6)
--radius-md:   14px
--radius-lg:   22px
```

---

## Component Treatments

### Navigation (`.topbar`)
- `background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(14px)`
- `border: 1px solid var(--border-dim)`
- Active nav link: `background: var(--lime); color: #000; border-radius: 999px`
- Hover nav link: `background: var(--lime-bg); border-color: var(--lime-border)`

### Page Banner (`.page-banner`) — **Dramatic treatment**
- `background: #000`
- Left side: strong lime radial bloom — `radial-gradient(ellipse at -10% 50%, rgba(165,250,1,0.22), transparent 55%)`
- `border: 1px solid var(--border-dim)`, with 3px lime top border
- `h1` title: `color: var(--lime)` — headline pops in lime
- Subtitle: `color: var(--text-muted)`
- Right image: dark overlay maintained, `border: 1px solid var(--border)`

### Panels / Cards (`.panel`, `.stat-card`, `.history-card`)
- `background: var(--surface); border: 1px solid var(--border)`
- Hover: `border-color: var(--lime-border)` + subtle lime box-shadow
- No more white gradient fills

### Buttons
- Primary: `background: var(--lime); color: #000; font-weight: 800; border-radius: 100px`
- Ghost: `background: transparent; border: 1px solid var(--border); color: var(--text)`
- Delete: `background: transparent; border: 1px solid rgba(239,68,68,0.3); color: #ef4444`
- Disabled: `opacity: 0.4`

### Forms (inputs, selects)
- `background: var(--surface-2); border: 1px solid var(--border); color: var(--text)`
- Focus: `border-color: var(--lime); box-shadow: 0 0 0 3px var(--lime-bg)`
- Placeholder: `color: var(--text-dim)`

### Auth Pages (`.auth-brand`, `.auth-card`)
- `.auth-brand`: `background: #000; border-left: 3px solid var(--lime)` — lime left accent stripe, white text
- `.auth-card`: `background: var(--surface); border: 1px solid var(--border)`

### Side Photo Panels (`.side-visual`)
- `border: 1px solid var(--border-dim); background: #0a0a0a`
- Bottom overlay: `linear-gradient(180deg, transparent 60%, rgba(165,250,1,0.06))`

### Toasts
- Success: `background: #0a1a0a; border-color: rgba(34,197,94,0.4); color: #86efac`
- Error: `background: #1a0808; border-color: rgba(239,68,68,0.4); color: #fca5a5`
- Info: `background: #0a0f1a; border-color: rgba(165,250,1,0.25); color: var(--lime)`

### Chips, badges
- `background: var(--lime-bg); color: var(--lime); border: 1px solid var(--lime-border)`

---

## Files to Change

| File | Change |
|------|--------|
| `frontend/src/styles.css` | Complete rewrite — dark theme throughout |
| `frontend/src/components/LogoMark.jsx` | Update SVG gradient stops: black bg rect + lime gradient bar |

**No changes needed to:**
- `frontend/index.html` (fonts are in styles.css via @import)
- Page JSX files (all styling is CSS-driven, no inline style props)
- `Layout.jsx` (banner/nav use CSS classes, no inline styles)

---

## Verification

1. `cd frontend && npm run build` — no build errors
2. `docker compose up --build` — smoke test all pages:
   - Login / Register: dark cards, lime button, lime accent stripe
   - Workouts: black bg, lime "Log Workout" pill button, dark history cards
   - Exercises: dark library grid cards, lime chips
   - Body Metrics: dark chart wrap, lime line on chart
   - Progress: dark result card, lime highlight on status
   - Side panels: photo visible with dark border + lime tint
   - Nav: active link in lime, topbar transparent/frosted on black

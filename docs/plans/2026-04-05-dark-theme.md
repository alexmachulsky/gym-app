# Dark Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current light/glass-morphism theme with a high-contrast dark theme — pure black background, `#a5fa01` neon lime accent, Inter font — matching SmartGym's visual aesthetic.

**Architecture:** Two files change: `styles.css` is completely rewritten section-by-section, and `LogoMark.jsx` gets updated SVG colors. All styling is CSS-class-driven with no inline styles in JSX, so no page components need touching.

**Tech Stack:** Plain CSS custom properties, Inter via Google Fonts, React/Vite frontend.

**Design doc:** `docs/plans/2026-04-05-dark-theme-design.md`

---

## Working directory

All frontend work: `frontend/` inside your worktree.
Build check command: `cd frontend && npm run build`

---

### Task 1: Replace font import + CSS custom properties

**Files:**
- Modify: `frontend/src/styles.css` (lines 1–21 — the @import and :root block)

**Step 1: Replace the @import and :root block**

Open `frontend/src/styles.css`. Replace everything from line 1 through the closing `}` of `:root` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg:          #000000;
  --surface:     #111111;
  --surface-2:   #1a1a1a;
  --border:      #2a2a2a;
  --border-dim:  #1f1f1f;
  --lime:        #a5fa01;
  --lime-bg:     rgba(165, 250, 1, 0.10);
  --lime-border: rgba(165, 250, 1, 0.25);
  --lime-glow:   rgba(165, 250, 1, 0.15);
  --text:        #ffffff;
  --text-muted:  #888888;
  --text-dim:    #555555;
  --warn:        #ef4444;
  --ok:          #22c55e;
  --shadow:      0 20px 60px rgba(0, 0, 0, 0.6);
  --radius-md:   14px;
  --radius-lg:   22px;
}
```

**Step 2: Run build to verify no syntax errors**

```bash
cd frontend && npm run build
```
Expected: build succeeds (no CSS parse errors).

**Step 3: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: replace design tokens with dark theme color system + Inter font"
```

---

### Task 2: Rewrite global body + typography styles

**Files:**
- Modify: `frontend/src/styles.css` — the `*`, `body`, `h1–h4`, `button`, `th`, `a` block

**Step 1: Replace the global typography section** (currently lines 22–52):

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  min-height: 100vh;
}

h1, h2, h3, h4, button, th {
  font-family: 'Inter', sans-serif;
}

a {
  color: var(--lime);
  text-decoration: none;
}
```

**Step 2: Run build**

```bash
cd frontend && npm run build
```

**Step 3: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark body bg, Inter font, lime links"
```

---

### Task 3: Rewrite layout shell + side visual panels

**Files:**
- Modify: `frontend/src/styles.css` — `.app-stage`, `.layout-shell`, `.side-visual` blocks

**Step 1: Replace the layout + side panel section**:

```css
.app-stage {
  width: min(1740px, calc(100% - 2.2rem));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(110px, 220px) minmax(0, 1fr) minmax(110px, 220px);
  gap: 1.2rem;
  align-items: start;
}

.layout-shell {
  width: 100%;
  margin: 1.7rem 0 2.4rem;
  display: grid;
  gap: 1.2rem;
  position: relative;
  min-width: 0;
}

.side-visual {
  margin-top: 2.2rem;
  position: sticky;
  top: 1.1rem;
  height: calc(100vh - 2.2rem);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-dim);
  overflow: hidden;
  background: #0a0a0a;
}

.side-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.35),
    transparent 40%,
    rgba(165, 250, 1, 0.06)
  );
  pointer-events: none;
}

.side-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  animation: sideVisualSwap 420ms ease both;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark side panels with lime bottom tint"
```

---

### Task 4: Rewrite topbar + navigation

**Files:**
- Modify: `frontend/src/styles.css` — `.topbar`, `.logo-mark`, `.main-nav`, `.user-pill` blocks

**Step 1: Replace the topbar/nav section**:

```css
.topbar {
  position: sticky;
  top: 0.8rem;
  z-index: 40;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-lg);
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(14px);
  animation: fadeUp 620ms ease both;
}

.logo-mark {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.logo-mark svg {
  width: 46px;
  height: 46px;
  border-radius: 12px;
}

.logo-mark p {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--text);
}

.logo-mark span {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.main-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.user-pill {
  display: grid;
  gap: 0.05rem;
  min-width: 130px;
  padding: 0.38rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
}

.user-pill span {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.user-pill strong {
  font-size: 0.88rem;
  color: var(--text);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-nav a {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: 180ms ease;
}

.main-nav a:hover {
  color: var(--text);
  border-color: var(--border);
  background: var(--surface);
}

.main-nav a.active {
  color: #000;
  background: var(--lime);
  font-weight: 700;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark topbar, lime active nav link"
```

---

### Task 5: Rewrite page banner (dramatic lime treatment)

**Files:**
- Modify: `frontend/src/styles.css` — `.page-banner`, `.page-banner-copy`, `.page-banner-visual` blocks

**Step 1: Replace the page banner section**:

```css
.page-banner {
  display: grid;
  grid-template-columns: 1.2fr minmax(260px, 0.8fr);
  gap: 1rem;
  align-items: center;
  border-radius: var(--radius-lg);
  border-top: 3px solid var(--lime);
  border-left: 1px solid var(--border-dim);
  border-right: 1px solid var(--border-dim);
  border-bottom: 1px solid var(--border-dim);
  background:
    radial-gradient(ellipse at -10% 50%, rgba(165, 250, 1, 0.18), transparent 55%),
    var(--bg);
  padding: 1.6rem 1.5rem;
  animation: fadeUp 720ms ease both;
}

.page-banner-copy {
  display: grid;
  gap: 0.4rem;
}

.page-banner h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.2vw, 2.1rem);
  font-weight: 800;
  color: var(--lime);
  letter-spacing: -0.02em;
}

.page-banner p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.98rem;
}

.page-banner-visual {
  margin: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  position: relative;
  animation: bannerSwap 320ms ease both;
}

.page-banner-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.25));
  pointer-events: none;
}

.page-banner-visual img {
  width: 100%;
  aspect-ratio: 16 / 8;
  object-fit: cover;
  display: block;
  filter: brightness(0.85) saturate(0.9);
}

.page-content {
  display: grid;
  gap: 1rem;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dramatic dark banner with lime glow + lime headline"
```

---

### Task 6: Rewrite panels + stat cards + history cards

**Files:**
- Modify: `frontend/src/styles.css` — `.panel`, `.stats-grid`, `.stat-card`, `.history-*` blocks

**Step 1: Replace these sections**:

```css
.panel {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 1.3rem;
  overflow: hidden;
}

.panel-heading {
  display: grid;
  gap: 0.22rem;
  margin-bottom: 1rem;
}

.panel-heading h2 {
  margin: 0;
  font-size: clamp(1.2rem, 1.7vw, 1.5rem);
  font-weight: 700;
  color: var(--text);
}

.panel-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  border: 1px solid var(--border);
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 1rem;
  transition: border-color 200ms ease;
}

.stat-card:hover {
  border-color: var(--lime-border);
}

.stat-card h3 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card p {
  margin: 0.4rem 0 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--lime);
}

.history-list {
  display: grid;
  gap: 0.72rem;
  margin-top: 1rem;
}

.history-list h3 {
  margin: 0;
  color: var(--text);
}

.history-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.9rem;
  background: var(--surface-2);
  transition: border-color 180ms ease;
}

.history-card:hover {
  border-color: var(--lime-border);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.history-header h4 {
  margin: 0;
  color: var(--text);
}

.history-header span {
  font-size: 0.84rem;
  color: var(--text-muted);
  font-weight: 600;
}

.history-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.38rem;
}

.history-card li {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: baseline;
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: 0.3rem;
  color: var(--text-muted);
}

.history-card li strong {
  color: var(--text);
}

.history-card li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark panels, stat cards with lime numbers, dark history cards"
```

---

### Task 7: Rewrite forms + buttons

**Files:**
- Modify: `frontend/src/styles.css` — `form`, `input`, `select`, `button`, `.ghost-btn`, `.danger-btn`, `.delete-btn`, `.button-row`, `.field-error` blocks

**Step 1: Replace these sections**:

```css
form {
  display: grid;
  gap: 0.72rem;
}

.inline-form {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: center;
  margin-bottom: 0.9rem;
}

.workout-form label {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
}

input,
select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  font: inherit;
  font-size: 0.95rem;
  padding: 0.68rem 0.78rem;
  background: var(--surface-2);
  color: var(--text);
  transition: 170ms ease;
}

input::placeholder {
  color: var(--text-dim);
}

select option {
  background: var(--surface-2);
  color: var(--text);
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--lime);
  box-shadow: 0 0 0 3px var(--lime-bg);
}

button {
  width: 100%;
  border-radius: 100px;
  border: none;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 0.75rem 1.4rem;
  background: var(--lime);
  color: #000;
  cursor: pointer;
  transition: 180ms ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px var(--lime-glow);
}

button:active {
  transform: translateY(0);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  transform: none;
  box-shadow: none;
}

.ghost-btn {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  font-weight: 600;
}

.ghost-btn:hover {
  color: var(--text);
  border-color: var(--border);
  background: var(--surface-2);
  box-shadow: none;
}

.button-row {
  display: flex;
  gap: 0.58rem;
}

.danger-btn {
  background: #ef4444;
  color: #fff;
}

.danger-btn:hover {
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
}

.delete-btn {
  width: auto;
  padding: 0.25rem 0.55rem;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  line-height: 1;
  font-weight: 600;
  transition: 150ms ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  transform: none;
  box-shadow: none;
}

.field-error {
  color: var(--warn);
  font-size: 0.82rem;
  margin: 0.2rem 0 0;
  font-weight: 600;
}

input.invalid,
select.invalid {
  border-color: var(--warn);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: lime pill buttons, dark inputs, dark ghost/delete buttons"
```

---

### Task 8: Rewrite exercise library + workout form components

**Files:**
- Modify: `frontend/src/styles.css` — `.exercise-tools`, `.library-*`, `.exercise-library-*`, `.set-*`, `.chip-*`, `.table-wrap`, `table`, `th`, `td` blocks

**Step 1: Replace these sections**:

```css
.exercise-tools {
  display: grid;
  gap: 0.72rem;
  margin-bottom: 1rem;
}

.library-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}

.library-summary article {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-2);
  padding: 0.72rem;
  display: grid;
  gap: 0.12rem;
}

.library-summary span {
  font-size: 0.75rem;
  color: var(--text-dim);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.library-summary strong {
  font-size: 1.34rem;
  font-weight: 800;
  color: var(--text);
}

.create-exercise-form {
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}

.library-filters {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.6rem;
}

.library-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.toggle-control {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.52rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

.toggle-control input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--lime);
}

.exercise-library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.exercise-library-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  padding: 0.7rem;
  background: var(--surface-2);
  display: grid;
  gap: 0.55rem;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.exercise-library-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  border-color: var(--lime-border);
}

.exercise-library-card img {
  width: 100%;
  border-radius: 10px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border: 1px solid var(--border);
  filter: brightness(0.9);
}

.exercise-library-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
}

.exercise-library-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.focus-line {
  color: var(--lime);
  font-weight: 600;
}

.exercise-empty {
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--surface-2);
  padding: 1.1rem;
  margin-bottom: 1rem;
}

.exercise-empty h3 {
  margin: 0 0 0.35rem;
  color: var(--text);
}

.exercise-empty p {
  margin: 0;
  color: var(--text-muted);
}

.chip-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.chip {
  font-size: 0.73rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: var(--lime-bg);
  color: var(--lime);
  border: 1px solid var(--lime-border);
  font-weight: 700;
}

.chip.muted {
  background: var(--surface-2);
  color: var(--text-muted);
  border-color: var(--border);
}

.set-grid {
  display: grid;
  gap: 0.72rem;
}

.set-row-card {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0.72rem;
  align-items: center;
  padding: 0.68rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.set-row-card img {
  width: 100%;
  border-radius: 8px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  filter: brightness(0.85);
}

.set-row-controls {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr) auto;
  gap: 0.5rem;
}

.table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
}

.table-wrap h3 {
  margin: 0;
  padding: 0.9rem 0.9rem 0;
  color: var(--text);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  border-bottom: 1px solid var(--border-dim);
  padding: 0.68rem 0.9rem;
  color: var(--text-muted);
}

th {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  text-transform: uppercase;
  font-weight: 700;
}

td {
  color: var(--text);
}
```

**Step 2: Build check**

```bash
cd frontend && npm run build
```

**Step 3: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark exercise library, workout form, chips, table"
```

---

### Task 9: Rewrite auth pages

**Files:**
- Modify: `frontend/src/styles.css` — `.auth-shell`, `.auth-brand`, `.auth-card`, `.subtitle` blocks

**Step 1: Replace the auth section**:

```css
.auth-shell {
  width: min(1100px, calc(100% - 2.6rem));
  margin: 1.8rem auto;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1.1rem;
  align-items: stretch;
}

.auth-brand {
  border-radius: var(--radius-lg);
  padding: 2.4rem;
  background:
    radial-gradient(ellipse at -5% 50%, rgba(165, 250, 1, 0.16), transparent 55%),
    var(--bg);
  border: 1px solid var(--border-dim);
  border-left: 3px solid var(--lime);
  color: var(--text);
  animation: fadeUp 600ms ease both;
}

.auth-brand h1 {
  margin: 1rem 0 0.75rem;
  line-height: 1.2;
  font-size: clamp(1.5rem, 2.6vw, 2.4rem);
  font-weight: 800;
  color: var(--lime);
  letter-spacing: -0.02em;
}

.auth-brand p {
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
}

.auth-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 2rem;
  background: var(--surface);
  animation: fadeUp 800ms ease both;
}

.auth-card h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0.32rem 0 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark auth pages with lime left accent + lime heading"
```

---

### Task 10: Rewrite progress result card + metrics + chart

**Files:**
- Modify: `frontend/src/styles.css` — `.result-card`, `.metrics-row`, `.status-line`, `.chart-wrap`, `.notice`, `.error`, `.metric-form` blocks

**Step 1: Replace these sections**:

```css
.result-card {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0.9rem;
  border-radius: var(--radius-md);
  padding: 0.8rem;
  border: 1px solid var(--border);
  background: var(--surface-2);
  animation: fadeUp 520ms ease both;
}

.result-card img {
  width: 100%;
  border-radius: 10px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  filter: brightness(0.85);
}

.result-card h3 {
  margin: 0;
  color: var(--text);
}

.status-line {
  margin: 0.35rem 0;
  color: var(--text-muted);
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  margin-top: 0.65rem;
}

.metrics-row div {
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 0.6rem;
  display: grid;
  gap: 0.2rem;
}

.metrics-row span {
  color: var(--text-dim);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metrics-row strong {
  font-size: 1.05rem;
  color: var(--lime);
  font-weight: 800;
}

.result-card.progressing {
  border-color: rgba(34, 197, 94, 0.3);
}

.result-card.plateau {
  border-color: rgba(239, 68, 68, 0.3);
}

.result-card.insufficient_data {
  border-color: var(--lime-border);
}

.chart-wrap {
  margin: 0.5rem 0 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  padding: 1rem 0.5rem 0.5rem;
}

.metric-form {
  margin-top: 0.5rem;
}

.notice {
  color: var(--ok);
  margin: 0 0 0.7rem;
  font-weight: 700;
}

.error {
  color: var(--warn);
  margin: 0 0 0.7rem;
  font-weight: 700;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark result card, lime metrics, dark chart wrap"
```

---

### Task 11: Rewrite utility components (toasts, dialog, empty state, 404)

**Files:**
- Modify: `frontend/src/styles.css` — `.toast-*`, `.dialog-*`, `.empty-state`, `.not-found-*` blocks

**Step 1: Replace these sections**:

```css
/* ── Toast ────────────────────────────────────────────────── */

.toast-container {
  position: fixed;
  top: 1.2rem;
  right: 1.2rem;
  z-index: 9999;
  display: grid;
  gap: 0.55rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.78rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.93rem;
  pointer-events: all;
  animation: toastIn 260ms ease both;
  max-width: 380px;
}

.toast-success {
  background: #0a1a0f;
  border-color: rgba(34, 197, 94, 0.35);
  color: #86efac;
}

.toast-error {
  background: #1a0a0a;
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.toast-info {
  background: #0d110a;
  border-color: var(--lime-border);
  color: var(--lime);
}

.toast-message {
  flex: 1;
}

.toast-close {
  width: auto;
  padding: 0 0.25rem;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  box-shadow: none;
  transform: none;
  line-height: 1;
  border-radius: 4px;
}

.toast-close:hover {
  opacity: 1;
  transform: none;
  box-shadow: none;
}

/* ── Empty State ──────────────────────────────────────────── */

.empty-state {
  text-align: center;
  padding: 2.4rem 1.5rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  margin: 0.5rem 0;
}

.empty-state-icon {
  font-size: 2.4rem;
  margin-bottom: 0.6rem;
}

.empty-state-title {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
  color: var(--text);
  font-weight: 700;
}

.empty-state-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.empty-state-cta {
  margin-top: 1rem;
}

/* ── Confirm Dialog ───────────────────────────────────────── */

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: fadeIn 180ms ease both;
}

.dialog-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.8rem;
  max-width: 400px;
  width: 100%;
  animation: fadeUp 240ms ease both;
}

.dialog-title {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: var(--text);
}

.dialog-message {
  margin: 0 0 1.4rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.dialog-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}

/* ── 404 Page ─────────────────────────────────────────────── */

.not-found-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg);
}

.not-found-card {
  text-align: center;
  max-width: 420px;
}

.not-found-code {
  font-size: clamp(5rem, 15vw, 8rem);
  font-weight: 800;
  line-height: 1;
  color: var(--lime);
  letter-spacing: -0.04em;
}

.not-found-card h1 {
  margin: 0.4rem 0 0.6rem;
  font-size: 1.6rem;
  color: var(--text);
}

.not-found-card p {
  color: var(--text-muted);
  margin: 0 0 1.5rem;
}

.not-found-link {
  display: inline-block;
  padding: 0.75rem 1.6rem;
  background: var(--lime);
  color: #000;
  border-radius: 100px;
  font-weight: 800;
  text-decoration: none;
  transition: 180ms ease;
}

.not-found-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px var(--lime-glow);
  color: #000;
}
```

**Step 2: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: dark toasts, empty states, dialog, 404 page"
```

---

### Task 12: Rewrite animations + responsive breakpoints

**Files:**
- Modify: `frontend/src/styles.css` — `@keyframes` and `@media` blocks, fade-in/stagger classes

**Step 1: Replace these sections**:

```css
/* ── Animations ───────────────────────────────────────────── */

.fade-in {
  animation: fadeUp 600ms ease both;
}

.stagger-item {
  animation: fadeUp 640ms ease both;
}

.stagger-item:nth-child(2) { animation-delay: 70ms; }
.stagger-item:nth-child(3) { animation-delay: 120ms; }
.stagger-item:nth-child(4) { animation-delay: 180ms; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes bannerSwap {
  from { opacity: 0.3; transform: translateY(8px) scale(0.985); }
  to   { opacity: 1;   transform: translateY(0) scale(1); }
}

@keyframes sideVisualSwap {
  from { opacity: 0.28; transform: scale(1.03); }
  to   { opacity: 1;    transform: scale(1); }
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Responsive ───────────────────────────────────────────── */

@media (max-width: 1280px) {
  .app-stage {
    width: min(1200px, calc(100% - 2rem));
    grid-template-columns: 1fr;
  }
  .side-visual { display: none; }
}

@media (max-width: 980px) {
  .app-stage {
    width: min(1200px, calc(100% - 1.8rem));
  }
  .auth-shell {
    grid-template-columns: 1fr;
    width: min(1100px, calc(100% - 1.8rem));
  }
  .set-row-card { grid-template-columns: 1fr; }
  .set-row-controls { grid-template-columns: 1fr; }
  .result-card { grid-template-columns: 1fr; }
  .page-banner { grid-template-columns: 1fr; }
  .main-nav { justify-content: flex-start; }
}

@media (max-width: 640px) {
  .topbar { padding: 0.8rem; }
  .logo-mark span { display: none; }
  .page-banner { padding: 1rem; }
  .panel { padding: 0.95rem; }
  .button-row { flex-direction: column; }
  .create-exercise-form,
  .library-filters,
  .inline-form { grid-template-columns: 1fr; }
  .library-toolbar { align-items: stretch; }
  .history-card li { flex-direction: column; align-items: flex-start; }
}
```

**Step 2: Final build check**

```bash
cd frontend && npm run build
```
Expected: clean build, 0 errors.

**Step 3: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: animations + responsive breakpoints for dark theme"
```

---

### Task 13: Update LogoMark SVG colors

**Files:**
- Modify: `frontend/src/components/LogoMark.jsx`

**Step 1: Replace the SVG gradient and colors**

The current SVG has orange→cyan gradient and a light-blue background rect. Update for dark theme:

```jsx
export default function LogoMark({ compact = false }) {
  return (
    <div className={`logo-mark${compact ? ' compact' : ''}`}>
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <defs>
          <linearGradient id="logoGradient" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5fa01" />
            <stop offset="1" stopColor="#d4ff70" />
          </linearGradient>
        </defs>
        <rect x="12" y="12" width="156" height="156" rx="40" fill="#111111" />
        <rect x="30" y="82" width="120" height="16" rx="8" fill="url(#logoGradient)" />
        <rect x="22" y="70" width="16" height="40" rx="7" fill="#a5fa01" />
        <rect x="142" y="70" width="16" height="40" rx="7" fill="#d4ff70" />
        <circle cx="90" cy="54" r="14" fill="#ffffff" />
        <rect x="76" y="68" width="28" height="44" rx="12" fill="#ffffff" />
      </svg>
      <div>
        <p>ForgeMode</p>
        {!compact && <span>Smart Gym Progress Tracker</span>}
      </div>
    </div>
  );
}
```

**Step 2: Build check**

```bash
cd frontend && npm run build
```

**Step 3: Commit**

```bash
git add frontend/src/components/LogoMark.jsx
git commit -m "style: update LogoMark SVG to lime gradient + dark background"
```

---

### Task 14: Final verification

**Step 1: Full build**

```bash
cd frontend && npm run build
```
Expected: 0 errors, 0 warnings about CSS.

**Step 2: Run backend tests to confirm no regressions**

```bash
cd backend && pytest -q
```
Expected: 12 passed (or more if new tests have been added), 0 failures.

**Step 3: Smoke test visually**

```bash
docker compose up --build
```

Open `http://localhost:5173` and verify:
- [ ] Login page: black bg, dark auth card, lime left accent on brand panel, lime "Sign In" pill button
- [ ] Register page: same dark treatment
- [ ] Nav: frosted black topbar, lime active link
- [ ] Page banner: black with lime glow on left, `h1` in lime
- [ ] Workouts: dark history cards, lime "Log Workout" pill
- [ ] Exercises: dark library grid, lime chips
- [ ] Body Metrics: dark chart, dark table
- [ ] Progress: dark result card, lime metric numbers
- [ ] Side panels: photos visible with dark border
- [ ] LogoMark: lime dumbbell icon on dark background

**Step 4: Final commit if any fixes needed**

```bash
git add -p
git commit -m "style: fix dark theme visual issues found in smoke test"
```

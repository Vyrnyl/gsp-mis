# GSP Management Information System — UI Rules

## 1. Purpose

This document extracts the design system implemented in [Gsp.html](Gsp.html) (a static HTML/CSS prototype of the portal) so that the same look, feel, and component conventions can be reproduced consistently when the system is rebuilt in Next.js + Tailwind CSS, per [architecture.md](architecture.md) and [project-overview.md](project-overview.md).

> ## The prototype is a baseline, not a ceiling
>
> `Gsp.html` establishes the **visual identity** — brand colors, the green/gold/blue/red accent hierarchy, card-based layout, rounded-and-soft feel. That identity is binding.
>
> Its **specific markup, class names, and layout choices are not.** The prototype is a rough static mockup: it has no loading states, no empty states, no pagination on any of its nine tables, broken mobile navigation, and two measurable contrast failures (§9). Reproducing it faithfully would ship those defects.
>
> **You are expected to improve on it.** Better layouts, denser or clearer information hierarchy, new components the prototype never had, smoother interactions — all welcome, provided you:
>
> 1. **Stay on the tokens** (§2). The palette and radius/shadow scale are the identity; don't introduce off-palette colors.
> 2. **Stay internally consistent.** One pattern for a given job across the whole app — an improvement applied to one screen must be applied to all its peers.
> 3. **Register what you invent** in [ui-registry.md](ui-registry.md) so the next session reuses it rather than inventing a third variant.
> 4. **Say what you changed and why** at the visual-verify gate, so the human reviewing it can judge the deviation.
>
> When the prototype and good design disagree, good design wins. When the prototype and the _brand identity_ disagree, raise it rather than silently diverging.

The prototype uses plain CSS with custom properties and utility classes. When porting to Tailwind, map the tokens and utilities below to `tailwind.config` theme extensions and keep component class names/behavior equivalent.

---

## 2. Design Tokens (CSS Custom Properties)

Defined on `:root` in `Gsp.html`:

| Token       | Value                        | Usage                                                                                       |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `--green`   | `#1a6b3c`                    | Primary brand green (GSP identity color) — headers, sidebar, primary buttons, active states |
| `--green2`  | `#2e8b57`                    | Secondary/lighter green — gradients paired with `--green`                                   |
| `--green3`  | `#d4edda`                    | Pale green tint — active/selected backgrounds, success badge bg, table avatar bg            |
| `--gold`    | `#c8a900`                    | Accent gold — stat cards, badges, borders                                                   |
| `--gold2`   | `#f0d000`                    | Bright gold — sidebar active border accent, notification/badge counts, donut chart segment  |
| `--red`     | `#c0392b`                    | Danger/error accent — delete buttons, error stat cards, notification dot                    |
| `--blue`    | `#1565c0`                    | Info accent — info stat cards, links, info toasts                                           |
| `--bg`      | `#f4f6f0`                    | App background (off-white/green-tinted)                                                     |
| `--white`   | `#fff`                       | Card/surface background                                                                     |
| `--gray`    | `#6c757d`                    | Secondary/muted text                                                                        |
| `--dark`    | `#212529`                    | Primary text color                                                                          |
| `--sidebar` | `220px`                      | Fixed sidebar width                                                                         |
| `--radius`  | `12px`                       | Standard card/element border radius                                                         |
| `--shadow`  | `0 4px 20px rgba(0,0,0,0.1)` | Standard card elevation shadow                                                              |

### Semantic / status colors (used inline, not tokenized)

| Purpose               | Background | Text      |
| --------------------- | ---------- | --------- |
| Success / green badge | `#d4edda`  | `#155724` |
| Error / red badge     | `#f8d7da`  | `#721c24` |
| Info / blue badge     | `#cce5ff`  | `#004085` |
| Warning / gold badge  | `#fff3cd`  | `#856404` |
| Neutral / gray badge  | `#e2e3e5`  | `#383d41` |

### Base reset

- `* { margin:0; padding:0; box-sizing:border-box; font-family:"Segoe UI", sans-serif; }`
- `body { background: var(--bg); color: var(--dark); min-height: 100vh; }`

---

## 3. Theme

- **Style**: Flat, card-based dashboard UI with soft shadows and rounded corners (organizational/NGO admin portal aesthetic).
- **Primary identity color**: Green (GSP brand), applied via gradients (`135deg`/`180deg`, `var(--green)` → `var(--green2)` or → `#1a5c34`).
- **Accent hierarchy**: Green (primary/success) → Gold (achievement/warning) → Blue (info) → Red (danger).
- **Typography**: System font stack `"Segoe UI", sans-serif`. No custom webfont.
- **Elevation**: Two shadow levels — standard `var(--shadow)` for cards/stat cards, heavier `0 20px 60px rgba(0,0,0,0.3)` for modals and the auth card.
- **Corner radius scale**: `8px`–`10px` (inputs/buttons) · `12px` (`--radius`, cards) · `16px`–`20px` (modals, auth card).
- **Motion**: Cheap, consistent transitions — `0.2s` default for hover states, `0.3s` for sliders/progress bars/fills, `0.5s` for bar chart growth. Hover lift pattern: `transform: translateY(-1px|-2px|-3px)` on buttons/cards.
- **Icons**: The prototype uses raw emoji (🏛️ ⛺ 🛡️ 👁 📅 📍 🔍 🚀 🎯). **Settled: these are replaced with `react-icons` components** — emoji render inconsistently across platforms and carry unpredictable accessible names. Pick icons that read as the same concept; don't hunt for literal emoji lookalikes.

---

## 4. Utility Classes

Small atomic helpers (Tailwind-like, but hand-rolled):

```
.hidden          display: none !important
.flex            display: flex
.flex-col        flex-direction: column
.items-center    align-items: center
.justify-center  justify-content: center
.justify-between justify-content: space-between
.gap-1 / .gap-2 / .gap-3   gap: 8px / 16px / 24px
.w-full          width: 100%
.mt-1 / .mt-2 / .mt-3      margin-top: 8px / 16px / 24px
.p-2 / .p-3      padding: 16px / 24px
.text-sm         font-size: 0.85rem
.text-lg         font-size: 1.1rem
.text-xl         font-size: 1.4rem
.text-2xl        font-size: 1.8rem
.font-bold       font-weight: 700
.font-semibold   font-weight: 600
.rounded         border-radius: var(--radius)
.truncate        white-space: nowrap; overflow: hidden; text-overflow: ellipsis
```

**Tailwind mapping note**: these correspond almost 1:1 to Tailwind utilities (`hidden`, `flex`, `flex-col`, `items-center`, `justify-center`, `justify-between`, `gap-2/4/6`, `w-full`, `mt-2/4/6`, `p-4/6`, `text-sm/lg/xl/2xl`, `font-bold/semibold`, `truncate`) — when rebuilt with Tailwind CSS these should be replaced by native utilities rather than re-declared, keeping only `--radius`/brand tokens as `theme.extend` values.

### Badge pill utility

```
.badge        inline-block, padding: 2px 10px, border-radius: 20px, font-size: 0.75rem, font-weight: 600
.badge-green  bg #d4edda / text #155724
.badge-red    bg #f8d7da / text #721c24
.badge-blue   bg #cce5ff / text #004085
.badge-gold   bg #fff3cd / text #856404
.badge-gray   bg #e2e3e5 / text #383d41
```

---

## 5. Layout Structure

### Auth screen (`#authScreen`)

- Full-viewport centered flex container, green diagonal gradient background (`135deg, #1a6b3c 0% → #2e8b57 50% → #1a5c34 100%`).
- `.auth-card`: white, `20px` radius, heavy shadow, max-width `500px`.
- `.auth-header`: green gradient banner with circular `.trefoil` logo image, title, tagline.
- `.auth-tabs`: two-tab switch (Log In / Sign Up), active tab underlined in green.
- `.role-selector`: 3 segmented `.role-btn` cards (Executive Council 🏛️ / Troop Leader ⛺ / Registration Processor/Admin 🛡️) — active state = green border + `--green3` bg + green text.

### App screen (`#appScreen`)

- Two-column layout: fixed `.sidebar` (220px, green vertical gradient) + `.main-content` (flex:1, `margin-left: var(--sidebar)`).
- `.sidebar`: logo block, scrollable `.sidebar-nav` (section labels + `.nav-item` rows with icon, label, optional `.badge-count`), `.sidebar-footer` (user avatar/name/role + `.logout-btn`).
- `.nav-item.active`: translucent white bg, gold-2 left border (`3px`), bold text.
- `.main-content` → sticky `.topbar` (title left; search input, notification bell w/ `.notif-dot`, on the right) → scrollable `.page-content` (28px padding) containing one `.page` at a time (`.page.active { display:block }`, others `display:none` — client-side view switching, no router in prototype).

### Responsive breakpoints

The prototype is **desktop-first** — every query is `max-width`, styles cascade down from the desktop layout. There are **three** breakpoints, not two:

| Breakpoint | What changes                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `≤ 900px`  | `.grid-2` and `.grid-3` collapse to a single column                                                                                                                                                                                                                                                |
| `≤ 768px`  | Sidebar goes off-canvas (`transform: translateX(-100%)`; `.sidebar.open` slides it back). `.main-content` margin-left → 0. `.stats-grid` → 2 columns. `.topbar` padding → 12px 16px. `.page-content` padding → 16px. `.topbar-search` width → 140px. `.form-row` and `.modal .form-row` → 1 column |
| `≤ 480px`  | `.stats-grid` → 1 column                                                                                                                                                                                                                                                                           |

**Verify at all three** — checking only 768/480 misses the `.grid-2`/`.grid-3` collapse.

### Intrinsically responsive patterns (no media query needed)

These carry much of the responsive behavior and must be preserved in the port:

| Pattern                                                        | Where                                                        | Effect                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` | `.stats-grid`                                                | Reflows stat cards by available width                                                      |
| `repeat(auto-fill, minmax(120px, 1fr))`                        | `.badge-grid`                                                | Reflows badge cards                                                                        |
| `overflow-x: auto`                                             | `.table-wrapper`                                             | **All tables scroll horizontally rather than breaking layout** — never remove this wrapper |
| `flex-wrap: wrap`                                              | `.page-header-row`, `.donut-wrap`, filter/action button rows | Controls wrap onto new lines                                                               |
| `width: 100%` + `max-width`                                    | `.auth-card` (500px), `.modal` (560px)                       | Fluid until capped                                                                         |
| `max-height: 90vh` + `overflow-y: auto`                        | `.modal`                                                     | Long modals scroll instead of overflowing the viewport                                     |

> Note: `.stats-grid` has both `auto-fill` **and** explicit column overrides at 768/480. The media queries win at those widths — this is intentional, giving exactly 2-up then 1-up rather than letting `auto-fill` decide.

### ⚠ Known responsive defects in the prototype — fix during the port

Do **not** copy these faithfully:

1. **The mobile menu button never appears.** `#menuToggle` (the ☰ in the topbar) carries inline `display: none` and _nothing_ ever overrides it — there is no media query and no JS that shows it. Below 768px the sidebar hides and **cannot be reopened**; `toggleSidebar()` is dead code. **Fix**: show the toggle at `≤768px` and hide it above.
2. **No backdrop when the sidebar is open on mobile.** The open sidebar overlays content with no dimmed overlay and no tap-outside-to-close. **Fix**: add a backdrop that closes the sidebar on click.
3. **No scroll lock** behind the open mobile sidebar — the page scrolls underneath it.
4. **No focus management** on the off-canvas sidebar or modals (focus isn't trapped or restored). **Fix** while building, per the accessibility line in [build-plan.md](build-plan.md) §4.

### Porting breakpoints to Tailwind

Tailwind's defaults are **mobile-first `min-width`**, the opposite of this prototype, and **900px is not a Tailwind breakpoint at all** (`md` = 768px, `lg` = 1024px). Two options — pick one and apply it consistently:

- **Preferred — rewrite mobile-first**: express the mobile layout as the base and add `md:` / `lg:` for larger screens. Add a custom `screens` entry for the 900px case (e.g. `'lg2': '900px'`) or fold it into `lg`.
- **Alternative — keep desktop-first**: configure `screens` with `max-*` variants (`{'max-lg2': {'max':'900px'}, 'max-md': {'max':'768px'}, 'max-sm': {'max':'480px'}}`) to mirror the prototype exactly.

Whichever is chosen, record it here and in [ui-registry.md](ui-registry.md) so components don't drift between conventions.

> ### ✅ Settled 2026-07-22 (Phase 0.2): **mobile-first**
>
> The port uses the preferred option — mobile is the base layer, `min-width` variants add the larger layouts back. The same three breakpoints survive, inverted:
>
> | Tailwind screen | Width   | Replaces the prototype's                  |
> | --------------- | ------- | ----------------------------------------- |
> | _(base)_        | < 480px | `≤480px` rules                            |
> | `xs`            | ≥ 480px | the layer between 480 and 768             |
> | `md`            | ≥ 768px | everything above the `≤768px` query       |
> | `lg2`           | ≥ 900px | the `≤900px` `.grid-2`/`.grid-3` collapse |
>
> `lg2` is a custom stop; Tailwind ships no 900px breakpoint. Screens are declared in `apps/web/src/shared/design/tokens.ts` and consumed by `tailwind.config.ts`.
>
> **Never write `max-*` variants.** One direction, everywhere. So `grid-2` is `grid-cols-1 lg2:grid-cols-2`, the sidebar is `-translate-x-full md:translate-x-0`, and stat grids go `grid-cols-1 xs:grid-cols-2 md:[auto-fill]`.

---

## 6. Component Styling Reference

| Component              | Class(es)                                                                                                                              | Notes                                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card                   | `.card`, `.card-header`, `.card-title`, `.card-subtitle`                                                                               | White bg, `var(--radius)`, `var(--shadow)`, `24px` padding                                                                                                                                                          |
| Stat card              | `.stats-grid`, `.stat-card` (+ `.green/.gold/.blue/.red`), `.stat-icon`, `.stat-info`                                                  | Auto-fill grid `minmax(200px,1fr)`; left color border (5px) keyed to variant; icon bg is the pale-tint version of the variant color; hover lifts `-2px`                                                             |
| Grid layouts           | `.grid-2`, `.grid-3`                                                                                                                   | Equal-width columns, `20px` gap, collapse to 1 col ≤900px                                                                                                                                                           |
| Buttons                | `.btn`, `.btn-sm`, `.btn-primary`, `.btn-green`, `.btn-outline`, `.btn-red`, `.btn-gold`, `.btn-blue`, `.btn-gray`                     | Base `.btn`: 9px/18px padding, 8px radius, inline-flex w/ icon gap. `.btn-primary` is full-width, larger, used only in auth forms (gradient bg + hover shadow/lift). Each color variant has a darker `:hover` shade |
| Table                  | `table`, `th`, `td`, `.table-wrapper`, `.table-avatar`                                                                                 | Uppercase letter-spaced `th`, row hover tint `#fafdf8`, circular initials avatar (`--green3` bg / `--green` text)                                                                                                   |
| Modal                  | `.modal-overlay`, `.modal`, `.modal-header`, `.modal-close`, `.modal-body`, `.modal-footer`                                            | Overlay: fixed, `rgba(0,0,0,.5)` + `blur(3px)`; modal: 16px radius, sticky header, footer right-aligned actions                                                                                                     |
| Form (auth + modal)    | `.form-group`, `.form-row`, `.toggle-eye`, `.strength-bar`/`.strength-fill`                                                            | Inputs: 1.5px border `#ddd`, 8–9px radius, green focus ring `rgba(46,139,87,.1-.12)`; `.form-row` = 2-col grid (1 col on mobile)                                                                                    |
| Alerts                 | `.alert`, `.alert-error`, `.alert-success`                                                                                             | Inline banner, red/green tint pairing matching badge colors                                                                                                                                                         |
| Progress bar           | `.progress-bar`, `.progress-fill`                                                                                                      | Track `#eee`, fill = green gradient, width set inline per value (`style="width:${w}%"`)                                                                                                                             |
| Avatar group           | `.avatar-group`, `.av`, `.av-more`                                                                                                     | Overlapping circular avatars (`-8px` negative margin), white border ring                                                                                                                                            |
| Activity feed          | `.activity-item`, `.activity-dot` (+ color), `.activity-text`, `.activity-time`                                                        | Timeline row with colored status dot and muted timestamp                                                                                                                                                            |
| Bar chart              | `.bar-chart`, `.bar-item`, `.bar`, `.bar-label`, `.bar-val`                                                                            | Flex column bars, height set inline (`style="height:${v}%"`), gradient fill, built via JS template strings                                                                                                          |
| Donut chart            | `.donut-wrap`, `.donut`, `.donut-inner`, `.donut-legend`, `.legend-item`, `.legend-dot`                                                | `.donut` uses CSS `conic-gradient` (no chart lib in prototype, despite ChartJS being the stated stack in [project-overview.md](project-overview.md))                                                                |
| Calendar               | `.cal-grid`, `.cal-day-name`, `.cal-day` (+ `.today`, `.has-event`, `.empty`)                                                          | 7-col grid; today = solid green pill; event days bolded green text                                                                                                                                                  |
| Notification panel     | `.notif-panel`, `.notif-header`, `.notif-item` (+ `.unread`), `.notif-icon` (+ `.green/.gold/.red`), `.notif-content`, `.notif-footer` | Absolute-positioned dropdown below bell icon; unread rows tinted `#f0faf4`                                                                                                                                          |
| Badge/achievement card | `.badge-grid`, `.badge-card` (+ `.earned`), `.badge-icon`, `.badge-name`, `.badge-cat`                                                 | Earned state = gold border + cream bg `#fffef0`                                                                                                                                                                     |
| Toast                  | `#toast`, `.toast-item` (+ `.success/.error/.info`), `@keyframes slideIn`                                                              | Fixed bottom-right stack, slide-in-from-right animation, color = green/red/blue                                                                                                                                     |
| Profile header         | `.profile-header`, `.profile-avatar-lg`, `.profile-info`, `.role-tag`                                                                  | Green gradient banner, large circular initials avatar, pill role tag                                                                                                                                                |
| Settings               | `.settings-section`, `.settings-row`, `.settings-label` (`.label-main`/`.label-sub`), `.toggle-switch`, `.slider`                      | iOS-style toggle switch (checkbox + `.slider` sibling pattern)                                                                                                                                                      |

---

## 7. Inline / Dynamic Styling Patterns

The prototype uses inline `style` attributes for values computed at runtime (JS template literals) rather than new classes. When rebuilding, these should become dynamic Tailwind classes or CSS-in-JS bound to data, not hardcoded styles:

- Bar chart bar height: `style="height:${v}%"`
- Progress fill width: `style="width:${w}%"`
- Conditional text color by threshold: `style="color:${a.absent === 0 ? 'var(--green)' : a.absent <= 2 ? 'var(--gold)' : 'var(--red)'}"` (e.g. attendance rate coloring)
- One-off grid overrides: `style="grid-template-columns:repeat(4,1fr)"` on `.stats-grid` for pages with a different stat-card count
- Small inline "code" pills for codes/IDs: `background:#f0f0f0; padding:2px 6px; border-radius:4px; font-size:.8rem`
- Ad hoc hover-lift on non-`.stat-card` cards via inline `onmouseover`/`onmouseout` setting `this.style.transform`

---

## 8. Scrollbar

Custom WebKit scrollbar: `6px` wide/tall, track `#f1f1f1`, thumb `#c1c1c1` (hover `#aaa`), `3px` radius.

---

## 9. Accessibility Requirements

The prototype is **not** accessible. These are corrections to make during the port, not optional polish.

### Measured contrast failures — must fix

WCAG AA requires **4.5:1** for normal text, **3:1** for large text and UI boundaries.

| Usage                                                              | Contrast   | Verdict        | Fix                                                                                 |
| ------------------------------------------------------------------ | ---------- | -------------- | ----------------------------------------------------------------------------------- |
| `#aaa` on white — `.activity-time`, `.notif-time`, `.divider span` | **2.32:1** | ❌ Fails badly | Use `var(--gray)` `#6c757d` (4.76:1) for timestamps and meta text                   |
| White text on `--gold` `#c8a900` — `.btn-gold`                     | **2.30:1** | ❌ Fails badly | Darken to ~`#8a7500` for white text, or keep the gold fill with `#3d3400` dark text |
| `var(--gray)` `#6c757d` on white                                   | 4.76:1     | ✅ Passes AA   | Keep — this is the correct muted-text token                                         |
| `var(--green)` `#1a6b3c` on white                                  | 6.62:1     | ✅ Passes AA   | Keep                                                                                |

> `--gold` and `--gold2` are **decorative** — safe as borders, fills, chart segments, and accents. They are **not safe as text colors on light backgrounds**, and white text on them fails. The `.badge-gold` pairing (`#856404` on `#fff3cd`) is fine.

### Structural requirements

- **Semantic landmarks.** The prototype has essentially none — everything is `<div>`. Use `<nav>` for the sidebar, `<main>` for page content, `<header>` for the topbar, `<h1>`–`<h3>` in real hierarchy.
- **Never `outline: none` without a replacement.** The prototype does this 3×. Every interactive element needs a visible `:focus-visible` ring — the green focus ring in §2 is the house style.
- **Focus management**: modals trap focus and restore it on close; the off-canvas sidebar traps focus while open.
- **Keyboard operable**: every action reachable by mouse must be reachable by keyboard. The prototype's 89 inline `onclick` handlers sit on `<div>`s in several places — those become real `<button>`s.
- **Labels tied to inputs** via `htmlFor`/`id`. Icon-only buttons get `aria-label`.
- **Live regions**: toasts and async status announced via `aria-live` so they aren't silent to screen readers.
- **Tables**: real `<th scope="col">`, caption or accessible name.

---

## 10. Sanctioned Enhancements

The prototype omits these entirely. Building them is **expected**, not scope creep — several are already required by the Definition of Done in [build-plan.md](build-plan.md) §3.

| Gap in prototype                       | What to build                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No loading states anywhere**         | Skeleton loaders matching each component's shape (table rows, cards, chart areas). Prefer skeletons over spinners for content areas                   |
| **No empty states on any of 9 tables** | An empty-state component: icon, short explanation, and a primary action ("Register the first member")                                                 |
| **No error states**                    | Inline error panel with a retry action, distinct from the destructive-red alert                                                                       |
| **No pagination on any table**         | Pagination or virtualized scrolling. The prototype's own dashboard claims **1,240 members** while rendering an unpaginated table — that will not hold |
| **No sorting on tables**               | Sortable column headers where the data warrants it                                                                                                    |
| **Broken mobile navigation**           | Working toggle + backdrop + scroll lock (§5)                                                                                                          |
| **No dark mode**                       | Optional, but design tokens should be structured so it stays possible — prefer semantic token names over literal color names where practical          |
| **No confirm dialogs**                 | Destructive actions (delete, archive, reject) need confirmation, not a bare button                                                                    |
| **No form-level validation display**   | Field-level error text and summary, per the both-sides validation rule                                                                                |
| **Fixed 320px notification panel**     | Make it responsive; verify at 360px viewports                                                                                                         |

Add anything you build here to [ui-registry.md](ui-registry.md).

---

## 11. Recommendations for Next.js/Tailwind Port

- Move all `:root` tokens into `tailwind.config.js` under `theme.extend.colors` (e.g. `brand.green`, `brand.gold`, `brand.blue`, `brand.red`) and `theme.extend.borderRadius`/`boxShadow` for `--radius`/`--shadow`.
- Drop the hand-rolled utility classes (`.flex`, `.gap-2`, `.text-sm`, etc.) in favor of native Tailwind utilities — they are direct duplicates.
- Convert emoji icons to `react-icons` equivalents if a consistent icon system is required (per [project-overview.md](project-overview.md) frontend stack), or intentionally keep emoji as a lightweight design decision — needs a decision, not currently reconciled.
- Replace the CSS `conic-gradient` donut and JS-built bar chart with actual ChartJS components (`react-chartjs-2`) since ChartJS is the declared analytics library, but keep the same color mapping (green/gold-2/blue segments) and card/legend layout.
- Preserve component naming (`stat-card`, `card`, `badge`, `btn-*`, `nav-item`, `modal-*`) as a naming convention for the equivalent React components/CSS modules so this doc stays a valid cross-reference after the port.

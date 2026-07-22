/**
 * GSP design tokens — the single source of truth for the palette.
 *
 * Ported from the `:root` block of `context/Gsp.html` per ui-rules.md §2, with the
 * §9 accessibility corrections applied:
 *   - `#aaa` muted text is NOT ported (2.32:1). Use `muted` (#6c757d, 4.76:1) instead.
 *   - White on `--gold` (#c8a900) is NOT ported (2.30:1). `goldInk` (#8a7500, 4.54:1)
 *     is the only gold safe to put white text on.
 *
 * Names are semantic where practical so a dark theme stays possible (ui-rules.md §10).
 * `tailwind.config.ts` imports this file; `globals.css` mirrors it as CSS custom
 * properties for the few places that need raw CSS.
 */

export const palette = {
  /** Primary GSP brand green — headers, sidebar, primary buttons, active states. */
  green: '#1a6b3c',
  /** Lighter green, paired with `green` in gradients. */
  green2: '#2e8b57',
  /** Pale green tint — selected rows, success badges, table avatars. */
  green3: '#d4edda',
  /** Darkest green — bottom of the sidebar/auth gradients. */
  green4: '#1a5c34',
  /** Hover shade for solid green buttons. */
  greenHover: '#155f35',

  /** Decorative gold — borders, fills, chart segments. Never text on white. */
  gold: '#c8a900',
  /** Bright gold — sidebar active border, badge counts, chart segment. */
  gold2: '#f0d000',
  /** AA-safe gold (4.54:1 vs white) — the only gold that may carry white text. */
  goldInk: '#8a7500',
  /** Hover shade for `goldInk` buttons. */
  goldInkHover: '#6f5e00',

  red: '#c0392b',
  redHover: '#a93226',
  blue: '#1565c0',
  blueHover: '#0d47a1',

  /** App background — off-white with a green tint. */
  bg: '#f4f6f0',
  /** Card / panel surface. */
  surface: '#ffffff',
  /** Muted secondary text (4.76:1 on white) — replaces every `#aaa` in the prototype. */
  muted: '#6c757d',
  /** Primary text. */
  ink: '#212529',
  /** Slightly lifted ink for form labels. */
  ink2: '#444444',
  /** Neutral button fill. */
  subtle: '#e9ecef',
  subtleHover: '#dee2e6',
  /** Text on neutral fills. */
  inkSubtle: '#495057',

  /** Hairlines and input borders. */
  border: '#dddddd',
  borderSubtle: '#eeeeee',
  borderFaint: '#f5f5f5',
  /** Table header background. */
  headerBg: '#f8f9fa',
  /** Table row hover tint. */
  rowHover: '#fafdf8',
  /** Skeleton / inert track fill. */
  track: '#eeeeee',
} as const;

/** Status pill + alert pairings (ui-rules.md §2 "Semantic / status colors"). */
export const statusColors = {
  successBg: '#d4edda',
  successFg: '#155724',
  successBorder: '#c3e6cb',
  dangerBg: '#f8d7da',
  dangerFg: '#721c24',
  dangerBorder: '#f5c6cb',
  infoBg: '#cce5ff',
  infoFg: '#004085',
  warningBg: '#fff3cd',
  warningFg: '#856404',
  neutralBg: '#e2e3e5',
  neutralFg: '#383d41',
} as const;

export const layout = {
  /** Fixed sidebar width (ui-rules.md §2 `--sidebar`). */
  sidebarWidth: '220px',
} as const;

export const radii = {
  /** `--radius` — cards, stat cards, panels. */
  card: '12px',
  /** Buttons and small controls. */
  control: '8px',
  /** Form inputs. */
  field: '9px',
  /** Modals. */
  modal: '16px',
  /** Auth card. */
  auth: '20px',
} as const;

export const shadows = {
  /** `--shadow` — standard card elevation. */
  card: '0 4px 20px rgba(0, 0, 0, 0.1)',
  /** Modals and the auth card. */
  overlay: '0 20px 60px rgba(0, 0, 0, 0.3)',
  /** Dropdown panels (notifications). */
  panel: '0 8px 30px rgba(0, 0, 0, 0.15)',
  /** Sticky topbar. */
  topbar: '0 2px 8px rgba(0, 0, 0, 0.05)',
  /** Toasts. */
  toast: '0 4px 20px rgba(0, 0, 0, 0.2)',
  /** Green focus ring — the house style, required wherever outline is removed. */
  focus: '0 0 0 3px rgba(46, 139, 87, 0.35)',
  /** Softer ring used inside inputs alongside a green border. */
  field: '0 0 0 3px rgba(46, 139, 87, 0.12)',
} as const;

/**
 * Breakpoints — mobile-first (ui-rules.md §5 "Preferred" option).
 *
 * The prototype is desktop-first with max-width queries at 900 / 768 / 480.
 * We invert them: mobile is the base layer, and these min-width screens add the
 * larger layouts back. `lg2` is the custom 900px stop Tailwind does not ship.
 */
export const screens = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg2: '900px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

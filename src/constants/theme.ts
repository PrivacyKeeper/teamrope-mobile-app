// src/constants/theme.ts
//
// Read from the live teamrope.pro stylesheet rather than from the spine
// document. Where the two disagree the shipped site wins: a user opening
// the app straight off the website should not feel a colour change.

export const colors = {
  background: '#150e09',
  surface: '#1f1610',
  card: '#281d15',
  border: '#43332561',
  text: '#e0d2bd',
  muted: '#b09a82',
  accent: '#d2803f',
  accentAlt: '#f3e7d3',
  cream: '#f3e7d3',
  success: '#4ba36b',
  warning: '#d99a2b',
  danger: '#c8503f',
} as const;

export const app = {
  name: "Team Roping",
  short: "TeamRope",
  domain: "teamrope.pro",
  eventType: "teamroping",
  /**
   * The event_type codes this app covers, EXACTLY as they appear in the
   * `reference_options` table.
   *
   * Deliberately separate from `eventType` above, which is the app's own slug
   * and does not match the database ("tiedown" vs "tie_down_roping"). Reusing
   * the slug as a filter silently matched nothing: the query succeeded, the
   * screen said the producer was not running this event, and there was no
   * error anywhere to notice.
   *
   * An array because the mapping is genuinely one-to-many. Team roping is two
   * rows, header and heeler, and a heeler who only saw the header rows would
   * conclude they had not been entered. Ranch rodeo is a whole card of events
   * rather than one.
   */
  eventCodes: ["team_roping_header", "team_roping_heeler"] as readonly string[],
  eventLabel: "Team roping",
  tagline: "Find the partner. Know the number.",
  associations: ["USTRC","WSTR","PRCA","ACTRA"] as readonly string[],
} as const;

// Spacing follows the house rule from the BarrelConnect cursor rules:
// screens px-5 py-6 gap-y-6, cards p-4 rounded-2xl gap-y-2.
export const spacing = { screenX: 20, screenY: 24, gap: 24, cardPad: 16 } as const;
export const radius = { card: 16, pill: 999, control: 12 } as const;

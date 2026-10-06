/**
 * The Theme pages render straight from the TypeScript theme that
 * `_tokens.scss` is generated from — the way Fluent's docsite renders from
 * `webLightTheme` — so they cannot drift from what the components consume.
 */
import { responsiveOverrides, saturdazeLightTheme } from '../../../../src/lib/tokens';

/** One-line usage notes for the tokens whose role isn't obvious from the name. */
const notes = {
  colorNeutralForeground1: 'Body ink',
  colorNeutralForeground2: 'Secondary text and metadata',
  colorNeutralForeground3: 'Hints, placeholders, disabled text',
  colorNeutralBackground1: 'Cards, dialogs, inputs',
  colorNeutralBackground2: 'The page — warm cream, like a kitchen mid-morning',
  colorNeutralBackground3: 'Recessed wells, locked blocks',
  colorNeutralBackgroundInverted: 'Selected filter chip',
  colorBackgroundOverlay: 'CDK dialog backdrop',
  colorNeutralStrokeAccessible: 'Grab handles and placeholder dots',
  colorBrandBackground: 'The one coral button per screen',
  colorBrandForeground2: 'Coral text that passes AA on colorBrandBackground2',
  colorBrandBackgroundGradient: 'Landing hero and first-run card',
  colorStatusSuccessBackground3: 'Locked, confirmed, saved',
  colorStatusDangerBackground3: 'Destructive buttons — gentle, not alarming',
  layoutTopBarHeight: '≥720px sticky top bar',
  layoutBottomNavHeight: '<720px floating bottom nav',
  shadow4: 'Cards off the cream page',
  shadow16: 'Hover and floating chrome (the bottom nav)',
  shadow28: 'Dialogs and menus',
};

/** Every theme token: `{ name, value, note }`, in theme order. */
export const tokens = Object.entries(saturdazeLightTheme).map(([name, value]) => ({
  name,
  value,
  note: notes[name] ?? '',
}));

/** Responsive retunes: `[{ query, tokens: [{ name, value }] }]`. */
export const overrides = responsiveOverrides.map((o) => ({
  query: o.media,
  tokens: Object.entries(o.tokens).map(([name, value]) => ({ name, value })),
}));

export function byPrefix(...prefixes) {
  return tokens.filter((t) => prefixes.some((p) => t.name.startsWith(p)));
}

export function overridesFor(name) {
  return overrides.flatMap((o) =>
    o.tokens.filter((t) => t.name === name).map((t) => ({ query: o.query, value: t.value })),
  );
}

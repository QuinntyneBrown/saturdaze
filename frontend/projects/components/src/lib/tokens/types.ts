/**
 * Saturdaze design-token types, modelled on `@fluentui/tokens`.
 *
 * Tokens come in three layers, exactly as in Fluent UI v9:
 *
 * 1. **Global** (`global/`) — raw, theme-independent values: the coral brand
 *    ramp, the named colour palettes, and the type, spacing, radius, stroke,
 *    motion, layout and z-index ramps.
 * 2. **Alias** (`alias/`) — semantic colour tokens (`colorNeutralForeground1`,
 *    `colorBrandBackground`, …) that a theme computes from the globals. A
 *    component only ever reads alias and ramp tokens, never a palette value.
 * 3. **Theme** (`themes/`) — the flat {@link Theme} object that
 *    `createLightTheme(brand)` assembles. Its keys are the CSS custom property
 *    names (`--colorNeutralForeground1`), its values are what they hold.
 */

/** A 16-step brand ramp, 10 (darkest) → 160 (lightest), as in Fluent. */
export interface BrandVariants {
  10: string;
  20: string;
  30: string;
  40: string;
  50: string;
  60: string;
  70: string;
  80: string;
  90: string;
  100: string;
  110: string;
  120: string;
  130: string;
  140: string;
  150: string;
  160: string;
}

/** The shades a global palette defines (Fluent's `ColorVariants`, trimmed). */
export interface ColorVariants {
  shade40: string;
  /** Solid glyphs that need 3:1 on white (WCAG 1.4.11); Foreground3 falls back to `primary`. */
  shade20?: string;
  primary: string;
  tint50: string;
}

/** Neutral foreground, background and stroke tokens plus brand roles. */
export interface ColorTokens {
  colorNeutralForeground1: string;
  colorNeutralForeground2: string;
  colorNeutralForeground3: string;
  colorNeutralForegroundDisabled: string;
  colorNeutralForegroundOnBrand: string;

  colorNeutralBackground1: string;
  colorNeutralBackground2: string;
  colorNeutralBackground3: string;
  colorNeutralBackgroundInverted: string;
  colorBackgroundOverlay: string;
  colorBackgroundOverlayStrong: string;

  colorNeutralStroke1: string;
  colorNeutralStroke2: string;
  colorNeutralStrokeAccessible: string;
  colorStrokeFocus2: string;

  colorBrandForeground1: string;
  colorBrandForeground2: string;
  colorBrandBackground: string;
  colorBrandBackgroundHover: string;
  colorBrandBackgroundStatic: string;
  colorBrandBackground2: string;
  colorBrandBackgroundGradient: string;
  colorBrandStroke1: string;
  colorBrandStroke2: string;

  colorNeutralShadowAmbient: string;
  colorNeutralShadowKey: string;
  colorNeutralShadowKeyDarker: string;
}

type PaletteRoles =
  | 'Background1'
  | 'Background3'
  | 'Foreground1'
  | 'Foreground3'
  | 'Border1'
  | 'BorderActive';

/** The four weather & category tones chips, discs and avatars paint with. */
export type PaletteName = 'Sun' | 'Sky' | 'Leaf' | 'Indoor';

/**
 * Per-tone alias tokens: `Background1` is the soft fill, `Foreground1` the
 * ink that passes AA on it, `Background3`/`Foreground3` the saturated base.
 */
export type ColorPaletteTokens = Record<`colorPalette${PaletteName}${PaletteRoles}`, string>;

/** Feedback states: success is "locked / confirmed", danger is the gentle warning. */
export type StatusName = 'Success' | 'Danger';

export type ColorStatusTokens = Record<`colorStatus${StatusName}${PaletteRoles}`, string>;

export interface FontFamilyTokens {
  fontFamilyBase: string;
  fontFamilyMonospace: string;
}

export interface FontSizeTokens {
  fontSizeBase200: string;
  fontSizeBase300: string;
  fontSizeBase350: string;
  fontSizeBase400: string;
  fontSizeBase500: string;
  fontSizeBase600: string;
  fontSizeHero700: string;
  fontSizeHero800: string;
}

export interface LineHeightTokens {
  lineHeightNone: string;
  lineHeightTight: string;
  lineHeightSnug: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
}

export interface FontWeightTokens {
  fontWeightRegular: string;
  fontWeightMedium: string;
  fontWeightSemibold: string;
  fontWeightBold: string;
}

/** The 4px spacing ramp, shared by both axes. */
export interface SpacingTokens {
  none: string;
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
  xxl: string;
  xxxl: string;
  xxxxl: string;
  xxxxxl: string;
}

type SpacingSuffix = 'None' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'XXXXL' | 'XXXXXL';

export type HorizontalSpacingTokens = Record<`spacingHorizontal${SpacingSuffix}`, string>;
export type VerticalSpacingTokens = Record<`spacingVertical${SpacingSuffix}`, string>;

export interface BorderRadiusTokens {
  borderRadiusNone: string;
  borderRadiusSmall: string;
  borderRadiusMedium: string;
  borderRadiusLarge: string;
  borderRadiusXLarge: string;
  borderRadiusCircular: string;
}

export interface StrokeWidthTokens {
  strokeWidthThin: string;
  strokeWidthThick: string;
}

export interface ShadowTokens {
  shadow4: string;
  shadow16: string;
  shadow28: string;
}

export interface DurationTokens {
  durationFast: string;
  durationNormal: string;
}

export interface CurveTokens {
  curveEasyEase: string;
}

/** Saturdaze extension: the v2 responsive shell's dimensions (ADR-009). */
export interface LayoutTokens {
  layoutContentMaxWidth: string;
  layoutStackMaxWidth: string;
  layoutGutter: string;
  layoutTopBarHeight: string;
  layoutBottomNavHeight: string;
}

/** The z ladder for sticky regions and shell chrome; the CDK overlay keeps its own 1000. */
export interface ZIndexTokens {
  zIndexSticky: string;
  zIndexTopBar: string;
  zIndexBottomNav: string;
}

export type Theme = ColorTokens &
  ColorPaletteTokens &
  ColorStatusTokens &
  FontFamilyTokens &
  FontSizeTokens &
  LineHeightTokens &
  FontWeightTokens &
  HorizontalSpacingTokens &
  VerticalSpacingTokens &
  BorderRadiusTokens &
  StrokeWidthTokens &
  ShadowTokens &
  DurationTokens &
  CurveTokens &
  LayoutTokens &
  ZIndexTokens;

export type PartialTheme = Partial<Theme>;

/** A responsive retune: the tokens a theme overrides inside one media query. */
export interface ThemeOverride {
  media: string;
  tokens: PartialTheme;
}

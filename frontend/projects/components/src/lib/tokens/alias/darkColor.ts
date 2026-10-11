import {
  blackAlpha,
  coralDark,
  sunDark,
  umber,
  umberAlpha,
  white,
  whiteAlphaFaint,
} from '../global/colors';
import type { BrandVariants, ColorTokens } from '../types';

/**
 * Neutral and brand alias tokens for the dark theme: the same roles as
 * {@link generateColorTokens}, from the design system's dark theme. Warm
 * umber surfaces lighten as they rise (page, cards, wells); the primary
 * fill is a lighter coral with a dark label.
 */
export const generateDarkColorTokens = (brand: BrandVariants): ColorTokens => ({
  colorNeutralForeground1: umber[50], // body ink: 15.9:1 on the page
  colorNeutralForeground2: umber[200],
  colorNeutralForeground3: umber[300],
  colorNeutralForegroundDisabled: umber[600],
  colorNeutralForegroundOnBrand: coralDark[950],
  colorNeutralForegroundInverted: umber[850],
  colorNeutralForegroundStaticInverted: white, // text over a photo or its scrim, in any theme

  colorNeutralBackground1: umber[850],
  colorNeutralBackground2: umber[900],
  colorNeutralBackground3: umber[750],
  colorNeutralBackgroundInverted: umber[50],
  colorBackgroundOverlay: blackAlpha[60],
  colorBackgroundOverlayStrong: blackAlpha[72],
  colorNeutralStencil2Alpha: whiteAlphaFaint,

  colorNeutralStroke1: umberAlpha[18],
  colorNeutralStroke2: umberAlpha[10],
  colorNeutralStrokeAccessible: umber[400],
  colorStrokeFocus2: coralDark[300],

  colorBrandForeground1: coralDark[300],
  colorBrandForeground2: coralDark[200],
  colorBrandBackground: coralDark[300],
  colorBrandBackgroundHover: coralDark[200], // lighter, so the dark label gains contrast
  colorBrandBackgroundStatic: brand[90], // the brand mark; decorative
  colorBrandBackground2: coralDark[900],
  colorBrandBackgroundGradient:
    `radial-gradient(80% 60% at 0% 0%, ${coralDark[900]} 0%, transparent 60%), ` +
    `radial-gradient(80% 60% at 100% 0%, ${sunDark.tint} 0%, transparent 60%)`,
  colorBrandStroke1: coralDark[300],
  colorBrandStroke2: coralDark[900],

  colorNeutralShadowAmbient: blackAlpha[30],
  colorNeutralShadowKey: blackAlpha[40],
  colorNeutralShadowKeyDarker: blackAlpha[55],
});

import { cream, sand, slate, slateAlpha, sun, white, whiteAlpha } from '../global/colors';
import type { BrandVariants, ColorTokens } from '../types';

/** Neutral and brand alias tokens for the light theme, generated from a brand ramp. */
export const generateColorTokens = (brand: BrandVariants): ColorTokens => ({
  colorNeutralForeground1: slate[17], // body ink
  colorNeutralForeground2: slate[40], // secondary text, metadata, chips, segments: 5.35:1 on wells
  colorNeutralForeground3: slate[43], // hints, placeholders, durations, footers: 4.75:1 on wells
  colorNeutralForegroundDisabled: slate[65], // grab handles, window dots, empty stars; never live text
  colorNeutralForegroundOnBrand: white,
  colorNeutralForegroundInverted: white, // text on the inverted fill: ink chip, pressed filter chip
  colorNeutralForegroundStaticInverted: white, // text over a photo or its scrim, in any theme

  colorNeutralBackground1: white, // cards, dialogs, inputs
  colorNeutralBackground2: cream, // the page
  colorNeutralBackground3: sand, // recessed wells, locked blocks
  colorNeutralBackgroundInverted: slate[17], // selected filter chip, tooltips
  colorBackgroundOverlay: slateAlpha[40], // the CDK dialog backdrop
  colorBackgroundOverlayStrong: slateAlpha[72], // pill behind 12px white text over a photo (WCAG 1.4.3)
  colorNeutralStencil2Alpha: whiteAlpha[60], // the skeleton's moving highlight

  colorNeutralStroke1: slateAlpha[16],
  colorNeutralStroke2: slateAlpha[8],
  colorNeutralStrokeAccessible: slate[53], // field borders, the off switch track, chip and dashed edges: 3.20:1 on wells
  colorStrokeFocus2: brand[70], // 5.56:1 on the canvas, 5.18:1 on wells (WCAG 1.4.11)

  colorBrandForeground1: brand[90],
  colorBrandForeground2: brand[70], // coral text that passes AA on colorBrandBackground2
  colorBrandBackground: brand[80], // the one coral button per screen; white label passes AA
  colorBrandBackgroundHover: `color-mix(in srgb, ${brand[80]} 94%, #000)`,
  colorBrandBackgroundStatic: brand[90], // the brand mark; decorative, never behind text
  colorBrandBackground2: brand[160],
  colorBrandBackgroundGradient:
    `radial-gradient(80% 60% at 0% 0%, ${brand[160]} 0%, transparent 60%), ` +
    `radial-gradient(80% 60% at 100% 0%, ${sun.tint50} 0%, transparent 60%)`,
  colorBrandStroke1: brand[90],
  colorBrandStroke2: brand[160],

  colorNeutralShadowAmbient: slateAlpha[4],
  colorNeutralShadowKey: slateAlpha[6],
  colorNeutralShadowKeyDarker: slateAlpha[12],
});

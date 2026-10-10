import { cream, sand, slate, slateAlpha, sun, white } from '../global/colors';
import type { BrandVariants, ColorTokens } from '../types';

/** Neutral and brand alias tokens for the light theme, generated from a brand ramp. */
export const generateColorTokens = (brand: BrandVariants): ColorTokens => ({
  colorNeutralForeground1: slate[17], // body ink
  colorNeutralForeground2: slate[46], // secondary text, metadata
  colorNeutralForeground3: slate[65], // hints, placeholders, disabled
  colorNeutralForegroundOnBrand: white,

  colorNeutralBackground1: white, // cards, dialogs, inputs
  colorNeutralBackground2: cream, // the page
  colorNeutralBackground3: sand, // recessed wells, locked blocks
  colorNeutralBackgroundInverted: slate[17], // selected filter chip, tooltips
  colorBackgroundOverlay: slateAlpha[40], // the CDK dialog backdrop

  colorNeutralStroke1: slateAlpha[16],
  colorNeutralStroke2: slateAlpha[8],
  colorNeutralStrokeAccessible: slate[65], // grab handles, dashed affordances
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

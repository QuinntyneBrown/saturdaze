import { brandSaturdaze } from './global/brandColors';
import { saturdazeLightTheme, responsiveOverrides } from './themes/index';
import { themeToCss, themeToCssVariables } from './themeToCss';
import { themeToTokensObject } from './themeToTokensObject';
import { tokens } from './tokens';
import { createLightTheme } from './utils/createLightTheme';

describe('design tokens', () => {
  it('maps every theme key to its CSS variable', () => {
    expect(Object.keys(tokens).sort()).toEqual(Object.keys(saturdazeLightTheme).sort());
    for (const [key, value] of Object.entries(tokens)) {
      expect(value).toBe(`var(--${key})`);
    }
    expect(themeToTokensObject(saturdazeLightTheme)).toEqual(tokens);
  });

  it('derives brand roles from the ramp', () => {
    const theme = createLightTheme(brandSaturdaze);
    expect(theme.colorBrandBackground).toBe('#e07856');
    expect(theme.colorBrandForeground2).toBe('#a04b2c');
    expect(theme.colorBrandBackground2).toBe('#fbe7de');
    expect(theme.colorStrokeFocus2).toBe(brandSaturdaze[80]);
  });

  it('re-brands every brand role from a new ramp', () => {
    const ramp = { ...brandSaturdaze, 70: '#003366', 80: '#0066cc', 160: '#e6f0fa' };
    const theme = createLightTheme(ramp);
    expect(theme.colorBrandBackground).toBe('#0066cc');
    expect(theme.colorBrandStroke1).toBe('#0066cc');
    expect(theme.colorBrandForeground2).toBe('#003366');
    expect(theme.colorBrandBackground2).toBe('#e6f0fa');
    expect(theme.colorNeutralForeground1).toBe(saturdazeLightTheme.colorNeutralForeground1);
  });

  it('only retunes tokens the theme defines', () => {
    for (const { tokens: retune } of responsiveOverrides) {
      for (const key of Object.keys(retune)) expect(key in saturdazeLightTheme).toBe(true);
    }
  });

  it('serialises a theme to custom properties and media blocks', () => {
    expect(themeToCssVariables({ shadow4: 'none' })).toEqual({ '--shadow4': 'none' });
    const css = themeToCss({ layoutGutter: '16px' }, [
      { media: '(min-width: 720px)', tokens: { layoutGutter: '24px' } },
    ]);
    expect(css).toBe(
      ':root {\n  --layoutGutter: 16px;\n}\n\n' +
        '@media (min-width: 720px) {\n  :root {\n    --layoutGutter: 24px;\n  }\n}',
    );
  });
});

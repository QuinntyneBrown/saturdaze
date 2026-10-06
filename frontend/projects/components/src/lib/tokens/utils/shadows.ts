import type { ShadowTokens } from '../types';

/** Soft, paper-like elevation built from the theme's shadow colours. */
export function createShadowTokens(ambient: string, key: string, keyDarker: string): ShadowTokens {
  return {
    shadow4: `0 1px 2px ${ambient}, 0 2px 6px ${ambient}`, // cards off the cream page
    shadow16: `0 4px 10px ${key}, 0 10px 24px ${key}`, // hover, floating chrome
    shadow28: `0 20px 40px ${keyDarker}`, // dialogs and menus
  };
}

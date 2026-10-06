/** Centres an inline (`static`) dialog panel in the fullscreen canvas. */
export const specimen = (dialog: string): string => `
  <div style="min-height: 100vh; padding: 24px var(--sd-gutter); display: grid; place-items: center; background: var(--sd-surface-2)">
    ${dialog}
  </div>
`;

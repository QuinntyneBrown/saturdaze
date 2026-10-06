/** Centres an inline (`static`) dialog panel in the fullscreen canvas. */
export const specimen = (dialog: string): string => `
  <div style="min-height: 100vh; padding: 24px var(--layoutGutter); display: grid; place-items: center; background: var(--colorNeutralBackground3)">
    ${dialog}
  </div>
`;

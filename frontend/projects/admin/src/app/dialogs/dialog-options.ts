/** The options every admin dialog opens with: a sheet below 720px, a modal above (see styles.scss). */
export const DIALOG_OPTIONS = {
  autoFocus: 'first-tabbable' as const,
  restoreFocus: true,
  panelClass: 'sd-dialog-panel',
  backdropClass: 'sd-dialog-backdrop',
};

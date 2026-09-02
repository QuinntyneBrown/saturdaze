/** The three family-level switches persisted on the family row. */
export type PreferenceKey = 'budget' | 'tryNew' | 'fridayPreview';

/**
 * Preference Toggle.
 */
export interface PreferenceToggle {
  /**
   * Key.
   */
  readonly key: PreferenceKey;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle: string;
  /**
   * Checked.
   */
  readonly checked: boolean;
}

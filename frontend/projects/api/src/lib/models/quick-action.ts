/** What tapping a quick action does. */
export type QuickActionKind = 'regenerate' | 'lock' | 'share';

/**
 * Quick Action.
 */
export interface QuickAction {
  /**
   * Kind.
   */
  readonly kind: QuickActionKind;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle: string;
  /**
   * Icon.
   */
  readonly icon: string;
}

/**
 * Quick Action.
 */
export interface QuickAction {
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
  /**
   * Href.
   */
  readonly href?: string;
}

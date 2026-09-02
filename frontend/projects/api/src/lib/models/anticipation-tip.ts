/**
 * Anticipation Tip.
 */
export interface AnticipationTip {
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Headline.
   */
  readonly headline: string;
  /**
   * Body.
   */
  readonly body: string;
  /**
   * Cta.
   */
  readonly cta?: string;
  /**
   * Href — where the CTA navigates.
   */
  readonly href?: string;
}

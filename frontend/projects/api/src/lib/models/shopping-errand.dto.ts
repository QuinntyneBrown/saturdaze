/**
 * Shopping Errand Dto.
 */
export interface ShoppingErrandDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Description.
   */
  readonly description: string;
  /**
   * Estimated Minutes.
   */
  readonly estimatedMinutes: number;
  /**
   * Done.
   */
  readonly done: boolean;
}

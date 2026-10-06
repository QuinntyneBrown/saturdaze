/**
 * Where an approved event happens (L2-087 AC3). Null coordinates keep the
 * submission's own location; the API refuses an approval with neither.
 */
export interface ApprovalLocation {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly address: string;
}
